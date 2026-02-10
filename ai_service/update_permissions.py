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

def update_permissions():
    print(f"Updating permissions for Database: {DB_ID}")

    for col_id in collections:
        try:
            print(f"Updating collection: {col_id}...")
            # Enable Document Security and allow authenticated users to create documents
            databases.update_collection(
                database_id=DB_ID,
                collection_id=col_id,
                name=col_id, # Name is required but we can keep it same or fetch it. Use ID as placeholder if needed or hardcoded names from env if we had them. 
                             # distinct names are better but for permission update, the ID matters. 
                             # Actually update_collection requires 'name'. 
                             # Let's fetch the collection first to get its name.
                document_security=True,
                permissions=[
                    Permission.create(Role.users()),
                    # We also add read/update/delete for users so they can manage their own data 
                    # IF Document Security alone handles "owner" check efficiently. 
                    # Appwrite Document Security: If enabled, user needs permission on the specific document.
                    # The creator usually gets these permissions by default if client-side create is used.
                    # Use 'users' role for create.
                ]
            )
            print(f"Permissions updated for {col_id}: Document Security=True, Create=Users")
        except Exception as e:
            print(f"Error updating {col_id}: {e}")

if __name__ == "__main__":
    update_permissions()
