import os

from dotenv import load_dotenv
from supabase import create_client


load_dotenv()


url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

supabase = create_client(url, key)


email = input("Email: ")
password = input("Password: ")


response = supabase.auth.sign_in_with_password({
    "email": email,
    "password": password,
})


session = response.session

if session is None:
    print("LOGIN FAILED")
else:
    print("\nLOGIN SUCCESS")
    print("User ID:", session.user.id)
    print("Email:", session.user.email)
    print("\nACCESS TOKEN:")
    print(session.access_token)