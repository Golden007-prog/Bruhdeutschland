"""LLM provider interface + Anthropic implementation (CLAUDE.md §3, §6).

Every call returns a **Pydantic-validated** object via tool-use (structured output). The provider is
an interface so model swaps and testing stay clean (mirrors ``TTSProvider`` / ``EmbeddingProvider``).
Tests use :class:`ScriptedLLMProvider` or :class:`StubLLMProvider` — the real network is never hit.
"""

from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod
from typing import Any, TypeVar, cast

from pydantic import BaseModel, ValidationError

from app.core.config import Settings
from app.core.logging import get_logger

M = TypeVar("M", bound=BaseModel)
log = get_logger(__name__)


class LLMSchemaError(RuntimeError):
    """Raised when the model cannot return a schema-valid payload within the retry budget."""


class LLMProvider(ABC):
    """Vendor-neutral contract: produce a validated instance of ``schema`` for a prompt."""

    @abstractmethod
    async def structured(
        self,
        *,
        system: str,
        prompt: str,
        schema: type[M],
        max_retries: int = 2,
    ) -> M:
        """Return a validated ``schema`` instance. Raises :class:`LLMSchemaError` on exhaustion."""


class StubLLMProvider(LLMProvider):
    """Offline default: returns the schema's own defaults. Used when no API key is configured.

    Suitable only for schemas whose fields are fully defaulted (the agents' LLM payloads are). If a
    required field is missing it raises, surfacing that the schema needs real inference.
    """

    async def structured(
        self, *, system: str, prompt: str, schema: type[M], max_retries: int = 2
    ) -> M:
        try:
            return schema()
        except ValidationError as exc:  # pragma: no cover - defensive
            raise LLMSchemaError(
                f"StubLLMProvider cannot synthesize {schema.__name__} (required fields)"
            ) from exc


class ScriptedLLMProvider(LLMProvider):
    """Deterministic test double: hands back queued responses, by schema type then in order."""

    def __init__(self, responses: list[BaseModel] | None = None) -> None:
        self._queue: list[BaseModel] = list(responses or [])
        self.calls: list[tuple[str, str, type[BaseModel]]] = []

    def queue(self, response: BaseModel) -> None:
        self._queue.append(response)

    async def structured(
        self, *, system: str, prompt: str, schema: type[M], max_retries: int = 2
    ) -> M:
        self.calls.append((system, prompt, schema))
        for i, resp in enumerate(self._queue):
            if isinstance(resp, schema):
                return cast(M, self._queue.pop(i))
        if self._queue and isinstance(self._queue[0], schema):
            return cast(M, self._queue.pop(0))
        raise LLMSchemaError(f"ScriptedLLMProvider has no queued response for {schema.__name__}")


class AnthropicProvider(LLMProvider):
    """Anthropic tool-use wrapper: forces a single tool call whose input is the target schema."""

    def __init__(self, settings: Settings) -> None:
        from anthropic import AsyncAnthropic

        key = settings.anthropic_api_key
        self._client = AsyncAnthropic(
            api_key=key.get_secret_value() if key else None,
            timeout=settings.llm_timeout_s,
        )
        self._model = settings.claude_model
        self._max_tokens = settings.llm_max_output_tokens

    async def structured(
        self, *, system: str, prompt: str, schema: type[M], max_retries: int = 2
    ) -> M:
        tool = {
            "name": "emit",
            "description": f"Return the result as a {schema.__name__}.",
            "input_schema": schema.model_json_schema(),
        }
        messages: list[dict[str, Any]] = [{"role": "user", "content": prompt}]
        last_error: Exception | None = None

        for attempt in range(max_retries + 1):
            resp = await self._client.messages.create(  # type: ignore[call-overload]
                model=self._model,
                max_tokens=self._max_tokens,
                system=system,
                messages=messages,
                tools=[tool],
                tool_choice={"type": "tool", "name": "emit"},
            )
            payload: dict[str, Any] | None = None
            for block in resp.content:
                if getattr(block, "type", None) == "tool_use":
                    payload = dict(block.input)
                    break
            if payload is None:
                last_error = LLMSchemaError("model did not call the emit tool")
                await asyncio.sleep(0.5 * (2**attempt))
                continue
            try:
                return schema.model_validate(payload)
            except ValidationError as exc:
                last_error = exc
                log.warning("llm.schema_retry", schema=schema.__name__, attempt=attempt)
                messages.append({"role": "assistant", "content": resp.content})
                messages.append(
                    {
                        "role": "user",
                        "content": f"That did not match the schema: {exc}. Re-emit valid input.",
                    }
                )
                await asyncio.sleep(0.5 * (2**attempt))

        raise LLMSchemaError(
            f"{schema.__name__} not produced within {max_retries + 1} attempts"
        ) from last_error


def build_llm_provider(settings: Settings) -> LLMProvider:
    """Factory: select a provider from ``settings.llm_mode`` (see :data:`LLMMode`).

    ``auto`` prefers a configured API key, then the local Claude Code CLI (personal subscription),
    then the offline stub — so the app runs everywhere without configuration.
    """
    import shutil

    from app.llm.claude_code import ClaudeCodeProvider

    mode = settings.llm_mode
    has_cli = shutil.which(settings.claude_bin) is not None

    def _claude_code() -> LLMProvider:
        return ClaudeCodeProvider(
            model=settings.claude_model,
            claude_bin=settings.claude_bin,
            timeout_s=settings.claude_code_timeout_s,
        )

    if mode == "api_key":
        return AnthropicProvider(settings)
    if mode == "claude_code":
        return _claude_code()
    if mode == "stub":
        return StubLLMProvider()

    # auto
    if settings.llm_configured:
        return AnthropicProvider(settings)
    if has_cli:
        return _claude_code()
    return StubLLMProvider()
