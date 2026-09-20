from supabase import Client, create_client

from app.config import SUPABASE_KEY, SUPABASE_URL


if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is not configured.")

if not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_KEY is not configured.")


supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY,
)