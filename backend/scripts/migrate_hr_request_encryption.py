"""
One-time migration for encrypting existing HR request content.

Existing plaintext:
    hr_requests.subject
    hr_requests.description

After migration:
    both fields are AES-256-GCM encrypted.

IMPORTANT:
- Dry-run is the default.
- Use --apply to actually modify the database.
- Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  and HR365_ENCRYPTION_KEY.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1]),
)

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(
    Path(__file__).resolve().parents[1] / ".env"
)

from app.security.crypto import decrypt_text, encrypt_text


def get_required_env(name: str) -> str:
    value = os.getenv(name)

    if not value:
        raise RuntimeError(
            f"Required environment variable is missing: {name}"
        )

    return value


def looks_encrypted(value: str | None) -> bool:
    """
    Determine whether a value is already decryptable using
    the current AES-256-GCM key.

    Existing plaintext values will fail decryption.
    """

    if not value:
        return False

    try:
        decrypt_text(value)
        return True
    except Exception:
        return False


def migrate(apply_changes: bool) -> None:
    supabase_url = get_required_env("SUPABASE_URL")
    service_role_key = get_required_env("SUPABASE_SERVICE_ROLE_KEY")

    client = create_client(
        supabase_url,
        service_role_key,
    )

    response = (
        client.table("hr_requests")
        .select("id, subject, description")
        .order("created_at")
        .execute()
    )

    rows = response.data or []

    print(f"Found {len(rows)} HR request(s).")

    already_encrypted = 0
    plaintext = 0
    migrated = 0
    failed = 0

    for row in rows:
        request_id = row.get("id")
        subject = row.get("subject")
        description = row.get("description")

        subject_encrypted = looks_encrypted(subject)
        description_encrypted = looks_encrypted(description)

        # Both fields are already encrypted.
        if subject_encrypted and description_encrypted:
            already_encrypted += 1
            continue

        plaintext += 1

        if not apply_changes:
            print(
                f"[DRY RUN] Would encrypt request {request_id}"
            )
            continue

        try:
            update_data = {}

            if subject and not subject_encrypted:
                update_data["subject"] = encrypt_text(subject)

            if description and not description_encrypted:
                update_data["description"] = encrypt_text(
                    description
                )

            if not update_data:
                print(
                    f"[SKIP] Request {request_id}: "
                    "nothing to encrypt."
                )
                continue

            update_response = (
                client.table("hr_requests")
                .update(update_data)
                .eq("id", request_id)
                .execute()
            )

            if not update_response.data:
                raise RuntimeError(
                    "Database update returned no rows."
                )

            # Verify that the encrypted values can immediately
            # be decrypted back to their original content.
            updated_row = update_response.data[0]

            if "subject" in update_data:
                recovered_subject = decrypt_text(
                    updated_row["subject"]
                )

                if recovered_subject != subject:
                    raise RuntimeError(
                        "Subject encryption verification failed."
                    )

            if "description" in update_data:
                recovered_description = decrypt_text(
                    updated_row["description"]
                )

                if recovered_description != description:
                    raise RuntimeError(
                        "Description encryption verification failed."
                    )

            migrated += 1

            print(
                f"[OK] Migrated request {request_id}"
            )

        except Exception as exc:
            failed += 1

            print(
                f"[FAILED] Request {request_id}: "
                f"{type(exc).__name__}",
                file=sys.stderr,
            )

    print()
    print("Migration summary")
    print("-----------------")
    print(f"Total rows:        {len(rows)}")
    print(f"Already encrypted: {already_encrypted}")
    print(f"Plaintext rows:    {plaintext}")

    if apply_changes:
        print(f"Migrated:          {migrated}")
        print(f"Failed:            {failed}")
    else:
        print()
        print("DRY RUN ONLY — no database changes were made.")
        print("Run with --apply to perform the migration.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Encrypt existing HR365 HR request content."
    )

    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually modify the database.",
    )

    args = parser.parse_args()

    try:
        migrate(args.apply)
    except Exception as exc:
        print(
            f"Migration aborted: {exc}",
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()