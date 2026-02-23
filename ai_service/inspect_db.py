import os
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.databases import Databases

load_dotenv()

client = Client()
client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
client.set_key(os.getenv('APPWRITE_API_KEY'))

databases = Databases(client)
DATABASE_ID = os.getenv('APPWRITE_DATABASE_ID', 'scheduler_db')
TASKS_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_NOTIFICATIONS', 'notifications_collection')

try:
    print(f"Fetching attributes for collection: {TASKS_COLLECTION}")
    result = databases.get_collection(DATABASE_ID, TASKS_COLLECTION)
    print("\nAttributes found:")
    for attr in result['attributes']:
        print(f"  - Key: {attr['key']}, Type: {attr['type']}, Required: {attr['required']}")
except Exception as e:
    print(f"ERROR: {e}")
