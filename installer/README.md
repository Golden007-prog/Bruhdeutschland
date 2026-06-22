# DeutschPrep — Owner-Mode Installer

A **one-click bootstrapper** that sets up DeutschPrep's **Owner Mode** on a fresh machine.

> **Bootstrapper, not a bundle.** These scripts download the app (and Node/git if
> missing) **at runtime**. Nothing here bundles a Node runtime, and **no binary is
> committed** to this repo. The `.exe` is built separately and shipped as a GitHub
> Release asset (see [How to release](#how-to-release)).

---

## What is Owner Mode?

Owner Mode runs the app against **your own Claude Pro/Max subscription** instead of a
metered API key. Concretely it is:

```
npm run owner
```

from the repo root, which builds the frontend and runs
`node tools/claude-bridge/server.mjs --serve frontend/dist --open`, serving the app **and**
a tiny local Claude bridge on **http://localhost:8787**. The bridge shells out to the
Claude CLI (`claude -p`) — it never reads, stores, or forwards a raw token.

---

## What the installer does

Both `windows/install.ps1` and `unix/install.sh` perform the same idempotent, re-runnable steps:

1. **Transparency banner** — prints exactly what it will do, the repo URL, and that it
   stores no credentials.
2. **Folder picker** — Windows uses a `FolderBrowserDialog` (falls back to a typed path);
   Unix prompts for a path. Default: `%USERPROFILE%\DeutschPrep` / `~/DeutschPrep`.
3. **Detect Node + git** — installs via `winget` (`OpenJS.NodeJS.LTS`, `Git.Git`) or the
   official Node MSI on Windows; prints `brew`/`apt`/`dnf` hints on Unix. The Windows
   script handles the **PATH-refresh gotcha** (a freshly-installed binary isn't on the
   session `PATH` yet) by rebuilding `$env:Path` from the registry and resolving tools by
   absolute path.
4. **Get the source** — `git clone` into the chosen folder, or `git pull` if it already
   exists (idempotent), or a **ZIP fallback** (`Invoke-WebRequest`/`curl` + extract +
   normalize the `Bruhdeutschland-main/` folder name) when git is unavailable.
5. **`npm install`** in the repo root.
6. **Install Claude Code** — only if it isn't already present (detect-first; one method, no
   duplicate npm-global + native installs). No raw `claude doctor` wall is printed; if both an
   npm-global and a native install are detected, a one-line cleanup hint is shown instead.
7. **Subscription login** — **unsets `ANTHROPIC_API_KEY`** for the session (so Claude Code
   uses your subscription, *not* the metered API — see the critical note below), explains
   why, runs the interactive `claude` login **inheriting the console** (its output is never
   captured or parsed), then **verifies** the login with a clean machine-readable probe
   (`claude -p "ping" --output-format json --strict-mcp-config`) and reports *Connected*.
8. **Start Owner Mode** — `npm run owner` (build + serve on `:8787`).
9. **Optional Cloudflare tunnel** — only if you opt in at the prompt. Captures the printed
   `https://*.trycloudflare.com` URL to paste into the hosted site's Owner-Mode card.
10. **Open** http://localhost:8787 in your browser.
11. (Windows) Write a **`start-owner.cmd`** launcher in the repo + a **Desktop shortcut** so
    re-launching skips install.

### Critical: `ANTHROPIC_API_KEY` must be UNSET

If `ANTHROPIC_API_KEY` is set in the environment, Claude Code **bills the API per token**
instead of drawing from your Pro/Max subscription. The installer explicitly
`Remove-Item Env:ANTHROPIC_API_KEY` (PowerShell) / `unset ANTHROPIC_API_KEY` (sh) for its
session and the generated launcher clears it too. This only affects those processes, not
your system-wide environment.

---

## Running it directly (no `.exe`)

You can run the source scripts as-is — no build step required.

**Windows**

```powershell
powershell -ExecutionPolicy Bypass -File installer\windows\install.ps1
```

**macOS / Linux**

```sh
sh installer/unix/install.sh
# or: chmod +x installer/unix/install.sh && ./installer/unix/install.sh
```

---

## How to build the `.exe`

Two supported paths. **Neither output is committed** — both are release artifacts.

### Option A — PS2EXE (wrap the PowerShell script)

```powershell
Install-Module ps2exe -Scope CurrentUser        # one-time
Invoke-PS2EXE installer\windows\install.ps1 DeutschPrep-Owner-Setup.exe
```

> Note: PS2EXE output is a common **AV false-positive** magnet (it embeds a script in a
> generic launcher). Prefer Option B for a friendlier wizard, or be ready to publish a
> checksum and explain the false positive.

### Option B — Inno Setup (wizard installer)

Install [Inno Setup](https://jrsoftware.org/isinfo.php), then compile the `.iss`:

```powershell
& "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer\windows\DeutschPrep-Owner-Setup.iss
# Output lands in installer\windows\Output\DeutschPrep-Owner-Setup.exe
```

The Inno wizard ships **only** `install.ps1`, shows a welcome page describing what it does,
uses its directory page as the folder picker, and on finish runs the script with
`-ExecutionPolicy Bypass`.

---

## How to release

1. Build the `.exe` (Option A or B above).
2. Generate a SHA-256 checksum **next to** it:
   ```powershell
   Get-FileHash .\DeutschPrep-Owner-Setup.exe -Algorithm SHA256 |
     ForEach-Object { "$($_.Hash)  DeutschPrep-Owner-Setup.exe" } |
     Out-File DeutschPrep-Owner-Setup.exe.sha256 -Encoding ascii
   ```
3. Create a **GitHub Release** and attach **both** the `.exe` and the `.sha256` as assets.
   **Do not commit the binary to the repo** — keep only this auditable source under
   `installer/`. Ship the `.ps1` alongside the `.exe` so users can read what runs.

Users verify before running:

```powershell
Get-FileHash .\DeutschPrep-Owner-Setup.exe -Algorithm SHA256
# compare the printed hash against the published .sha256
```

---

## Honesty: unsigned installers, SmartScreen & AV

Please read this before distributing — and tell your users:

- **The `.exe` is unsigned.** Downloaded unsigned executables trigger **Windows
  SmartScreen** ("**Windows protected your PC**" → **More info** → **Run anyway**). This is
  expected, not a malware indicator.
- **AV false-positives happen**, especially with **PS2EXE** output (heuristics flag
  "PowerShell embedded in an exe"). Publishing and verifying a **SHA-256** is your
  mitigation; the Inno Setup wizard tends to trip fewer heuristics than PS2EXE.
- **Signing reality (as of 2026):**
  - **EV certificates no longer bypass SmartScreen** — that instant-reputation behavior was
    **removed in 2024**. Buying an EV cert will *not* make the warning vanish on day one.
  - **Self-signed certs are worse than unsigned** — Windows actively distrusts an unknown
    signer.
  - The **legit cheap path** is **Microsoft Trusted Signing** (~$10/month). Even then,
    **reputation still takes time** to accumulate before SmartScreen stops warning.
- **No credentials are stored by the installer.** Your Claude login lives in **Claude
  Code's own credential store / keychain**, never in these scripts or the `.exe`.
- **Always ship the `.ps1` source alongside the `.exe`** so anyone can audit exactly what
  runs.
- **It's fully removable:** delete the install folder and run
  `npm uninstall -g @anthropic-ai/claude-code` (and remove the Desktop shortcut).

---

## Terms-of-service note (volatile — dated 2026-06-19)

- `claude -p` / the Claude Agent SDK used for *personal* automation draws from your **Pro/Max
  subscription limits**, the same pool as interactive use.
- Anthropic **proposed separate credit billing** for this on **15 Jun 2026** but then
  **PAUSED** that change. **Re-check Anthropic's current terms before relying on it** — this
  is a moving target.
- This bridge is for **your own personal plan only**. Offering subscription-backed login to
  third parties (reselling your plan's access) is restricted; don't.

> *This is operational guidance for running your own copy, not legal advice. Verify
> Anthropic's current Consumer/Commercial Terms and Usage Policy before depending on
> subscription-backed automation.*

---

## Files in this folder

| File | Purpose |
|------|---------|
| `windows/install.ps1` | Idempotent Windows PowerShell bootstrapper (the real installer). |
| `windows/DeutschPrep-Owner-Setup.iss` | Inno Setup wizard that ships + runs `install.ps1`. |
| `unix/install.sh` | POSIX-sh bootstrapper for macOS/Linux. |
| `README.md` | This file. |
