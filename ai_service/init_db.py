"""
Database initialization script for Student Task Management System
Creates all required Appwrite collections with proper schema and indexes
"""
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Client
client = Client()
client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
client.set_key(os.getenv('APPWRITE_API_KEY'))

databases = Databases(client)

DATABASE_ID = "scheduler_db"

def setup_database():
    print("Setting up Appwrite Database for Student Task Management System...")
    
    # Create Database
    try:
        db = databases.create(
            database_id=DATABASE_ID,
            name="Student Task Management DB"
        )
        print(f"Database created: {db['$id']}")
    except Exception as e:
        print(f"Database might already exist or error: {e}")
    
    # Define all collections with their attributes
    collections = [
        {
            'name': 'users',
            'id': 'users_collection',
            'attributes': [
                {'type': 'string', 'key': 'user_id', 'size': 64, 'required': True},
                {'type': 'string', 'key': 'email', 'size': 255, 'required': True},
                {'type': 'string', 'key': 'display_name', 'size': 255, 'required': False},
                {'type': 'string', 'key': 'timezone', 'size': 50, 'required': False},
                {'type': 'string', 'key': 'notification_prefs', 'size': 5000, 'required': False},
                {'type': 'string', 'key': 'schedule_preferences', 'size': 5000, 'required': False},
                {'type': 'datetime', 'key': 'created_at', 'required': True},
                {'type': 'datetime', 'key': 'updated_at', 'required': True},
            ]
        },
        {
            'name': 'tasks',
            'id': 'tasks_collection',
            'attributes': [
                {'type': 'string', 'key': 'title', 'size': 255, 'required': True},
                {'type': 'string', 'key': 'description', 'size': 5000, 'required': False},
                {'type': 'string', 'key': 'user_id', 'size': 64, 'required': True},
                {'type': 'string', 'key': 'category', 'size': 50, 'required': True},  # academic, personal, work
                {'type': 'integer', 'key': 'priority', 'required': True},  # 1-5
                {'type': 'datetime', 'key': 'deadline', 'required': True},
                {'type': 'float', 'key': 'estimated_hours', 'required': True},
                {'type': 'float', 'key': 'actual_hours', 'required': False},
                {'type': 'string', 'key': 'energy_level', 'size': 20, 'required': False},  # high, medium, low
                {'type': 'string', 'key': 'status', 'size': 30, 'required': True},  # todo, in-progress, completed
                {'type': 'datetime', 'key': 'scheduled_start', 'required': False},
                {'type': 'datetime', 'key': 'scheduled_end', 'required': False},
                {'type': 'datetime', 'key': 'completed_at', 'required': False},
                {'type': 'string', 'key': 'tags', 'size': 1000, 'required': False},  # JSON array as string
                {'type': 'boolean', 'key': 'is_recurring', 'required': False},
                {'type': 'string', 'key': 'recurring_rule', 'size': 255, 'required': False},
                {'type': 'datetime', 'key': 'created_at', 'required': True},
                {'type': 'datetime', 'key': 'updated_at', 'required': True},
            ]
        },
        {
            'name': 'schedules',
            'id': 'schedules_collection',
            'attributes': [
                {'type': 'string', 'key': 'user_id', 'size': 64, 'required': True},
                {'type': 'string', 'key': 'date', 'size': 20, 'required': True},  # YYYY-MM-DD
                {'type': 'integer', 'key': 'day_of_week', 'required': True},  # 0-6
                {'type': 'string', 'key': 'free_slots', 'size': 5000, 'required': False},  # JSON array
                {'type': 'string', 'key': 'commitments', 'size': 5000, 'required': False},  # JSON array
                {'type': 'string', 'key': 'study_slots', 'size': 5000, 'required': False},  # JSON array
                {'type': 'string', 'key': 'sleep_schedule', 'size': 500, 'required': False},  # JSON object
                {'type': 'datetime', 'key': 'created_at', 'required': True},
                {'type': 'datetime', 'key': 'updated_at', 'required': True},
            ]
        },
        {
            'name': 'notifications',
            'id': 'notifications_collection',
            'attributes': [
                {'type': 'string', 'key': 'user_id', 'size': 64, 'required': True},
                {'type': 'string', 'key': 'type', 'size': 50, 'required': True},  # reminder, deadline, progress, alert
                {'type': 'string', 'key': 'title', 'size': 255, 'required': True},
                {'type': 'string', 'key': 'message', 'size': 2000, 'required': True},
                {'type': 'string', 'key': 'task_id', 'size': 64, 'required': False},
                {'type': 'datetime', 'key': 'scheduled_for', 'required': False},
                {'type': 'datetime', 'key': 'sent_at', 'required': False},
                {'type': 'boolean', 'key': 'is_read', 'required': True},
                {'type': 'string', 'key': 'channel', 'size': 20, 'required': True},  # email, in_app, push
                {'type': 'datetime', 'key': 'created_at', 'required': True},
            ]
        },
        {
            'name': 'analytics',
            'id': 'analytics_collection',
            'attributes': [
                {'type': 'string', 'key': 'user_id', 'size': 64, 'required': True},
                {'type': 'string', 'key': 'date', 'size': 20, 'required': True},  # YYYY-MM-DD
                {'type': 'integer', 'key': 'tasks_completed', 'required': True},
                {'type': 'float', 'key': 'total_hours_worked', 'required': True},
                {'type': 'float', 'key': 'productivity_score', 'required': False},
                {'type': 'string', 'key': 'category_breakdown', 'size': 5000, 'required': False},  # JSON object
                {'type': 'string', 'key': 'peak_hours', 'size': 2000, 'required': False},  # JSON array
                {'type': 'string', 'key': 'goals_met', 'size': 2000, 'required': False},  # JSON array
                {'type': 'datetime', 'key': 'created_at', 'required': True},
            ]
        }
    ]
    
    # Create collections and attributes
    for col_data in collections:
        try:
            print(f"Creating collection: {col_data['name']}...")
            collection = databases.create_collection(
                database_id=DATABASE_ID,
                collection_id=col_data['id'],
                name=col_data['name'],
                permissions=["read(\"any\")", "write(\"users\")"]
            )
            print(f"Collection created: {collection['$id']}")
            current_col_id = collection['$id']
        except Exception as e:
            print(f"Collection '{col_data['name']}' might already exist: {e}")
            current_col_id = col_data['id']
        
        # Create attributes for this collection
        for attr in col_data['attributes']:
            try:
                if attr['type'] == 'string':
                    databases.create_string_attribute(
                        DATABASE_ID, current_col_id, 
                        attr['key'], attr['size'], attr['required']
                    )
                elif attr['type'] == 'datetime':
                    databases.create_datetime_attribute(
                        DATABASE_ID, current_col_id, 
                        attr['key'], attr['required']
                    )
                elif attr['type'] == 'integer':
                    databases.create_integer_attribute(
                        DATABASE_ID, current_col_id, 
                        attr['key'], attr['required']
                    )
                elif attr['type'] == 'float':
                    databases.create_float_attribute(
                        DATABASE_ID, current_col_id, 
                        attr['key'], attr['required']
                    )
                elif attr['type'] == 'boolean':
                    databases.create_boolean_attribute(
                        DATABASE_ID, current_col_id, 
                        attr['key'], attr['required']
                    )
                print(f"  Attribute '{attr['key']}' created.")
            except Exception as e:
                print(f"  Error creating attribute '{attr['key']}': {e}")
    
    # Create indexes for efficient queries
    create_indexes()
    
    print("\n=== COLLECTION IDS (add to .env) ===")
    for col in collections:
        print(f"{col['name'].upper()}_COLLECTION_ID={col['id']}")

def create_indexes():
    """Create database indexes for efficient queries"""
    print("\nCreating database indexes...")
    
    indexes_data = [
        # Tasks indexes
        {'collection': 'tasks_collection', 'keys': [('user_id', 'ASC')]},
        {'collection': 'tasks_collection', 'keys': [('user_id', 'ASC'), ('status', 'ASC')]},
        {'collection': 'tasks_collection', 'keys': [('user_id', 'ASC'), ('deadline', 'ASC')]},
        {'collection': 'tasks_collection', 'keys': [('user_id', 'ASC'), ('priority', 'ASC')]},
        {'collection': 'tasks_collection', 'keys': [('user_id', 'ASC'), ('category', 'ASC')]},
        
        # Schedules indexes
        {'collection': 'schedules_collection', 'keys': [('user_id', 'ASC'), ('date', 'ASC')]},
        
        # Notifications indexes
        {'collection': 'notifications_collection', 'keys': [('user_id', 'ASC'), ('is_read', 'ASC')]},
        {'collection': 'notifications_collection', 'keys': [('user_id', 'ASC'), ('created_at', 'DESC')]},
        
        # Analytics indexes
        {'collection': 'analytics_collection', 'keys': [('user_id', 'ASC'), ('date', 'ASC')]},
    ]
    
    for idx in indexes_data:
        try:
            idx_id = f"idx_{idx['collection']}_{'_'.join([k[0] for k in idx['keys']])}"
            databases.create_index(
                database_id=DATABASE_ID,
                collection_id=idx['collection'],
                index_id=idx_id,
                keys=idx['keys'],
                orders=['ASC'] * len(idx['keys'])
            )
            print(f"  Index '{idx_id}' created for {idx['collection']}")
        except Exception as e:
            print(f"  Error creating index for {idx['collection']}: {e}")

if __name__ == "__main__":
    setup_database()
