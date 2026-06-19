"""structlog setup with PII redaction (CLAUDE.md §2 rule 7 / §7).

Raw PII (emails, phone numbers) must never reach a log sink. A structlog processor scrubs string
values in the event dict before rendering, so even accidental ``log.info(email=...)`` is masked.
"""

from __future__ import annotations

import logging
import re
from collections.abc import MutableMapping
from typing import Any, cast

import structlog

_EMAIL = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
# Phone-ish runs of 7+ digits (optionally + / spaces / dashes), conservative to avoid eating IDs.
_PHONE = re.compile(r"(?<!\d)(\+?\d[\d\s\-]{6,}\d)(?!\d)")


def redact_pii(text: str) -> str:
    """Mask emails and phone numbers in a string."""
    text = _EMAIL.sub("[redacted-email]", text)
    text = _PHONE.sub("[redacted-phone]", text)
    return text


def _redacting_processor(
    _logger: Any, _name: str, event_dict: MutableMapping[str, Any]
) -> MutableMapping[str, Any]:
    for key, value in event_dict.items():
        if isinstance(value, str):
            event_dict[key] = redact_pii(value)
    return event_dict


def configure_logging(*, json_logs: bool = False, level: int = logging.INFO) -> None:
    """Configure structlog once at startup. JSON in prod, console renderer in dev."""
    renderer: structlog.types.Processor = (
        structlog.processors.JSONRenderer() if json_logs else structlog.dev.ConsoleRenderer()
    )
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            _redacting_processor,
            renderer,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    return cast("structlog.stdlib.BoundLogger", structlog.get_logger(name))
