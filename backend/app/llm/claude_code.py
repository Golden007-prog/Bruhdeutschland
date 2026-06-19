"""LLM provider that routes through the local Claude Code CLI — your personal subscription.

A deployed backend needs an Anthropic API key, but a copy running **locally** can reuse the
``claude`` CLI's own authentication (Pro/Max subscription via ``claude /login``). This provider
shells out to ``claude -p`` in print mode and asks for a single JSON object matching the target
Pydantic schema, then validates it — the same structured-output contract as :class:`AnthropicProvider`.

No network or subscription usage happens in tests: the subprocess ``runner`` is injectable.
"""

from __future__ import annotations

import asyncio
import json
from collections.abc import Awaitable, Callable
from typing import Any, TypeVar

from pydantic import BaseModel, ValidationError

from app.llm.client import LLMProvider, LLMSchemaError

M = TypeVar("M", bound=BaseModel)

#: A runner executes the CLI argv and returns (returncode, stdout, stderr).
Runner = Callable[[list[str]], Awaitable[tuple[int, str, str]]]


def extract_json_object(text: str) -> dict[str, Any]:
    """Pull the first JSON object out of ``text`` (handles bare JSON and ```json fences)."""
    stripped = text.strip()
    try:
        loaded = json.loads(stripped)
        if isinstance(loaded, dict):
            return loaded
    except json.JSONDecodeError:
        pass

    start = stripped.find("{")
    end = stripped.rfind("}")
    if start == -1 or end <= start:
        raise ValueError("no JSON object found in model output")
    loaded = json.loads(stripped[start : end + 1])
    if not isinstance(loaded, dict):
        raise ValueError("model output is not a JSON object")
    return loaded


class ClaudeCodeProvider(LLMProvider):
    """Structured output via ``claude -p ... --output-format json`` (local subscription auth)."""

    def __init__(
        self,
        *,
        model: str,
        claude_bin: str = "claude",
        timeout_s: float = 180.0,
        runner: Runner | None = None,
    ) -> None:
        self._model = model
        self._bin = claude_bin
        self._timeout = timeout_s
        self._runner: Runner = runner or self._default_runner

    async def _default_runner(self, args: list[str]) -> tuple[int, str, str]:
        proc = await asyncio.create_subprocess_exec(
            *args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        try:
            out, err = await asyncio.wait_for(proc.communicate(), timeout=self._timeout)
        except (asyncio.TimeoutError, TimeoutError) as exc:
            proc.kill()
            raise LLMSchemaError("claude CLI timed out") from exc
        return proc.returncode or 0, out.decode("utf-8", "replace"), err.decode("utf-8", "replace")

    async def structured(
        self, *, system: str, prompt: str, schema: type[M], max_retries: int = 2
    ) -> M:
        schema_json = json.dumps(schema.model_json_schema())
        system_full = (
            f"{system}\n\nReply with ONLY a single JSON object that validates against this JSON "
            f"Schema. No prose, no markdown fences:\n{schema_json}"
        )
        user_prompt = prompt
        last_error: Exception | None = None

        for _ in range(max_retries + 1):
            args = [
                self._bin,
                "-p",
                user_prompt,
                "--output-format",
                "json",
                "--model",
                self._model,
                "--append-system-prompt",
                system_full,
            ]
            rc, out, err = await self._runner(args)
            if rc != 0:
                last_error = LLMSchemaError(f"claude CLI exited {rc}: {err[:200]}")
                continue

            text = out
            try:
                envelope = json.loads(out)
                if isinstance(envelope, dict) and "result" in envelope:
                    text = str(envelope["result"])
            except json.JSONDecodeError:
                pass

            try:
                payload = extract_json_object(text)
                return schema.model_validate(payload)
            except (ValueError, ValidationError) as exc:
                last_error = exc
                user_prompt = (
                    prompt + "\n\nYour previous reply was invalid. Return ONLY the JSON object."
                )

        raise LLMSchemaError(
            f"{schema.__name__} not produced via claude CLI within {max_retries + 1} attempts"
        ) from last_error
