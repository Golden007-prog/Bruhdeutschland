# DeutschPrep — Desktop Launcher

A small Windows desktop app (`.exe`) that runs DeutschPrep **locally** and starts all its engines
from one window. It does not deploy anything — everything runs on your machine.

## What it does

- **Start all engines** — launches the backend API (FastAPI/uvicorn on `:8000`) and the frontend
  (Vite on `:5173`) as child processes, with start/stop controls and a live status light each.
- **LLM mode** — choose how the backend reaches a model:
  | Mode | Uses |
  |------|------|
  | `auto` (default) | API key if set → else your Claude subscription (CLI) → else offline stub |
  | `claude_code` | **Your personal Claude subscription** via the local Claude Code CLI (`claude`) |
  | `api_key` | The Anthropic API (`ANTHROPIC_API_KEY`) |
  | `stub` | Offline deterministic stub — no LLM calls |
- **Open DeutschPrep / API docs** — opens `http://127.0.0.1:5173` and the Swagger docs.
- **Logs + health** — streams both processes' output and polls `/health`.

### Personal subscription, no API key

Pick **`claude_code`** (or leave `auto`). The backend then shells out to the `claude` CLI in print
mode (`claude -p … --output-format json`), which is authenticated with your Pro/Max subscription
(`claude /login`). A deployed server can't use a chat subscription — but a local copy can, because it
reuses the CLI's own login. Requires the [Claude Code CLI](https://claude.com/claude-code) on `PATH`.

## Run it

Double-click **`dist/DeutschPrepLauncher.exe`**, then click **Start all engines**. The launcher finds
the project automatically when the `.exe` lives inside the repo; otherwise set `DEUTSCHPREP_ROOT` to
the repo root.

**Prerequisites** (the launcher orchestrates these — it doesn't bundle them):
- `backend/.venv` with deps installed (`pip install -r backend/requirements.txt`)
- `frontend/node_modules` installed (`npm install` in `frontend/`)
- For `claude_code` mode: the `claude` CLI installed and logged in

## Build the .exe

From the repo root, with the backend venv active:

```sh
backend/.venv/Scripts/python.exe -m pip install pyinstaller
backend/.venv/Scripts/python.exe -m PyInstaller --noconfirm --onefile --windowed \
  --name DeutschPrepLauncher \
  --distpath desktop/dist --workpath desktop/build --specpath desktop \
  desktop/launcher.py
```

Output: `desktop/dist/DeutschPrepLauncher.exe` (~11 MB, self-contained Python + Tkinter).
`desktop/build/`, `desktop/dist/`, and `desktop/*.spec` are build artifacts (git-ignored).
