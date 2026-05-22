import os
from appwrite.client import Client
from appwrite.services.tables_db import TablesDB
from appwrite.enums.tables_db_index_type import TablesDBIndexType
from appwrite.enums.order_by import OrderBy
from dotenv import load_dotenv

load_dotenv()

client = Client()
client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
client.set_key(os.getenv('APPWRITE_API_KEY'))

tables_db = TablesDB(client)

DATABASE_ID = "scheduler_db"
COLLECTION_ID = "group_messages_collection"
COLLECTION_NAME = "group_messages"

try:
    print(f"Creating table: {COLLECTION_NAME}...")
    table = tables_db.create_table(
        database_id=DATABASE_ID,
        table_id=COLLECTION_ID,
        name=COLLECTION_NAME,
        permissions=["read(\"any\")", "write(\"users\")"]
    )
    print(f"Table created: {table['$id']}")
except Exception as e:
    print(f"Table might already exist: {e}")

try:
    print("Creating columns...")
    tables_db.create_string_column(DATABASE_ID, COLLECTION_ID, 'group_id', 64, True)
    tables_db.create_string_column(DATABASE_ID, COLLECTION_ID, 'sender_id', 64, True)
    tables_db.create_string_column(DATABASE_ID, COLLECTION_ID, 'message', 5000, True)
    tables_db.create_datetime_column(DATABASE_ID, COLLECTION_ID, 'created_at', True)
    print("Columns created successfully.")
except Exception as e:
    print(f"Error creating columns: {e}")

try:
    print("Creating index on group_id...")
    tables_db.create_index(
        database_id=DATABASE_ID,
        table_id=COLLECTION_ID,
        key='idx_messages_group',
        type=TablesDBIndexType.KEY,
        columns=['group_id'],
        orders=[OrderBy.ASC]
    )
    print("Index created successfully.")
except Exception as e:
    print(f"Error creating index: {e}")
