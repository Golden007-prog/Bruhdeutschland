#!/bin/sh
# =============================================================================
#  DeutschPrep -- Owner-Mode one-click bootstrapper (macOS / Linux)
# =============================================================================
#
#  POSIX-sh parity with installer/windows/install.ps1. It is a BOOTSTRAPPER:
#  it downloads the app at runtime and bundles NO Node runtime or binaries.
#
#  Owner Mode = `npm run owner` from the repo root, which builds the frontend
#  and runs `node tools/claude-bridge/server.mjs --serve frontend/dist --open`,
#  serving the app + a local Claude bridge on http://localhost:8787.
#
#  WHAT IT DOES (idempotent; safe to re-run):
#    1. Print a transparency banner (stores no credentials).
#    2. Pick an install folder (typed; default ~/DeutschPrep).
#    3. Detect node + git; print brew/apt install hints if missing.
#    4. git clone (or git pull if present), else download + unzip the source.
#    5. npm install.
#    6. Install Claude Code globally; run `claude doctor`.
#    7. Unset ANTHROPIC_API_KEY, then interactive `claude` subscription login.
#    8. Start Owner Mode (npm run owner).
#    9. Optional cloudflared tunnel (opt-in only).
#   10. Open http://localhost:8787 in the browser.
#
#  USAGE:
#    sh installer/unix/install.sh
#  (chmod +x to run as ./install.sh)
# =============================================================================

set -eu

# --- Pinned FACTS ------------------------------------------------------------
REPO_URL="https://github.com/Golden007-prog/Bruhdeutschland.git"
ZIP_URL="https://codeload.github.com/Golden007-prog/Bruhdeutschland/zip/refs/heads/main"
ZIP_INNER_DIR="Bruhdeutschland-main"   # folder inside the GitHub zip
REPO_DIRNAME="Bruhdeutschland"         # final on-disk folder name
BRIDGE_PORT="8787"
BRIDGE_URL="http://localhost:${BRIDGE_PORT}"
CLAUDE_PKG="@anthropic-ai/claude-code"

# --- Colors (degrade gracefully if not a TTY) --------------------------------
if [ -t 1 ]; then
  C_CY='\033[36m'; C_GR='\033[32m'; C_YE='\033[33m'; C_RE='\033[31m'; C_RS='\033[0m'
else
  C_CY=''; C_GR=''; C_YE=''; C_RE=''; C_RS=''
fi
section() { printf '\n%s============================================================%s\n' "$C_CY" "$C_RS"; printf '%s  %s%s\n' "$C_CY" "$1" "$C_RS"; printf '%s============================================================%s\n' "$C_CY" "$C_RS"; }
step()    { printf '  -> %s\n' "$1"; }
ok()      { printf '%s  [ok] %s%s\n' "$C_GR" "$1" "$C_RS"; }
warn()    { printf '%s  [!]  %s%s\n' "$C_YE" "$1" "$C_RS"; }
err()     { printf '%s  [x]  %s%s\n' "$C_RE" "$1" "$C_RS"; }

have() { command -v "$1" >/dev/null 2>&1; }

# Detect package manager for install hints.
PKG_HINT_NODE=""
PKG_HINT_GIT=""
if have brew; then
  PKG_HINT_NODE="brew install node"
  PKG_HINT_GIT="brew install git"
elif have apt-get; then
  PKG_HINT_NODE="sudo apt-get update && sudo apt-get install -y nodejs npm   # or use nodesource for a current LTS"
  PKG_HINT_GIT="sudo apt-get install -y git"
elif have dnf; then
  PKG_HINT_NODE="sudo dnf install -y nodejs npm"
  PKG_HINT_GIT="sudo dnf install -y git"
else
  PKG_HINT_NODE="Install Node.js LTS from https://nodejs.org"
  PKG_HINT_GIT="Install git from https://git-scm.com"
fi

# Cross-platform browser opener.
open_url() {
  if have open;       then open "$1" >/dev/null 2>&1 || true        # macOS
  elif have xdg-open; then xdg-open "$1" >/dev/null 2>&1 || true     # Linux
  else step "Open this URL manually: $1"; fi
}

# ============================================================================
#  STEP 1 -- Banner
# ============================================================================
banner() {
  printf '\n'
  printf '   DeutschPrep -- Owner-Mode setup (auditable bootstrapper)\n'
  printf '\n'
  printf ' This script will, on YOUR machine and with YOUR confirmation:\n\n'
  printf '   1. Let you choose an install folder.\n'
  printf '   2. Check for Node.js + git (and tell you how to install them).\n'
  printf '   3. Download the app source from GitHub:\n        %s\n' "$REPO_URL"
  printf '   4. Run "npm install".\n'
  printf '   5. Install Claude Code globally (%s).\n' "$CLAUDE_PKG"
  printf '   6. Ask you to log in to YOUR OWN Claude subscription.\n'
  printf '   7. Start Owner Mode (npm run owner) on %s.\n' "$BRIDGE_URL"
  printf '   8. (Optional) Start a Cloudflare tunnel -- only if you opt in.\n\n'
  printf '%s It stores NO credentials. Your Claude login is kept by Claude Code\n itself, never by this script. It is re-runnable.%s\n\n' "$C_YE" "$C_RS"
  printf ' Continue? [Y/n] '
  read -r reply
  case "$reply" in
    [Nn]*) warn "Cancelled by user."; exit 0 ;;
  esac
}

# ============================================================================
#  STEP 2 -- Folder picker (typed)
# ============================================================================
pick_folder() {
  default="${HOME}/DeutschPrep"
  printf ' Install folder [default: %s]: ' "$default" 1>&2
  read -r typed
  if [ -z "$typed" ]; then printf '%s' "$default"; else
    # Expand a leading ~ if the user typed one.
    case "$typed" in "~"*) typed="${HOME}${typed#~}";; esac
    printf '%s' "$typed"
  fi
}

# ============================================================================
#  STEP 3 -- Detect node + git
# ============================================================================
ensure_node() {
  step "Checking for Node.js..."
  if have node && have npm; then
    ok "Node.js present: $(node -v) / npm $(npm -v)"
    return 0
  fi
  err "Node.js (and/or npm) not found."
  warn "Install it, then re-run this script:"
  printf '      %s\n' "$PKG_HINT_NODE"
  exit 1
}

GIT_OK=0
ensure_git() {
  step "Checking for git..."
  if have git; then
    ok "git present: $(git --version)"
    GIT_OK=1
  else
    warn "git not found -- will use the ZIP download fallback instead of clone."
    printf '      (to enable clone/pull: %s)\n' "$PKG_HINT_GIT"
    GIT_OK=0
  fi
}

# ============================================================================
#  STEP 4 -- Get source (clone / pull / zip)
# ============================================================================
REPO_PATH=""
get_source() {
  parent="$1"
  mkdir -p "$parent"
  REPO_PATH="${parent}/${REPO_DIRNAME}"

  if [ -d "${REPO_PATH}/.git" ]; then
    step "Existing git checkout found -- pulling latest (idempotent)."
    if ( cd "$REPO_PATH" && git pull --ff-only ); then
      ok "Repository updated."
    else
      warn "git pull failed; keeping the existing checkout."
    fi
    return 0
  fi
  if [ -d "$REPO_PATH" ]; then
    step "Folder already present (non-git); reusing: $REPO_PATH"
    return 0
  fi

  if [ "$GIT_OK" -eq 1 ]; then
    step "Cloning ${REPO_URL} ..."
    if git clone "$REPO_URL" "$REPO_PATH"; then
      ok "Cloned into $REPO_PATH"
      return 0
    fi
    warn "git clone failed; trying the ZIP fallback."
  fi

  # ZIP fallback
  step "Downloading source ZIP (no git needed)..."
  tmpzip="$(mktemp -t deutschprep.XXXXXX).zip"
  tmpdir="$(mktemp -d -t deutschprep.XXXXXX)"
  if have curl; then
    curl -fL "$ZIP_URL" -o "$tmpzip"
  elif have wget; then
    wget -O "$tmpzip" "$ZIP_URL"
  else
    err "Neither curl nor wget is available to download the ZIP. Install git or curl and re-run."
    exit 1
  fi
  step "Extracting..."
  if have unzip; then
    unzip -q "$tmpzip" -d "$tmpdir"
  else
    err "unzip not found. Install unzip (or git) and re-run."
    rm -f "$tmpzip"; rm -rf "$tmpdir"
    exit 1
  fi
  inner="${tmpdir}/${ZIP_INNER_DIR}"
  if [ ! -d "$inner" ]; then
    # tolerate a differently-named top-level folder
    inner="$(find "$tmpdir" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
  fi
  if [ -z "$inner" ] || [ ! -d "$inner" ]; then
    err "Could not locate extracted source folder."
    rm -f "$tmpzip"; rm -rf "$tmpdir"
    exit 1
  fi
  mv "$inner" "$REPO_PATH"
  rm -f "$tmpzip"; rm -rf "$tmpdir"
  ok "Source extracted to $REPO_PATH"
}

# ============================================================================
#  STEP 5 -- npm install
# ============================================================================
install_deps() {
  # Not an npm-workspaces monorepo: install EACH package in its own dir (root + frontend), or tsc/vite
  # never land in frontend and `npm run owner` fails with "tsc not recognized". Prefer npm ci w/ a lockfile.
  for pkg in "" "frontend"; do
    dir="$REPO_PATH"
    [ -n "$pkg" ] && dir="$REPO_PATH/$pkg"
    [ -f "$dir/package.json" ] || continue
    label="${pkg:-root}"
    if [ -f "$dir/package-lock.json" ]; then verb="ci"; else verb="install"; fi
    step "Installing $label dependencies (npm $verb)..."
    if ! ( cd "$dir" && npm "$verb" ); then
      if [ "$verb" = "ci" ]; then
        warn "npm ci failed in $label (lockfile drift?); retrying with npm install."
        ( cd "$dir" && npm install )
      else
        err "npm install failed in $label."; exit 1
      fi
    fi
    ok "$label dependencies installed."
  done
}

# ============================================================================
#  STEP 6 -- Install Claude Code + doctor
# ============================================================================
install_claude() {
  step "Installing Claude Code globally (${CLAUDE_PKG})..."
  # If a global install needs sudo (system Node), tell the user rather than guess.
  if npm install -g "$CLAUDE_PKG"; then
    ok "Claude Code installed."
  else
    warn "Global install failed -- your npm global prefix may need sudo or a per-user prefix."
    warn "Try:  sudo npm install -g ${CLAUDE_PKG}   (or set a user prefix: npm config set prefix ~/.npm-global)"
    return 1
  fi
  step "Running 'claude doctor'..."
  claude doctor || warn "'claude doctor' did not run cleanly; you can run it later."
}

# ============================================================================
#  STEP 7 -- Subscription login (unset ANTHROPIC_API_KEY first!)
# ============================================================================
claude_login() {
  section "Log in to YOUR Claude subscription"
  printf '\n'
  printf '%s  IMPORTANT: Owner Mode should use your Claude Pro/Max SUBSCRIPTION,\n' "$C_YE"
  printf '  not pay-per-call API billing.\n\n'
  printf '  If ANTHROPIC_API_KEY is set, Claude Code bills the API INSTEAD of\n'
  printf '  your subscription. We are UNSETTING it for this session.%s\n\n' "$C_RS"

  # CRITICAL: clear the key for this process tree so login + bridge use the plan.
  unset ANTHROPIC_API_KEY || true
  ok "ANTHROPIC_API_KEY is unset for this session."

  printf '\n  A Claude login will now start. Sign in with your Pro/Max account.\n'
  printf '  Type /exit (or Ctrl+C) when done to return here.\n'
  printf '  Press Enter to start the Claude login... '
  read -r _ignore
  # Interactive login; nothing captured/stored here -- Claude Code owns the session.
  claude || warn "The interactive 'claude' session ended."
  ok "Returned from Claude login."
}

# ============================================================================
#  STEP 8 + 10 -- Start Owner Mode and open browser
# ============================================================================
start_owner() {
  step "Starting Owner Mode (npm run owner) in the background..."
  # Run in a subshell with the API key cleared; log to a file; keep this script flowing.
  logf="${REPO_PATH}/owner-mode.log"
  (
    cd "$REPO_PATH"
    unset ANTHROPIC_API_KEY || true
    npm run owner
  ) >"$logf" 2>&1 &
  owner_pid=$!
  ok "Owner Mode launched (PID ${owner_pid}); log: ${logf}"
  step "It builds the app, then serves ${BRIDGE_URL}. Opening your browser shortly..."
  # Give the build a moment, then open the browser (bridge --open also tries).
  sleep 6
  open_url "$BRIDGE_URL"
}

# ============================================================================
#  STEP 9 -- Optional cloudflared tunnel
# ============================================================================
optional_tunnel() {
  section "Optional: public HTTPS tunnel (Cloudflare)"
  printf '\n  Owner Mode is LOCAL ONLY by default (%s).\n' "$BRIDGE_URL"
  printf '  A Cloudflare tunnel exposes it over a temporary public HTTPS URL so\n'
  printf '  you can use your plan from the HOSTED site. Optional and OFF by default.\n\n'
  printf ' Start a Cloudflare tunnel now? [y/N] '
  read -r ans
  case "$ans" in
    [Yy]*) : ;;
    *) step "Skipping tunnel (local-only Owner Mode)."; return 0 ;;
  esac

  if ! have cloudflared; then
    warn "cloudflared is not installed."
    if have brew; then printf '      Install it:  brew install cloudflared\n'
    else printf '      Install it from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/\n'; fi
    return 0
  fi
  step "Starting: cloudflared tunnel --url ${BRIDGE_URL}"
  printf '  Watch for a line like:  https://<words>.trycloudflare.com\n'
  printf '  Copy that URL into the hosted site (Settings -> Bridge URL).\n'
  printf '  Keep this terminal open to keep the tunnel alive.\n\n'
  # Run in the foreground so the user sees the URL; Ctrl+C stops it.
  cloudflared tunnel --url "$BRIDGE_URL"
}

# ============================================================================
#  MAIN
# ============================================================================
main() {
  banner
  section "Step 1 -- Choose install folder"
  PARENT="$(pick_folder)"
  step "Install parent folder: $PARENT"

  section "Step 2 -- Detect Node.js and git"
  ensure_node
  ensure_git

  section "Step 3 -- Get the DeutschPrep source"
  get_source "$PARENT"

  section "Step 4 -- Install app dependencies"
  install_deps

  section "Step 5 -- Install Claude Code"
  install_claude || warn "Continue after fixing the global-install issue above, then re-run."

  # Step 6 -- login (also unsets ANTHROPIC_API_KEY)
  claude_login

  section "Step 7 -- Start Owner Mode"
  start_owner

  # Optional tunnel last (it can run in the foreground).
  optional_tunnel

  section "Done -- Summary"
  printf '  Repo folder        : %s\n' "$REPO_PATH"
  printf '  Bridge URL         : %s\n' "$BRIDGE_URL"
  printf '\n'
  ok "Owner Mode should be reachable at ${BRIDGE_URL} shortly."
  printf '\n  Next time, from the repo run:  npm run owner\n'
  printf '%s  Reminder: this installer stored NO credentials. Your Claude login\n' "$C_YE"
  printf '  lives in Claude Code'\''s own store. To remove: delete %s and run\n' "$REPO_PATH"
  printf '  "npm uninstall -g %s".%s\n\n' "$CLAUDE_PKG" "$C_RS"
}

main "$@"
