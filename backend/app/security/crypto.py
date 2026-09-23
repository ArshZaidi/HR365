"""AES-256-GCM encryption utilities for sensitive HR365 data."""

from __future__ import annotations

import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_key() -> bytes:
    raw_key = os.getenv("HR365_ENCRYPTION_KEY")

    if not raw_key:
        raise RuntimeError(
            "HR365_ENCRYPTION_KEY is not configured."
        )

    key = base64.urlsafe_b64decode(
        raw_key + "=" * (-len(raw_key) % 4)
    )

    if len(key) != 32:
        raise RuntimeError(
            "HR365_ENCRYPTION_KEY must decode to exactly 32 bytes."
        )

    return key


def encrypt_text(value: str) -> str:
    if not value:
        return value

    key = _get_key()
    aesgcm = AESGCM(key)

    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(
        nonce,
        value.encode("utf-8"),
        None,
    )

    payload = nonce + ciphertext

    return base64.urlsafe_b64encode(payload).decode("ascii")


def decrypt_text(value: str) -> str:
    if not value:
        return value

    key = _get_key()

    try:
        payload = base64.urlsafe_b64decode(
            value.encode("ascii")
        )

        nonce = payload[:12]
        ciphertext = payload[12:]

        aesgcm = AESGCM(key)

        plaintext = aesgcm.decrypt(
            nonce,
            ciphertext,
            None,
        )

        return plaintext.decode("utf-8")

    except Exception as exc:
        raise ValueError(
            "Unable to decrypt protected HR365 data."
        ) from exc