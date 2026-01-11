from supabase import create_client, Client
from app.core.config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def get_supabase() -> Client:
    """Get Supabase client for regular operations"""
    return supabase


def get_supabase_admin() -> Client:
    """Get Supabase admin client for privileged operations"""
    return supabase_admin
