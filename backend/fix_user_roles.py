import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Add backend to path to import config if needed, or just load .env directly
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def fix_user(email: str, role: str = "admin"):
    print(f"Attempting to fix user: {email} ...")
    
    # 1. Find user in the 'users' table
    try:
        result = supabase.table("users").select("*").eq("email", email).execute()
        
        user_id = None
        if not result.data:
            print(f"User with email {email} not found in 'users' table. Searching Supabase Auth...")
            # Try to find in Supabase Auth
            auth_users = supabase.auth.admin.list_users()
            target_auth = [u for u in auth_users if u.email.lower() == email.lower()]
            
            if target_auth:
                user_id = target_auth[0].id
                print(f"Found in Auth! ID: {user_id}. Creating database record...")
                # Insert missing record
                insert_data = {
                    "id": user_id,
                    "email": email,
                    "username": email.split('@')[0],
                    "password_hash": "$pbkdf2-sha256$29000$dummy$dummy", # Dummy hash to satisfy not-null constraint
                    "role": role,
                    "is_active": True
                }
                supabase.table("users").insert(insert_data).execute()
                print(f"SUCCESS: Created database record for {email}")
            else:
                print(f"User {email} not found in Supabase Auth either.")
                return
        else:
            user = result.data[0]
            user_id = user['id']
            print(f"Found user in database. ID: {user_id}")
        
        # 2. Update status and role
        update_data = {
            "role": role,
            "is_active": True
        }
        
        update_result = supabase.table("users").update(update_data).eq("id", user_id).execute()
        
        if update_result.data:
            print(f"SUCCESS: User {email} (ID: {user_id}) is now an {role} and is_active=True.")
        else:
            print("Failed to update user record.")
            
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fix_user_roles.py <email> [role]")
        sys.exit(1)
        
    email_to_fix = sys.argv[1]
    target_role = sys.argv[2] if len(sys.argv) > 2 else "admin"
    
    fix_user(email_to_fix, target_role)
