import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

PROJECT_ID = os.getenv('APPWRITE_PROJECT_ID')
API_KEY = os.getenv('APPWRITE_API_KEY')
ENDPOINT = os.getenv('APPWRITE_ENDPOINT')

headers = {
    "X-Appwrite-Project": PROJECT_ID,
    "X-Appwrite-Key": API_KEY,
    "Content-Type": "application/json"
}

def get_user_id_by_email(email):
    try:
        url = f"{ENDPOINT}/databases/scheduler_db/collections/users_collection/documents"
        # We fetch all users since we can't easily query with REST without URL encoding exactly right
        res = requests.get(url, headers=headers).json()
        for doc in res.get('documents', []):
            if doc.get('email') == email:
                return doc.get('user_id')
    except Exception as e:
        print(f"Error fetching user for email {email}: {e}")
    return None

try:
    print("Fetching groups...")
    url = f"{ENDPOINT}/databases/scheduler_db/collections/groups_collection/documents"
    result = requests.get(url, headers=headers).json()
    
    for doc in result.get('documents', []):
        group_id = doc.get('$id')
        try:
            member_ids_str = doc.get('member_ids', '[]')
            member_ids = json.loads(member_ids_str) if isinstance(member_ids_str, str) else member_ids_str
            if not member_ids:
                member_ids = []
                
            needs_update = False
            new_member_ids = []
            
            for m_id in member_ids:
                if '@' in m_id:
                    print(f"Found email {m_id} in group {group_id}. Attempting to resolve...")
                    real_user_id = get_user_id_by_email(m_id)
                    if real_user_id:
                        print(f"Resolved {m_id} -> {real_user_id}")
                        new_member_ids.append(real_user_id)
                        needs_update = True
                    else:
                        print(f"Could not resolve {m_id}, keeping as is (user might not have logged in yet)")
                        new_member_ids.append(m_id)
                else:
                    new_member_ids.append(m_id)
            
            if needs_update:
                print(f"Updating group {group_id} with new member_ids...")
                update_url = f"{ENDPOINT}/databases/scheduler_db/collections/groups_collection/documents/{group_id}"
                
                # We need to maintain other fields or use PATCH. The Appwrite API for updating document is PATCH
                patch_data = {
                    "data": {
                        "member_ids": json.dumps(list(set(new_member_ids)))
                    }
                }
                
                patch_res = requests.patch(update_url, headers=headers, json=patch_data)
                if patch_res.status_code in [200, 201]:
                    print("Update successful!")
                else:
                    print(f"Update failed: {patch_res.text}")
                
        except Exception as e:
            print(f"Error processing group {group_id}: {e}")

    print("Repair complete.")
except Exception as e:
    print(f"Fatal error: {e}")
