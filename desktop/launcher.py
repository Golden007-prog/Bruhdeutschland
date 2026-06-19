"""DeutschPrep — local desktop launcher (control panel for "all engines").

A small Tkinter app that starts/stops the backend API (uvicorn) and the frontend (Vite), shows
their status and logs, lets you choose how the backend reaches an LLM (including your personal
Claude subscription via the local Claude Code CLI), and opens the app in your browser.

Packaged to a Windows ``.exe`` with PyInstaller — see desktop/README.md. Runs entirely on your
machine; nothing is deployed.
"""

from __future__ import annotations

import os
import queue
import shutil
import subprocess
import sys
import threading
import tkinter as tk
import urllib.request
import webbrowser
from pathlib import Path
from tkinter import ttk

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:5173"
HEALTH_URL = f"{BACKEND_URL}/health"

LLM_MODES = ["auto", "claude_code", "api_key", "stub"]
LLM_MODE_HELP = {
    "auto": "API key if set, else your Claude subscription (CLI), else offline stub",
    "claude_code": "Use your personal Claude subscription via the local Claude Code CLI",
    "api_key": "Use the Anthropic API (requires ANTHROPIC_API_KEY)",
    "stub": "Offline deterministic stub — no LLM calls",
}

IS_WINDOWS = os.name == "nt"


def find_project_root() -> Path:
    """Locate the repo root (folder containing both ``backend`` and ``frontend``)."""
    if env := os.environ.get("DEUTSCHPREP_ROOT"):
        return Path(env)
    base = Path(sys.executable if getattr(sys, "frozen", False) else __file__).resolve()
    for parent in [base, *base.parents]:
        if (parent / "backend").is_dir() and (parent / "frontend").is_dir():
            return parent
    return Path.cwd()


def venv_python(root: Path) -> str:
    candidate = root / "backend" / ".venv" / "Scripts" / "python.exe"
    return str(candidate) if candidate.exists() else sys.executable


class Engine:
    """One managed child process (backend or frontend) with a status + log stream."""

    def __init__(self, name: str, argv: list[str], cwd: Path, env: dict[str, str], out: queue.Queue) -> None:
        self.name = name
        self.argv = argv
        self.cwd = cwd
        self.env = env
        self._out = out
        self.proc: subprocess.Popen[str] | None = None

    @property
    def running(self) -> bool:
        return self.proc is not None and self.proc.poll() is None

    def start(self) -> None:
        if self.running:
            return
        flags = subprocess.CREATE_NEW_PROCESS_GROUP if IS_WINDOWS else 0
        try:
            self.proc = subprocess.Popen(
                self.argv,
                cwd=str(self.cwd),
                env={**os.environ, **self.env, "PYTHONUNBUFFERED": "1"},
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                creationflags=flags,
            )
        except FileNotFoundError as exc:
            self._out.put((self.name, f"[error] cannot start: {exc}"))
            return
        self._out.put((self.name, f"[started] {' '.join(self.argv)}"))
        threading.Thread(target=self._pump, args=(self.proc,), daemon=True).start()

    def _pump(self, proc: subprocess.Popen[str]) -> None:
        assert proc.stdout is not None
        for line in proc.stdout:
            self._out.put((self.name, line.rstrip()))
        self._out.put((self.name, f"[exited] code={proc.poll()}"))

    def stop(self) -> None:
        if not self.running or self.proc is None:
            return
        pid = self.proc.pid
        if IS_WINDOWS:
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)], capture_output=True)
        else:
            self.proc.terminate()
        self._out.put((self.name, "[stopped]"))


class LauncherApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("DeutschPrep — Local Launcher")
        self.geometry("760x520")
        self.minsize(640, 460)

        self.root_dir = find_project_root()
        self.logs: queue.Queue = queue.Queue()
        self.llm_mode = tk.StringVar(value="auto")
        self.health = tk.StringVar(value="Backend health: unknown")

        py = venv_python(self.root_dir)
        npm = shutil.which("npm") or ("npm.cmd" if IS_WINDOWS else "npm")
        self.backend = Engine(
            "backend",
            [py, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
            self.root_dir / "backend",
            {},
            self.logs,
        )
        self.frontend = Engine(
            "frontend",
            [npm, "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"],
            self.root_dir / "frontend",
            {},
            self.logs,
        )

        self._build_ui()
        self.protocol("WM_DELETE_WINDOW", self._on_close)
        self.after(400, self._drain_logs)
        self._start_health_thread()

    # -- UI ------------------------------------------------------------------

    def _build_ui(self) -> None:
        pad = {"padx": 8, "pady": 4}
        header = ttk.Frame(self)
        header.pack(fill="x", **pad)
        ttk.Label(header, text="DeutschPrep", font=("Segoe UI", 16, "bold")).pack(side="left")
        ttk.Label(header, text="German Master's admission copilot — runs locally").pack(side="left", padx=10)

        controls = ttk.Frame(self)
        controls.pack(fill="x", **pad)
        ttk.Button(controls, text="▶ Start all engines", command=self.start_all).pack(side="left", padx=2)
        ttk.Button(controls, text="■ Stop all", command=self.stop_all).pack(side="left", padx=2)
        ttk.Button(controls, text="↗ Open DeutschPrep", command=lambda: webbrowser.open(FRONTEND_URL)).pack(side="left", padx=2)
        ttk.Button(controls, text="API docs", command=lambda: webbrowser.open(f"{BACKEND_URL}/docs")).pack(side="left", padx=2)

        llm = ttk.Frame(self)
        llm.pack(fill="x", **pad)
        ttk.Label(llm, text="LLM mode:").pack(side="left")
        combo = ttk.Combobox(llm, values=LLM_MODES, textvariable=self.llm_mode, state="readonly", width=12)
        combo.pack(side="left", padx=6)
        self.llm_help = ttk.Label(llm, text=LLM_MODE_HELP["auto"], foreground="#555")
        self.llm_help.pack(side="left", padx=6)
        combo.bind("<<ComboboxSelected>>", lambda _e: self.llm_help.config(text=LLM_MODE_HELP[self.llm_mode.get()]))

        self.rows: dict[str, dict[str, tk.Widget]] = {}
        for engine, url in ((self.backend, BACKEND_URL), (self.frontend, FRONTEND_URL)):
            row = ttk.Frame(self)
            row.pack(fill="x", **pad)
            dot = tk.Label(row, text="●", fg="#9aa0a6", font=("Segoe UI", 12))
            dot.pack(side="left")
            ttk.Label(row, text=engine.name.capitalize(), width=10).pack(side="left")
            ttk.Label(row, text=url, foreground="#1a73e8", width=26).pack(side="left")
            ttk.Button(row, text="Start", command=engine.start, width=7).pack(side="left", padx=2)
            ttk.Button(row, text="Stop", command=engine.stop, width=7).pack(side="left", padx=2)
            self.rows[engine.name] = {"dot": dot}

        ttk.Label(self, textvariable=self.health, foreground="#555").pack(anchor="w", **pad)

        logframe = ttk.LabelFrame(self, text="Logs")
        logframe.pack(fill="both", expand=True, padx=8, pady=6)
        self.logbox = tk.Text(logframe, height=12, wrap="none", bg="#0b1021", fg="#d6e2ff", insertbackground="#fff")
        self.logbox.pack(side="left", fill="both", expand=True)
        scroll = ttk.Scrollbar(logframe, command=self.logbox.yview)
        scroll.pack(side="right", fill="y")
        self.logbox.config(yscrollcommand=scroll.set, state="disabled")

    # -- actions -------------------------------------------------------------

    def _apply_llm_mode(self) -> None:
        self.backend.env["LLM_MODE"] = self.llm_mode.get()

    def start_all(self) -> None:
        self._apply_llm_mode()
        self.backend.start()
        self.frontend.start()

    def stop_all(self) -> None:
        self.backend.stop()
        self.frontend.stop()

    # -- loops ---------------------------------------------------------------

    def _drain_logs(self) -> None:
        for _ in range(200):
            try:
                name, line = self.logs.get_nowait()
            except queue.Empty:
                break
            self._append_log(f"[{name}] {line}")
        for engine in (self.backend, self.frontend):
            self.rows[engine.name]["dot"].config(fg="#34a853" if engine.running else "#9aa0a6")
        self.after(400, self._drain_logs)

    def _append_log(self, text: str) -> None:
        self.logbox.config(state="normal")
        self.logbox.insert("end", text + "\n")
        self.logbox.see("end")
        self.logbox.config(state="disabled")

    def _start_health_thread(self) -> None:
        def poll() -> None:
            import time

            while True:
                try:
                    with urllib.request.urlopen(HEALTH_URL, timeout=2) as resp:
                        ok = resp.status == 200
                        self.health.set("Backend health: ✓ ok" if ok else "Backend health: ?")
                except Exception:
                    self.health.set("Backend health: ✗ not reachable")
                time.sleep(3)

        threading.Thread(target=poll, daemon=True).start()

    def _on_close(self) -> None:
        self.stop_all()
        self.destroy()


def main() -> None:
    LauncherApp().mainloop()


if __name__ == "__main__":
    main()
