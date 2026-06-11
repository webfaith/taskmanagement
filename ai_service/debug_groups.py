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
    # Use the raw REST API approach to avoid SDK version issues with .documents vs .get()
    import requests
    
    url = f"{os.getenv('APPWRITE_ENDPOINT')}/databases/scheduler_db/collections/groups_collection/documents"
    headers = {
        "X-Appwrite-Project": os.getenv('APPWRITE_PROJECT_ID'),
        "X-Appwrite-Key": os.getenv('APPWRITE_API_KEY'),
        "Content-Type": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    data = response.json()
    
    print(f"Found {data.get('total', 0)} groups")
    
    for doc in data.get('documents', []):
        print("---")
        print(f"Group Name: {doc.get('name')}")
        print(f"Owner ID: {doc.get('owner_id')}")
        print(f"Member IDs (raw): {doc.get('member_ids')}")
        print(f"Type of Member IDs: {type(doc.get('member_ids'))}")
        
    print("\n--- Users ---")
    url_users = f"{os.getenv('APPWRITE_ENDPOINT')}/databases/scheduler_db/collections/users_collection/documents"
    res_users = requests.get(url_users, headers=headers).json()
    for u in res_users.get('documents', []):
        print(f"Email: {u.get('email')} -> User ID: {u.get('user_id')}")
        
except Exception as e:
    print(f"Error: {e}")
