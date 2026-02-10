from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.permission import Permission
from appwrite.role import Role
import os
from dotenv import load_dotenv

load_dotenv()

client = Client()
client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
client.set_key(os.getenv('APPWRITE_API_KEY'))

databases = Databases(client)

DB_ID = os.getenv('APPWRITE_DATABASE_ID', 'scheduler_db')

collections = [
    os.getenv('APPWRITE_COLLECTION_ID_TASKS', 'tasks_collection'),
    os.getenv('APPWRITE_COLLECTION_ID_PROFILES', 'user_profiles_collection'),
    os.getenv('APPWRITE_COLLECTION_ID_COURSES', 'courses_collection')
]

def fix_permissions():
    print(f"Fixing permissions for Database: {DB_ID}")

    for col_id in collections:
        try:
            print(f"Updating collection: {col_id}...")
            # Granting FULL ACCESS to authenticated users for dev simplicity
            # Disabling Document Security to rely on collection-level permissions
            databases.update_collection(
                database_id=DB_ID,
                collection_id=col_id,
                name=col_id,
                document_security=False, 
                permissions=[
                    Permission.read(Role.users()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users()),
                ]
            )
            print(f"Permissions FIXED for {col_id}: Read/Create/Update/Delete = Users")
        except Exception as e:
            print(f"Error updating {col_id}: {e}")

if __name__ == "__main__":
    fix_permissions()
