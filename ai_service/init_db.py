"""
Database initialization script for Student Task Management System
Creates all required Appwrite collections with proper schema and indexes
"""
from appwrite.client import Client
from appwrite.services.tables_db import TablesDB
from appwrite.enums.index_type import IndexType
from appwrite.enums.order_by import OrderBy
from appwrite.id import ID
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Client
client = Client()
client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
client.set_key(os.getenv('APPWRITE_API_KEY'))

tables_db = TablesDB(client)

DATABASE_ID = "scheduler_db"

def setup_database():
    print("Setting up Appwrite Database for Student Task Management System using TablesDB API...")
    
    # Create Database
    try:
        db = tables_db.create(
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
                {'type': 'string', 'key': 'free_slots', 'size': 4000, 'required': False},  # Reduced size to fit limits
                {'type': 'string', 'key': 'commitments', 'size': 4000, 'required': False},  # Reduced size
                {'type': 'string', 'key': 'study_slots', 'size': 4000, 'required': False},  # Reduced size
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
                {'type': 'string', 'key': 'category_breakdown', 'size': 4000, 'required': False},  # Reduced size
                {'type': 'string', 'key': 'peak_hours', 'size': 2000, 'required': False},  # JSON array
                {'type': 'string', 'key': 'goals_met', 'size': 2000, 'required': False},  # JSON array
                {'type': 'datetime', 'key': 'created_at', 'required': True},
            ]
        }
    ]
    
    # Create collections (tables) and attributes (columns)
    for col_data in collections:
        try:
            print(f"Creating table: {col_data['name']}...")
            table = tables_db.create_table(
                database_id=DATABASE_ID,
                table_id=col_data['id'],
                name=col_data['name'],
                permissions=["read(\"any\")", "write(\"users\")"]
            )
            print(f"Table created: {table['$id']}")
            current_table_id = table['$id']
        except Exception as e:
            print(f"Table '{col_data['name']}' might already exist: {e}")
            current_table_id = col_data['id']
        
        # Create attributes for this table
        for attr in col_data['attributes']:
            try:
                if attr['type'] == 'string':
                    tables_db.create_string_column(
                        DATABASE_ID, current_table_id, 
                        attr['key'], attr['size'], attr['required']
                    )
                elif attr['type'] == 'datetime':
                    tables_db.create_datetime_column(
                        DATABASE_ID, current_table_id, 
                        attr['key'], attr['required']
                    )
                elif attr['type'] == 'integer':
                    tables_db.create_integer_column(
                        DATABASE_ID, current_table_id, 
                        attr['key'], attr['required']
                    )
                elif attr['type'] == 'float':
                    tables_db.create_float_column(
                        DATABASE_ID, current_table_id, 
                        attr['key'], attr['required']
                    )
                elif attr['type'] == 'boolean':
                    tables_db.create_boolean_column(
                        DATABASE_ID, current_table_id, 
                        attr['key'], attr['required']
                    )
                print(f"  Column '{attr['key']}' created.")
            except Exception as e:
                print(f"  Error creating column '{attr['key']}': {e}")
    
    # Create indexes for efficient queries
    create_indexes()
    
    print("\n=== TABLE IDS (add to .env) ===")
    for col in collections:
        print(f"{col['name'].upper()}_COLLECTION_ID={col['id']}")

def create_indexes():
    """Create database indexes for efficient queries"""
    print("\nCreating database indexes...")
    
    indexes_data = [
        # Tasks indexes
        {'table': 'tasks_collection', 'key': 'idx_tasks_user', 'columns': ['user_id'], 'type': IndexType.KEY},
        {'table': 'tasks_collection', 'key': 'idx_tasks_user_status', 'columns': ['user_id', 'status'], 'type': IndexType.KEY},
        {'table': 'tasks_collection', 'key': 'idx_tasks_user_deadline', 'columns': ['user_id', 'deadline'], 'type': IndexType.KEY},
        {'table': 'tasks_collection', 'key': 'idx_tasks_user_priority', 'columns': ['user_id', 'priority'], 'type': IndexType.KEY},
        {'table': 'tasks_collection', 'key': 'idx_tasks_user_category', 'columns': ['user_id', 'category'], 'type': IndexType.KEY},
        
        # Schedules indexes
        {'table': 'schedules_collection', 'key': 'idx_schedules_user_date', 'columns': ['user_id', 'date'], 'type': IndexType.KEY},
        
        # Notifications indexes
        {'table': 'notifications_collection', 'key': 'idx_notifications_user_read', 'columns': ['user_id', 'is_read'], 'type': IndexType.KEY},
        {'table': 'notifications_collection', 'key': 'idx_notifications_user_created', 'columns': ['user_id', 'created_at'], 'type': IndexType.KEY},
        
        # Analytics indexes
        {'table': 'analytics_collection', 'key': 'idx_analytics_user_date', 'columns': ['user_id', 'date'], 'type': IndexType.KEY},
    ]
    
    for idx in indexes_data:
        try:
            orders = [OrderBy.ASC] * len(idx['columns'])
            # Notifications created_at is usually DESC
            if 'created_at' in idx['columns']:
                orders = [OrderBy.ASC if c != 'created_at' else OrderBy.DESC for c in idx['columns']]
                
            tables_db.create_index(
                database_id=DATABASE_ID,
                table_id=idx['table'],
                key=idx['key'],
                type=idx['type'],
                columns=idx['columns'],
                orders=orders
            )
            print(f"  Index '{idx['key']}' created for {idx['table']}")
        except Exception as e:
            print(f"  Error creating index for {idx['table']} ({idx['key']}): {e}")

if __name__ == "__main__":
    setup_database()
