<#
================================================================================
 DeutschPrep -- Owner-Mode one-click bootstrapper (Windows)
================================================================================

 WHAT THIS IS
 ------------
 An IDEMPOTENT, RE-RUNNABLE PowerShell bootstrapper that sets up "Owner Mode"
 for DeutschPrep on a fresh Windows machine. It DOWNLOADS the app at runtime;
 it does NOT bundle a Node runtime or any binaries.

 Owner Mode = run `npm run owner` from the repo root, which builds the frontend
 and runs `node tools/claude-bridge/server.mjs --serve frontend/dist --open`,
 serving the app + a local Claude bridge on http://localhost:8787.

 WHAT IT DOES (each step is guarded so re-runs are safe):
   1. Print a transparency banner (what it will do; stores no credentials).
   2. Pick an install folder (GUI picker, fallback to a typed path).
   3. Detect Node + git; install via winget (or Node MSI) if missing.
      Handles the PATH-refresh gotcha so freshly-installed tools are usable.
   4. Clone the repo (or `git pull` if it already exists; zip fallback).
   5. `npm install` in the repo root.
   6. Install Claude Code -- ONLY if it isn't already present (one method, no
      duplicate installs). No raw `claude doctor` wall is ever printed.
   7. Unset ANTHROPIC_API_KEY, then prompt an interactive `claude` login so
      Owner Mode draws from the user's Pro/Max SUBSCRIPTION (not the API), and
      verify it with a clean machine-readable probe (`claude -p ... --output-format json`).
   8. Start the bridge with `npm run owner`.
   9. OPTIONAL Cloudflare tunnel (only if the user opts in).
  10. When the bridge is up, open BOTH the local app (http://localhost:8787) and the
      HOSTED app's Settings page so the user can connect their plan to the hosted site.
  11. Write a start-owner.cmd launcher + a Desktop shortcut for next time.

 SECURITY / HONESTY
 ------------------
 * This script stores NO credentials. The Claude login lives in Claude Code's
   OWN credential store (keychain), never here.
 * It is fully auditable -- read it top to bottom. It only runs the commands
   documented in the banner.
 * It is removable: delete the install folder and run
   `npm uninstall -g @anthropic-ai/claude-code`.

 USAGE
 -----
   powershell -ExecutionPolicy Bypass -File install.ps1
   (Inno Setup / PS2EXE wrappers call it exactly this way.)
================================================================================
#>

[CmdletBinding()]
param(
    # Optional: pass a target folder to skip the picker (used by silent installs).
    [string]$InstallRoot = "",
    # Optional: skip the GUI folder picker entirely and use the default/param.
    [switch]$NoPrompt
)

# Be strict but stay resilient: we handle most failures explicitly with try/catch.
$ErrorActionPreference = "Stop"

# ==============================================================================
#  FIX 1 -- force UTF-8 so Claude Code's Unicode TUI/diagnostics render correctly.
#  Without this the default OEM code page mangles box-drawing + emoji into mojibake
#  (the "ÒêÆ" garbage seen during the login step). Each line is wrapped in try/catch:
#  [Console]::InputEncoding can throw when stdin is redirected, and $PSStyle only
#  exists on PowerShell 7+. The generated start-owner.cmd does the same via `chcp`.
# ==============================================================================
try { chcp 65001 > $null } catch {}
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
try { [Console]::InputEncoding  = [System.Text.Encoding]::UTF8 } catch {}
try { $OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
try { if ($PSStyle) { $PSStyle.OutputRendering = 'PlainText' } } catch {}

# --- Constants (the FACTS this bootstrapper is pinned to) ----------------------
$REPO_URL       = "https://github.com/Golden007-prog/Bruhdeutschland.git"
$ZIP_URL        = "https://codeload.github.com/Golden007-prog/Bruhdeutschland/zip/refs/heads/main"
$ZIP_INNER_DIR  = "Bruhdeutschland-main"   # folder name inside the downloaded zip
$REPO_DIRNAME   = "Bruhdeutschland"        # final on-disk folder name
$BRIDGE_PORT    = 8787
$BRIDGE_URL     = "http://localhost:$BRIDGE_PORT"
# Hosted GitHub Pages app. After the local bridge is up we open its Settings page so the user can
# connect THEIR Claude plan to the hosted site (the page auto-probes $BRIDGE_URL/health). Same shared
# deployment for every user, so the bridge's CORS allowlist already trusts this origin.
$HOSTED_BASE     = "https://golden007-prog.github.io/Bruhdeutschland"
$HOSTED_SETTINGS = "$HOSTED_BASE/#/settings"
$CLAUDE_PKG     = "@anthropic-ai/claude-code"
# Cloudflared pinned download (used only if winget is unavailable AND user opts in).
$CLOUDFLARED_URL = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"

# ==============================================================================
#  Small UI helpers -- keep every section visually distinct & auditable.
# ==============================================================================
function Write-Section($title) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}
function Write-Step($msg)  { Write-Host "  -> $msg" -ForegroundColor White }
function Write-Ok($msg)    { Write-Host "  [ok] $msg" -ForegroundColor Green }
function Write-Warn2($msg) { Write-Host "  [!]  $msg" -ForegroundColor Yellow }
function Write-Err2($msg)  { Write-Host "  [x]  $msg" -ForegroundColor Red }

# ==============================================================================
#  PATH-refresh gotcha helper.
#  A binary installed *during this session* (winget/MSI) is NOT yet on the
#  $env:Path of THIS process. We rebuild $env:Path from the Machine + User
#  registry hives so newly-installed node/npm/git become callable immediately.
# ==============================================================================
function Update-SessionPath {
    try {
        $machine = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
        $user    = [System.Environment]::GetEnvironmentVariable("Path", "User")
        $env:Path = (@($machine, $user) | Where-Object { $_ }) -join ";"
        Write-Step "Refreshed PATH from machine + user registry."
    } catch {
        Write-Warn2 "Could not refresh PATH from registry: $($_.Exception.Message)"
    }
}

# Resolve a command to its absolute path even if PATH is stale. We probe the
# live PATH first, then a few well-known install locations as a fallback so we
# can call the binary by absolute path when the session PATH hasn't caught up.
function Resolve-Tool($name, [string[]]$extraDirs = @()) {
    # Select-Object -First 1: Get-Command can return MULTIPLE matches (e.g. claude.cmd + claude.ps1);
    # taking .Source off an array yields System.Object[]. Coerce to a single [string] path.
    $cmd = Get-Command $name -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($cmd) { return [string]$cmd.Source }
    $candidates = @()
    foreach ($d in $extraDirs) {
        foreach ($ext in @("", ".exe", ".cmd")) {
            $candidates += (Join-Path $d ($name + $ext))
        }
    }
    foreach ($p in $candidates) {
        if (Test-Path $p) { return [string](Resolve-Path $p).Path }
    }
    return $null
}

# Common locations Node/npm/git land in, used by Resolve-Tool fallbacks.
$NodeDirs = @(
    "$env:ProgramFiles\nodejs",
    "${env:ProgramFiles(x86)}\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs"
)
$GitDirs = @(
    "$env:ProgramFiles\Git\cmd",
    "$env:ProgramFiles\Git\bin",
    "${env:ProgramFiles(x86)}\Git\cmd"
)

# ==============================================================================
#  STEP 1 -- Transparency banner
# ==============================================================================
function Show-Banner {
    Clear-Host
    Write-Host @"

  ____             _            _     ____
 |  _ \  ___ _   _| |_ ___  ___| |__ |  _ \ _ __ ___ _ __
 | | | |/ _ \ | | | __/ __|/ __| '_ \| |_) | '__/ _ \ '_ \
 | |_| |  __/ |_| | || (__ \__ \ | | |  __/| | |  __/ |_) |
 |____/ \___|\__,_|\__\___||___/_| |_|_|   |_|  \___| .__/
                                                    |_|
        Owner-Mode setup  (auditable bootstrapper)

"@ -ForegroundColor Magenta

    Write-Host " This script will, on YOUR machine and with YOUR confirmation:" -ForegroundColor White
    Write-Host ""
    Write-Host "   1. Let you choose an install folder." -ForegroundColor Gray
    Write-Host "   2. Check for Node.js + git, and install them if missing (winget/MSI)." -ForegroundColor Gray
    Write-Host "   3. Download the DeutschPrep app source from GitHub:" -ForegroundColor Gray
    Write-Host "        $REPO_URL" -ForegroundColor DarkGray
    Write-Host "   4. Run 'npm install' to fetch app dependencies." -ForegroundColor Gray
    Write-Host "   5. Install Claude Code globally ($CLAUDE_PKG)." -ForegroundColor Gray
    Write-Host "   6. Ask you to log in to YOUR OWN Claude subscription (in Claude Code)." -ForegroundColor Gray
    Write-Host "   7. Start Owner Mode (local bridge on $BRIDGE_URL) and open the hosted" -ForegroundColor Gray
    Write-Host "      app's Settings so you can use your plan from the hosted site." -ForegroundColor Gray
    Write-Host "   8. (Optional) Start a Cloudflare tunnel -- only if you opt in." -ForegroundColor Gray
    Write-Host ""
    Write-Host " It stores NO credentials. Your Claude login is kept by Claude Code" -ForegroundColor Yellow
    Write-Host " itself (its own secure store), never by this script." -ForegroundColor Yellow
    Write-Host " It is re-runnable: running it again just updates and relaunches." -ForegroundColor Yellow
    Write-Host ""

    if (-not $NoPrompt) {
        $go = Read-Host " Continue? [Y/n]"
        if ($go -and $go.Trim().ToLower().StartsWith("n")) {
            Write-Warn2 "Cancelled by user."
            exit 0
        }
    }
}

# ==============================================================================
#  STEP 2 -- Folder picker (GUI dialog; fallback to typed path)
# ==============================================================================
function Select-InstallFolder {
    $default = Join-Path $env:USERPROFILE "DeutschPrep"

    # If a folder was passed in (silent install), trust it.
    if ($InstallRoot) {
        Write-Step "Using folder from parameter: $InstallRoot"
        return $InstallRoot
    }
    if ($NoPrompt) {
        Write-Step "Non-interactive: using default folder: $default"
        return $default
    }

    # Try the native GUI folder browser first.
    try {
        Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
        $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
        $dlg.Description = "Choose where to install DeutschPrep (Owner Mode)"
        $dlg.SelectedPath = $default
        $dlg.ShowNewFolderButton = $true
        Write-Step "Opening folder picker (a dialog window should appear)..."
        $result = $dlg.ShowDialog()
        if ($result -eq [System.Windows.Forms.DialogResult]::OK -and $dlg.SelectedPath) {
            return $dlg.SelectedPath
        }
        Write-Warn2 "Folder picker cancelled; falling back to a typed path."
    } catch {
        # Headless / Server Core / no WinForms -- fall back to Read-Host.
        Write-Warn2 "GUI folder picker unavailable ($($_.Exception.Message)); type a path instead."
    }

    $typed = Read-Host " Install folder [default: $default]"
    if ([string]::IsNullOrWhiteSpace($typed)) { return $default }
    return $typed
}

# ==============================================================================
#  STEP 3 -- Detect / install Node + git
# ==============================================================================
function Test-WingetAvailable {
    return [bool](Get-Command winget -ErrorAction SilentlyContinue)
}

function Install-NodeViaMsi {
    # Last-resort path when winget is absent: download the official Node LTS MSI
    # and install it silently with msiexec. We hardcode a recent LTS MSI URL.
    Write-Step "winget not found -- downloading the Node.js LTS MSI directly."
    $msiUrl = "https://nodejs.org/dist/v20.18.1/node-v20.18.1-x64.msi"
    $msiPath = Join-Path $env:TEMP "node-lts-x64.msi"
    try {
        Invoke-WebRequest -Uri $msiUrl -OutFile $msiPath -UseBasicParsing
        Write-Step "Running silent MSI install (msiexec /i ... /qn)..."
        $p = Start-Process msiexec.exe -ArgumentList @("/i", "`"$msiPath`"", "/qn", "/norestart") -Wait -PassThru
        if ($p.ExitCode -ne 0) { throw "msiexec exited with code $($p.ExitCode)" }
        Write-Ok "Node.js MSI installed."
    } catch {
        throw "Automatic Node.js install failed: $($_.Exception.Message). Install Node LTS manually from https://nodejs.org and re-run this script."
    } finally {
        if (Test-Path $msiPath) { Remove-Item $msiPath -ErrorAction SilentlyContinue }
    }
}

function Ensure-Node {
    Write-Step "Checking for Node.js..."
    $node = Resolve-Tool "node" $NodeDirs
    if ($node) {
        $v = & $node -v 2>$null
        Write-Ok "Node.js present: $v ($node)"
        return $node
    }

    Write-Warn2 "Node.js not found -- installing."
    try {
        if (Test-WingetAvailable) {
            Write-Step "Installing Node.js LTS via winget..."
            # -e exact id, --silent unattended; accept agreements to avoid prompts.
            winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
        } else {
            Install-NodeViaMsi
        }
    } catch {
        Write-Warn2 "winget install reported an issue: $($_.Exception.Message)"
        Write-Step "Trying the direct MSI path as a fallback..."
        Install-NodeViaMsi
    }

    # PATH-refresh gotcha: the just-installed node isn't on this session's PATH yet.
    Update-SessionPath
    $node = Resolve-Tool "node" $NodeDirs
    if (-not $node) {
        throw "Node.js was installed but is still not callable. Close and reopen the installer (or your terminal) so PATH updates, then re-run."
    }
    $v = & $node -v 2>$null
    Write-Ok "Node.js installed: $v ($node)"
    return $node
}

function Ensure-Git {
    Write-Step "Checking for git..."
    $git = Resolve-Tool "git" $GitDirs
    if ($git) {
        $v = & $git --version 2>$null
        Write-Ok "git present: $v ($git)"
        return $git
    }

    Write-Warn2 "git not found -- attempting install (optional; zip fallback exists)."
    try {
        if (Test-WingetAvailable) {
            Write-Step "Installing Git via winget..."
            winget install -e --id Git.Git --silent --accept-package-agreements --accept-source-agreements
            Update-SessionPath
            $git = Resolve-Tool "git" $GitDirs
        } else {
            Write-Warn2 "winget unavailable and no silent Git installer bundled; will use the ZIP download fallback instead of clone."
        }
    } catch {
        Write-Warn2 "Git install failed ($($_.Exception.Message)); will use the ZIP download fallback."
    }

    if ($git) {
        $v = & $git --version 2>$null
        Write-Ok "git installed: $v ($git)"
    }
    return $git   # may be $null -- caller handles zip fallback
}

# Resolve npm next to a known node path (npm.cmd ships beside node.exe on Windows).
function Resolve-Npm($nodePath) {
    $npm = Resolve-Tool "npm" $NodeDirs
    if ($npm) { return $npm }
    if ($nodePath) {
        $dir = Split-Path $nodePath -Parent
        foreach ($n in @("npm.cmd", "npm.exe", "npm")) {
            $p = Join-Path $dir $n
            if (Test-Path $p) { return $p }
        }
    }
    return $null
}

# ==============================================================================
#  STEP 4 -- Get the source (git clone / pull, or zip fallback)
# ==============================================================================
function Get-Source($parentFolder, $gitPath) {
    # Final repo path lives INSIDE the chosen parent folder, under a stable name.
    if (-not (Test-Path $parentFolder)) {
        New-Item -ItemType Directory -Path $parentFolder -Force | Out-Null
    }
    $repoPath = Join-Path $parentFolder $REPO_DIRNAME

    # --- Idempotent path: repo already there ---------------------------------
    if (Test-Path (Join-Path $repoPath ".git")) {
        Write-Step "Existing git checkout found -- pulling latest (idempotent)."
        try {
            Push-Location $repoPath
            & $gitPath pull --ff-only
            Write-Ok "Repository updated (git pull)."
        } catch {
            Write-Warn2 "git pull failed ($($_.Exception.Message)); keeping the existing checkout."
        } finally {
            Pop-Location
        }
        return $repoPath
    }
    if (Test-Path $repoPath) {
        # Folder exists but isn't a git repo (e.g. prior zip download). Reuse it.
        Write-Step "Folder already present (non-git); reusing: $repoPath"
        return $repoPath
    }

    # --- Fresh clone via git -------------------------------------------------
    if ($gitPath) {
        try {
            Write-Step "Cloning $REPO_URL ..."
            & $gitPath clone $REPO_URL $repoPath
            if (Test-Path (Join-Path $repoPath ".git")) {
                Write-Ok "Cloned into $repoPath"
                return $repoPath
            }
            Write-Warn2 "Clone did not produce a repo; trying the ZIP fallback."
        } catch {
            Write-Warn2 "git clone failed ($($_.Exception.Message)); trying the ZIP fallback."
        }
    }

    # --- ZIP fallback (no git, or clone failed) ------------------------------
    Write-Step "Downloading source ZIP (no git needed)..."
    $zipPath = Join-Path $env:TEMP "deutschprep-main.zip"
    $tmpExtract = Join-Path $env:TEMP ("deutschprep-extract-" + [guid]::NewGuid().ToString("N"))
    try {
        Invoke-WebRequest -Uri $ZIP_URL -OutFile $zipPath -UseBasicParsing
        Write-Step "Extracting..."
        Expand-Archive -Path $zipPath -DestinationPath $tmpExtract -Force
        # GitHub zips extract to "<repo>-main/"; normalize that to our repo name.
        $inner = Join-Path $tmpExtract $ZIP_INNER_DIR
        if (-not (Test-Path $inner)) {
            # Be tolerant: just take whatever single top-level folder exists.
            $inner = (Get-ChildItem $tmpExtract -Directory | Select-Object -First 1).FullName
        }
        if (-not $inner -or -not (Test-Path $inner)) {
            throw "Could not locate extracted source folder."
        }
        Move-Item -Path $inner -Destination $repoPath
        Write-Ok "Source extracted to $repoPath"
        return $repoPath
    } catch {
        throw "Could not download/extract the source ZIP: $($_.Exception.Message)"
    } finally {
        if (Test-Path $zipPath) { Remove-Item $zipPath -ErrorAction SilentlyContinue }
        if (Test-Path $tmpExtract) { Remove-Item $tmpExtract -Recurse -Force -ErrorAction SilentlyContinue }
    }
}

# ==============================================================================
#  STEP 5 -- npm install
# ==============================================================================
function Install-Deps($repoPath, $npmPath) {
    # This is NOT an npm-workspaces monorepo: a root `npm install` does NOT install frontend's deps, so
    # tsc/vite never land and `npm run owner` fails with "'tsc' is not recognized". Install EACH package
    # in its own directory (root + frontend; tools/claude-bridge declares no deps). Prefer `npm ci` when a
    # lockfile exists, falling back to `npm install`.
    foreach ($pkg in @("", "frontend")) {
        $dir = if ($pkg) { Join-Path $repoPath $pkg } else { $repoPath }
        if (-not (Test-Path (Join-Path $dir "package.json"))) { continue }
        $label = if ($pkg) { $pkg } else { "root" }
        $useCi = Test-Path (Join-Path $dir "package-lock.json")
        $verb  = if ($useCi) { "ci" } else { "install" }
        Write-Step "Installing $label dependencies (npm $verb)... this can take a minute."
        try {
            Push-Location $dir
            & $npmPath $verb
            if ($LASTEXITCODE -ne 0 -and $useCi) {
                Write-Warn2 "npm ci failed in $label (lockfile drift?); retrying with npm install."
                & $npmPath install
            }
            if ($LASTEXITCODE -ne 0) { throw "npm exited with code $LASTEXITCODE" }
            Write-Ok "$label dependencies installed."
        } catch {
            throw "npm install failed in ${label}: $($_.Exception.Message)"
        } finally {
            Pop-Location
        }
    }
}

# ==============================================================================
#  Resolve a SINGLE 'claude' launcher that is a .cmd/.exe -- NEVER a .ps1.
#  Why this matters (FIX 2 root cause): invoking the npm-generated `claude.ps1`
#  shim with `&` runs it inside THIS PowerShell runspace, where Claude's stdout
#  (e.g. its auto-update line "changed 2 packages in 7s") can get parsed as a
#  command -> the bogus "... is not recognized as the name of a cmdlet" error.
#  A .cmd/.exe runs as a clean child process whose output is never re-parsed.
# ==============================================================================
function Resolve-ClaudeLauncher {
    $all = @(Get-Command claude -All -ErrorAction SilentlyContinue)
    # Prefer a real executable / cmd wrapper; explicitly skip the .ps1 shim.
    foreach ($ext in @(".cmd", ".exe", ".bat")) {
        $hit = $all |
            Where-Object { $_.Source -and ([System.IO.Path]::GetExtension([string]$_.Source)).ToLower() -eq $ext } |
            Select-Object -First 1
        if ($hit) { return [string]$hit.Source }
    }
    # Any remaining non-.ps1 source (e.g. an extensionless native shim).
    $nonPs1 = $all |
        Where-Object { $_.Source -and ([System.IO.Path]::GetExtension([string]$_.Source)).ToLower() -ne ".ps1" } |
        Select-Object -First 1
    if ($nonPs1) { return [string]$nonPs1.Source }
    # Probe well-known install locations as a last resort.
    $dirs = @("$env:APPDATA\npm", "$env:LOCALAPPDATA\Programs\claude", "$env:ProgramFiles\nodejs", "$env:USERPROFILE\.local\bin")
    foreach ($d in $dirs) {
        foreach ($n in @("claude.cmd", "claude.exe", "claude.bat")) {
            $p = Join-Path $d $n
            if (Test-Path $p) { return [string](Resolve-Path $p).Path }
        }
    }
    return $null
}

# One-LINE multi-install hint (FIX 3). We detect npm-global + native side-by-side
# ourselves instead of running `claude doctor` and dumping its diagnostic wall.
function Show-ClaudeMultiInstallHint {
    $hasNpm = Test-Path (Join-Path "$env:APPDATA\npm" "claude.cmd")
    $hasNative = $false
    foreach ($d in @("$env:LOCALAPPDATA\Programs\claude", "$env:USERPROFILE\.local\bin")) {
        foreach ($n in @("claude.exe", "claude")) {
            if (Test-Path (Join-Path $d $n)) { $hasNative = $true }
        }
    }
    if ($hasNpm -and $hasNative) {
        Write-Warn2 "Multiple Claude Code installs detected (npm-global + native). Optional cleanup: npm -g uninstall $CLAUDE_PKG"
    }
}

# ==============================================================================
#  STEP 6 -- Install Claude Code (detect-first, one method, no doctor dump)
# ==============================================================================
function Install-ClaudeCode($npmPath) {
    # FIX 3: detect an existing install FIRST so we never install a second copy.
    Update-SessionPath
    $existing = Resolve-ClaudeLauncher
    if ($existing) {
        $ver = (& $existing --version 2>$null | Select-Object -First 1)
        if ($ver) { Write-Ok "Claude Code already installed: $ver" }
        else       { Write-Ok "Claude Code already installed: $existing" }
        Show-ClaudeMultiInstallHint   # one-line hint only; never the raw doctor wall
        return $existing
    }

    Write-Step "Installing Claude Code globally ($CLAUDE_PKG)..."
    try {
        & $npmPath install -g $CLAUDE_PKG
        if ($LASTEXITCODE -ne 0) { throw "npm install -g exited with code $LASTEXITCODE" }
        Write-Ok "Claude Code installed."
    } catch {
        throw "Failed to install Claude Code: $($_.Exception.Message)"
    }

    # Make sure the global npm bin (where 'claude' lands) is on this session PATH.
    Update-SessionPath
    $claude = Resolve-ClaudeLauncher
    if (-not $claude) {
        Write-Warn2 "'claude' not on PATH yet -- it usually lands in $env:APPDATA\npm. A new terminal will pick it up."
        $claude = Join-Path "$env:APPDATA\npm" "claude.cmd"
    }
    $ver = (& $claude --version 2>$null | Select-Object -First 1)
    if ($ver) { Write-Ok "Claude Code $ver" }
    return $claude
}

# ==============================================================================
#  STEP 7 -- Claude subscription login (CRITICAL: unset ANTHROPIC_API_KEY)
# ==============================================================================

# FIX 2 (verify half): confirm the login with a clean, machine-readable probe --
# NOT by scraping the interactive TUI. `claude -p ... --output-format json` returns
# a JSON envelope ({subtype:"success", is_error:false, ...}); plain `-p` (never
# --bare) uses the OAuth/subscription credential. --strict-mcp-config + the limited
# setting-sources keep the operator's personal MCP servers/hooks out of the probe so
# their auth noise can't pollute the JSON (FIX 4). stderr is discarded.
function Test-ClaudeConnected($launcher, $repoPath) {
    Write-Step "Verifying the subscription login (clean JSON probe)..."
    if (-not $launcher) {
        Write-Warn2 "Could not locate 'claude' to verify. Run 'claude' yourself and sign in to your plan."
        return $false
    }
    $pushed = $false
    if ($repoPath -and (Test-Path $repoPath)) { Push-Location $repoPath; $pushed = $true }
    try {
        $sw  = [System.Diagnostics.Stopwatch]::StartNew()
        $raw = & $launcher -p "ping" --output-format json --strict-mcp-config --setting-sources project,local 2>$null | Out-String
        $sw.Stop()
        $obj = $raw | ConvertFrom-Json -ErrorAction Stop

        $props     = $obj.PSObject.Properties.Name
        $isErr     = ($props -contains "is_error") -and [bool]$obj.is_error
        $subtypeOk = ($props -contains "subtype") -and ($obj.subtype -eq "success")
        if ((-not $isErr) -or $subtypeOk) {
            # Model name lives under modelUsage keys (e.g. "claude-opus-4-8[1m]"); no top-level field.
            $model = $null
            if ($props -contains "model") { $model = [string]$obj.model }
            if (-not $model -and ($props -contains "modelUsage") -and $obj.modelUsage) {
                $model = ($obj.modelUsage.PSObject.Properties.Name | Select-Object -First 1)
            }
            $ms = if ($props -contains "duration_ms") { [int]$obj.duration_ms } else { [int]$sw.ElapsedMilliseconds }
            $modelText = if ($model) { "$model, " } else { "" }
            Write-Ok "Claude (your plan): Connected (${modelText}${ms} ms)"
            return $true
        }
        Write-Warn2 "Claude responded but reported an error. Run 'claude' and confirm you're logged in to your plan."
        return $false
    } catch {
        Write-Warn2 "Could not confirm the Claude login: $($_.Exception.Message)"
        Write-Step  "Open a terminal, run 'claude' to finish logging in, then re-run start-owner.cmd."
        return $false
    } finally {
        if ($pushed) { Pop-Location }
    }
}

function Invoke-ClaudeLogin($claudePath, $repoPath) {
    Write-Section "Log in to YOUR Claude subscription"
    Write-Host ""
    Write-Host "  IMPORTANT: Owner Mode should use your Claude Pro/Max SUBSCRIPTION," -ForegroundColor Yellow
    Write-Host "  not pay-per-call API billing." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  If the ANTHROPIC_API_KEY environment variable is set, Claude Code" -ForegroundColor Yellow
    Write-Host "  bills the API (you pay per token) INSTEAD of using your subscription." -ForegroundColor Yellow
    Write-Host "  So we are UNSETTING it for this session before you log in." -ForegroundColor Yellow
    Write-Host ""

    # CRITICAL: clear the API key for THIS process so the login + bridge use the
    # subscription, not the API. (This only affects this session, not your system.)
    Remove-Item Env:ANTHROPIC_API_KEY -ErrorAction SilentlyContinue
    if (Test-Path Env:ANTHROPIC_API_KEY) {
        Write-Warn2 "ANTHROPIC_API_KEY is still set somehow; please unset it manually before relying on the subscription."
    } else {
        Write-Ok "ANTHROPIC_API_KEY is unset for this session."
    }

    # Resolve a .cmd/.exe launcher (never the .ps1 shim) so the interactive login
    # runs as a clean child process whose output is NEVER re-parsed by PowerShell.
    $launcher = Resolve-ClaudeLauncher
    if (-not $launcher) { $launcher = $claudePath }

    if ($NoPrompt) {
        Write-Warn2 "Non-interactive run: skipping the interactive 'claude' login. Run 'claude' yourself to log in."
        Test-ClaudeConnected $launcher $repoPath | Out-Null
        return
    }

    Write-Host ""
    Write-Host "  A browser-based Claude login will now open. Sign in with the account" -ForegroundColor White
    Write-Host "  that has your Pro/Max plan. When you see the chat prompt, you're in --" -ForegroundColor White
    Write-Host "  you can type /exit (or Ctrl+C) to return here." -ForegroundColor White
    Write-Host ""
    Read-Host " Press Enter to start the Claude login" | Out-Null

    $pushed = $false
    if ($repoPath -and (Test-Path $repoPath)) { Push-Location $repoPath; $pushed = $true }
    try {
        # FIX 2: launch interactively, INHERITING this console. We do NOT capture its
        # output to a variable, do NOT pipe it, and do NOT Invoke-Expression/& its text.
        # Claude Code keeps the credential in its OWN store; nothing is scraped here.
        & $launcher
    } catch {
        Write-Warn2 "The Claude login session ended unexpectedly: $($_.Exception.Message)"
    } finally {
        if ($pushed) { Pop-Location }
    }
    Write-Ok "Returned from Claude login."

    # Verify with the clean probe instead of trusting the TUI text.
    Test-ClaudeConnected $launcher $repoPath | Out-Null
}

# ==============================================================================
#  STEP 9 -- Optional Cloudflare tunnel (opt-in only)
# ==============================================================================
function Resolve-Cloudflared {
    # Single-string path (Select-Object -First 1 + [string]) — never an array, or Start-Process -FilePath
    # throws "Cannot convert System.Object[] to System.String".
    $cf = Get-Command cloudflared -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($cf) { return [string]$cf.Source }
    # Try winget.
    if (Test-WingetAvailable) {
        try {
            Write-Step "Installing cloudflared via winget..."
            winget install -e --id Cloudflare.cloudflared --silent --accept-package-agreements --accept-source-agreements
            Update-SessionPath   # refresh PATH so the freshly-installed cloudflared resolves in-process
            $cf = Get-Command cloudflared -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($cf) { return [string]$cf.Source }
        } catch {
            Write-Warn2 "winget cloudflared install failed ($($_.Exception.Message)); downloading the exe directly."
        }
    }
    # Direct download fallback (pinned releases URL).
    try {
        $dest = Join-Path $env:LOCALAPPDATA "cloudflared\cloudflared.exe"
        New-Item -ItemType Directory -Path (Split-Path $dest) -Force | Out-Null
        Write-Step "Downloading cloudflared-windows-amd64.exe..."
        Invoke-WebRequest -Uri $CLOUDFLARED_URL -OutFile $dest -UseBasicParsing
        return [string]$dest
    } catch {
        Write-Warn2 "Could not obtain cloudflared: $($_.Exception.Message)"
        return $null
    }
}

function Start-OptionalTunnel {
    if ($NoPrompt) { return }
    Write-Section "Optional: public HTTPS tunnel (Cloudflare)"
    Write-Host ""
    Write-Host "  By default Owner Mode is LOCAL ONLY ($BRIDGE_URL)." -ForegroundColor White
    Write-Host "  A Cloudflare tunnel exposes your LOCAL bridge over a temporary public" -ForegroundColor White
    Write-Host "  HTTPS URL, so you can use your plan from the HOSTED site." -ForegroundColor White
    Write-Host "  This is OPTIONAL and OFF unless you choose it." -ForegroundColor White
    Write-Host ""
    $ans = Read-Host " Start a Cloudflare tunnel now? [y/N]"
    if (-not ($ans -and $ans.Trim().ToLower().StartsWith("y"))) {
        Write-Step "Skipping tunnel (local-only Owner Mode)."
        return
    }

    $cf = Resolve-Cloudflared
    if (-not $cf) {
        Write-Err2 "cloudflared is unavailable; skipping the tunnel."
        return
    }

    Write-Step "Starting tunnel: cloudflared tunnel --url $BRIDGE_URL"
    Write-Host "  Watch the output below for a line like:" -ForegroundColor Gray
    Write-Host "    https://<random-words>.trycloudflare.com" -ForegroundColor Gray
    Write-Host ""

    # Launch cloudflared and tee its output to a temp log so we can grab the URL.
    $logPath = Join-Path $env:TEMP ("cloudflared-" + [guid]::NewGuid().ToString("N") + ".log")
    try {
        $proc = Start-Process -FilePath ([string]$cf) `
            -ArgumentList @("tunnel", "--url", $BRIDGE_URL) `
            -RedirectStandardOutput $logPath `
            -RedirectStandardError  ($logPath + ".err") `
            -PassThru -WindowStyle Hidden

        # Poll the log for the trycloudflare URL for up to ~30s.
        $url = $null
        for ($i = 0; $i -lt 30 -and -not $url; $i++) {
            Start-Sleep -Seconds 1
            foreach ($f in @($logPath, ($logPath + ".err"))) {
                if (Test-Path $f) {
                    $m = Select-String -Path $f -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" -ErrorAction SilentlyContinue | Select-Object -First 1
                    if ($m) { $url = $m.Matches[0].Value; break }
                }
            }
        }

        if ($url) {
            Write-Host ""
            Write-Host "  ============================================================" -ForegroundColor Green
            Write-Host "   PUBLIC BRIDGE URL:" -ForegroundColor Green
            Write-Host "     $url" -ForegroundColor Green
            Write-Host "  ============================================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "  Copy that URL and paste it into the hosted site's Owner-Mode" -ForegroundColor White
            Write-Host "  card (Settings -> Bridge URL). Keep this window open to keep" -ForegroundColor White
            Write-Host "  the tunnel alive (PID $($proc.Id))." -ForegroundColor White
            try { Set-Clipboard -Value $url; Write-Ok "URL copied to your clipboard." } catch {}
        } else {
            Write-Warn2 "Tunnel started (PID $($proc.Id)) but no URL was captured yet. Check: $logPath"
        }
    } catch {
        Write-Err2 "Failed to start cloudflared: $($_.Exception.Message)"
    }
}

# ==============================================================================
#  STEP 11 -- Launcher (start-owner.cmd) + Desktop shortcut
# ==============================================================================
function Write-Launcher($repoPath, $npmPath) {
    $cmdPath = Join-Path $repoPath "start-owner.cmd"
    # The launcher re-runs Owner Mode and re-applies the API-key safety unset.
    # It assumes setup already happened (it does NOT re-install anything).
    $cmdBody = @"
@echo off
REM ============================================================
REM  DeutschPrep -- relaunch Owner Mode (no reinstall).
REM  Built by installer\windows\install.ps1.
REM ============================================================
REM FIX 1: force the UTF-8 code page so Claude Code output isn't mojibake.
chcp 65001 >nul
cd /d "%~dp0"

REM CRITICAL: keep the subscription path -- never bill the API.
set "ANTHROPIC_API_KEY="

REM When the bridge is up, also open the hosted app's Settings to connect your plan.
set "OWNER_OPEN_URL=$HOSTED_SETTINGS"

echo Starting DeutschPrep Owner Mode on $BRIDGE_URL ...
echo (the local app AND the hosted Settings page will open once it is ready)
call npm run owner
pause
"@
    Set-Content -Path $cmdPath -Value $cmdBody -Encoding ASCII
    Write-Ok "Wrote launcher: $cmdPath"

    # Desktop shortcut pointing at the launcher.
    try {
        $desktop = [System.Environment]::GetFolderPath("Desktop")
        $lnkPath = Join-Path $desktop "DeutschPrep Owner Mode.lnk"
        $shell = New-Object -ComObject WScript.Shell
        $sc = $shell.CreateShortcut($lnkPath)
        $sc.TargetPath = $cmdPath
        $sc.WorkingDirectory = $repoPath
        $sc.Description = "Launch DeutschPrep Owner Mode (local Claude bridge)"
        $sc.Save()
        Write-Ok "Created Desktop shortcut: $lnkPath"
    } catch {
        Write-Warn2 "Could not create a Desktop shortcut: $($_.Exception.Message). Use start-owner.cmd in the repo instead."
    }
    return $cmdPath
}

# ==============================================================================
#  STEP 8 + 10 -- Start Owner Mode and open the browser
#  We run `npm run owner` in a NEW window so this installer can finish with a
#  clean summary while the bridge keeps running. The bridge's --open flag opens
#  the browser; we also nudge it as a fallback.
# ==============================================================================
function Start-OwnerMode($repoPath, $npmPath) {
    Write-Step "Launching Owner Mode (npm run owner) in a new window..."
    try {
        # UTF-8 code page (FIX 1), cd, clear the API key (subscription path), and set OWNER_OPEN_URL so
        # the bridge -- once it's actually listening -- opens BOTH the local app and the hosted Settings
        # page. Quoted `set "VAR=..."` avoids cmd's trailing-space-before-&& gotcha.
        $inner = "chcp 65001>nul && cd /d `"$repoPath`" && set `"ANTHROPIC_API_KEY=`" && set `"OWNER_OPEN_URL=$HOSTED_SETTINGS`" && npm run owner"
        Start-Process -FilePath "cmd.exe" -ArgumentList @("/k", $inner) -WorkingDirectory $repoPath | Out-Null
        Write-Ok "Owner Mode is starting; it builds the app then serves the bridge on $BRIDGE_URL."
    } catch {
        Write-Err2 "Could not auto-start Owner Mode: $($_.Exception.Message)"
        Write-Step "Start it manually: open '$repoPath' and run 'npm run owner'."
        return
    }

    # Wait for the bridge to answer /health (the first build can take a minute). The bridge opens the
    # browser tabs itself once it's up, so we don't open them here -- we just report accurate status.
    Write-Step "Waiting for the bridge to come up (first build can take a minute)..."
    $up = $false
    for ($i = 0; $i -lt 150 -and -not $up; $i++) {
        Start-Sleep -Seconds 1
        try {
            $resp = Invoke-WebRequest -Uri "$BRIDGE_URL/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($resp.StatusCode -eq 200) { $up = $true }
        } catch {}
    }
    Write-Host ""
    if ($up) {
        Write-Ok "Bridge is up at $BRIDGE_URL. Two browser tabs open automatically:"
        Write-Host "    - Hosted app (connect your plan):  $HOSTED_SETTINGS" -ForegroundColor Cyan
        Write-Host "    - Local copy (always works):       $BRIDGE_URL" -ForegroundColor Cyan
        Write-Host "  On the hosted page, the 'Claude (your plan)' card should read 'Detected'." -ForegroundColor Gray
        Write-Host "  If the browser asks to allow access to your local network, click Allow." -ForegroundColor Gray
        Write-Host "  If it stays 'Not detected', use the local copy, or start the optional Cloudflare" -ForegroundColor Gray
        Write-Host "  tunnel (next) and paste its HTTPS URL into Settings -> Bridge URL." -ForegroundColor Gray
    } else {
        Write-Warn2 "Bridge isn't answering yet -- it may still be building in the other window."
        Write-Host "  It will open your browser when ready. To connect the hosted app manually:" -ForegroundColor Gray
        Write-Host "    $HOSTED_SETTINGS   (local copy: $BRIDGE_URL)" -ForegroundColor Cyan
    }
}

# ==============================================================================
#  MAIN
# ==============================================================================
$summary = [ordered]@{}
try {
    Show-Banner

    Write-Section "Step 1/8 -- Choose install folder"
    $parent = Select-InstallFolder
    $summary["Install parent folder"] = $parent

    Write-Section "Step 2/8 -- Detect / install Node.js and git"
    $nodePath = Ensure-Node
    $gitPath  = Ensure-Git
    $npmPath  = Resolve-Npm $nodePath
    if (-not $npmPath) { throw "npm could not be located next to Node. Reinstall Node LTS and re-run." }
    $summary["Node"] = $nodePath
    $summary["npm"]  = $npmPath
    $summary["git"]  = if ($gitPath) { $gitPath } else { "(none -- used ZIP fallback)" }

    Write-Section "Step 3/8 -- Get the DeutschPrep source"
    $repoPath = Get-Source $parent $gitPath
    $summary["Repo folder"] = $repoPath

    Write-Section "Step 4/8 -- Install app dependencies"
    Install-Deps $repoPath $npmPath

    Write-Section "Step 5/8 -- Install Claude Code"
    $claudePath = Install-ClaudeCode $npmPath
    $summary["Claude Code"] = $claudePath

    # Step 6 -- subscription login (also unsets ANTHROPIC_API_KEY) + clean probe.
    Invoke-ClaudeLogin $claudePath $repoPath

    Write-Section "Step 7/8 -- Write launcher + shortcut"
    $launcher = Write-Launcher $repoPath $npmPath
    $summary["Launcher"] = $launcher

    Write-Section "Step 8/8 -- Start Owner Mode"
    Start-OwnerMode $repoPath $npmPath

    # Optional tunnel (opt-in).
    Start-OptionalTunnel

    # ---------------------------------------------------------------- summary
    Write-Section "Done -- Summary"
    foreach ($k in $summary.Keys) {
        # [string] coercion: defensive against any resolver that slipped an array/object into a value.
        Write-Host ("  {0,-22}: {1}" -f $k, [string]$summary[$k]) -ForegroundColor White
    }
    Write-Host ""
    Write-Ok "Owner Mode should be reachable at $BRIDGE_URL shortly."
    Write-Host ""
    Write-Host "  Use your plan on the HOSTED app (opens automatically once the bridge is up):" -ForegroundColor White
    Write-Host "    $HOSTED_SETTINGS" -ForegroundColor Cyan
    Write-Host "  Pick 'Claude (your plan)' there -- it auto-detects the bridge on $BRIDGE_URL." -ForegroundColor White
    Write-Host ""
    Write-Host "  Next time, just run 'start-owner.cmd' in the repo (or the Desktop" -ForegroundColor White
    Write-Host "  shortcut) -- no reinstall needed." -ForegroundColor White
    Write-Host ""
    Write-Host "  Reminder: this installer stored NO credentials. Your Claude login" -ForegroundColor Yellow
    Write-Host "  lives in Claude Code's own secure store. To remove everything:" -ForegroundColor Yellow
    Write-Host "    - delete the folder: $repoPath" -ForegroundColor DarkGray
    Write-Host "    - npm uninstall -g $CLAUDE_PKG" -ForegroundColor DarkGray
    Write-Host ""
    if (-not $NoPrompt) { Read-Host " Press Enter to close" | Out-Null }
}
catch {
    Write-Host ""
    Write-Err2 "Setup did not complete: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "  What you can do:" -ForegroundColor Yellow
    Write-Host "   * Re-run this installer -- it is safe to run again (idempotent)." -ForegroundColor Gray
    Write-Host "   * If a tool was just installed, OPEN A NEW TERMINAL first so PATH refreshes." -ForegroundColor Gray
    Write-Host "   * Install Node LTS manually from https://nodejs.org and re-run." -ForegroundColor Gray
    Write-Host ""
    if (-not $NoPrompt) { Read-Host " Press Enter to close" | Out-Null }
    exit 1
}
