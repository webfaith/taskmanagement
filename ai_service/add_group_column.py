import os
from appwrite.client import Client
from appwrite.services.tables_db import TablesDB
from dotenv import load_dotenv

load_dotenv()

client = Client()
client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
client.set_key(os.getenv('APPWRITE_API_KEY'))

tables_db = TablesDB(client)

try:
    print("Adding member_ids column to groups_collection...")
    tables_db.create_string_column(
        database_id="scheduler_db",
        table_id="groups_collection",
        key="member_ids",
        size=2000,
        required=False
    )
    print("Column added successfully!")
except Exception as e:
    print(f"Error (column might already exist): {e}")
