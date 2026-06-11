import os
from appwrite.client import Client
from appwrite.services.databases import Databases
from dotenv import load_dotenv

load_dotenv()

client = Client()
client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
client.set_key(os.getenv('APPWRITE_API_KEY'))

databases = Databases(client)

try:
    result = databases.list_documents(
        database_id="scheduler_db",
        collection_id="groups_collection"
    )
    for doc in result.get('documents', []):
        print(f"Group ID: {doc.get('$id')}")
        print(f"Name: {doc.get('name')}")
        print(f"Owner: {doc.get('owner_id')}")
        print(f"Members: {doc.get('member_ids')}")
        print("-" * 20)
except Exception as e:
    print(e)
