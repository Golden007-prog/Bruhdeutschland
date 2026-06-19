"""12-factor configuration via pydantic-settings (CLAUDE.md §3, §6).

All settings come from the environment (or a local ``.env``); no secrets live in code. The Claude
model id is read from ``CLAUDE_MODEL`` so model swaps never touch source.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

#: How the backend reaches an LLM.
#:   ``auto``        — API key if present, else the local Claude Code CLI, else the offline stub
#:   ``claude_code`` — route through the local ``claude`` CLI (uses your personal subscription)
#:   ``api_key``     — direct Anthropic API (requires ANTHROPIC_API_KEY)
#:   ``stub``        — offline deterministic stub (no LLM)
LLMMode = Literal["auto", "claude_code", "api_key", "stub"]

#: Canonical disclaimer attached to all visa/finance/immigration output (CLAUDE.md §2 rule 5).
DISCLAIMER = (
    "Guidance only, not legal or financial advice. "
    "Verify against official sources before acting."
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=False
    )

    app_env: str = "dev"

    # --- LLM -----------------------------------------------------------------
    # Model id is operator-supplied via CLAUDE_MODEL (Opus-class). Never call the API in tests.
    claude_model: str = "claude-opus-4-8"
    llm_mode: LLMMode = "auto"
    anthropic_api_key: SecretStr | None = None
    claude_bin: str = "claude"  # Claude Code CLI, used in claude_code mode (personal subscription)
    claude_code_timeout_s: float = 180.0
    llm_max_retries: int = 2  # schema-failed calls (agent-workflows.md §11 Q2)
    llm_timeout_s: float = 60.0
    llm_max_output_tokens: int = 4096

    # --- Infra (optional for the local vertical slice) -----------------------
    database_url: str | None = None
    redis_url: str | None = None

    cors_origins: list[str] = ["http://localhost:5173"]

    disclaimer: str = DISCLAIMER

    @property
    def llm_configured(self) -> bool:
        """True when a real Anthropic key is present; otherwise the app runs in mock/stub mode."""
        return self.anthropic_api_key is not None


@lru_cache
def get_settings() -> Settings:
    """Process-wide singleton settings (cached)."""
    return Settings()
