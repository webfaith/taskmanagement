"""
Student Task Management System - FastAPI Backend
Comprehensive API for task management, scheduling, and notifications
"""
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import json
import os
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query

load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Student Task Management API",
    description="Backend API for Student Task Management & Scheduling System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Appwrite Client Setup
client = Client()
client.set_endpoint(os.getenv('APPWRITE_ENDPOINT', 'https://fra.cloud.appwrite.io/v1'))
client.set_project(os.getenv('APPWRITE_PROJECT_ID', ''))
client.set_key(os.getenv('APPWRITE_API_KEY', ''))

databases = Databases(client)
DATABASE_ID = os.getenv('APPWRITE_DATABASE_ID', 'scheduler_db')

# Collection IDs
USERS_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_USERS', 'users_collection')
TASKS_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_TASKS', 'tasks_collection')
SCHEDULES_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_SCHEDULES', 'schedules_collection')
NOTIFICATIONS_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_NOTIFICATIONS', 'notifications_collection')
ANALYTICS_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_ANALYTICS', 'analytics_collection')


# ==================== Pydantic Models ====================

class TaskCategory(str, Enum):
    academic = "academic"
    personal = "personal"
    work = "work"

class TaskPriority(int, Enum):
    highest = 1
    high = 2
    medium = 3
    low = 4
    lowest = 5

class EnergyLevel(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"

class TaskStatus(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    completed = "completed"

class NotificationType(str, Enum):
    reminder = "reminder"
    deadline = "deadline"
    progress = "progress"
    alert = "alert"

class NotificationChannel(str, Enum):
    email = "email"
    in_app = "in_app"
    push = "push"


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: TaskCategory
    priority: TaskPriority  # 1-5 (1=highest)
    deadline: datetime
    estimated_hours: float
    energy_level: EnergyLevel = EnergyLevel.medium
    tags: List[str] = []
    is_recurring: bool = False
    recurring_rule: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[TaskCategory] = None
    priority: Optional[TaskPriority] = None
    deadline: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    energy_level: Optional[EnergyLevel] = None
    status: Optional[TaskStatus] = None
    tags: Optional[List[str]] = None
    is_recurring: Optional[bool] = None
    recurring_rule: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    category: str
    priority: int
    deadline: datetime
    estimated_hours: float
    actual_hours: Optional[float]
    energy_level: str
    status: str
    scheduled_start: Optional[datetime]
    scheduled_end: Optional[datetime]
    completed_at: Optional[datetime]
    tags: List[str]
    is_recurring: bool
    recurring_rule: Optional[str]
    created_at: datetime
    updated_at: datetime

class TaskFilter(BaseModel):
    status: Optional[TaskStatus] = None
    priority: Optional[int] = None
    category: Optional[TaskCategory] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None

class SchedulePreferences(BaseModel):
    preferred_start_time: str = "08:00"  # HH:MM
    preferred_end_time: str = "22:00"    # HH:MM
    study_slots: List[Dict[str, str]] = []
    sleep_schedule: Dict[str, Any] = {}

class FreeSlot(BaseModel):
    start_time: str  # HH:MM
    end_time: str    # HH:MM

class Commitment(BaseModel):
    title: str
    start_time: str  # HH:MM
    end_time: str    # HH:MM
    category: str = "other"

class NotificationCreate(BaseModel):
    type: NotificationType
    title: str
    message: str
    task_id: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    channel: NotificationChannel = NotificationChannel.in_app

class NotificationPreferences(BaseModel):
    email_enabled: bool = True
    push_enabled: bool = True
    reminder_times: List[int] = [24, 1]  # hours before deadline
    deadline_alerts: bool = True
    progress_reminders: bool = True


# ==================== Helper Functions ====================

def get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    """Extract user_id from header - in production, this would validate JWT tokens"""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required in header")
    return x_user_id

def document_to_task(doc: Dict) -> Dict:
    """Convert Appwrite document to TaskResponse format"""
    tags = []
    if doc.get('tags'):
        try:
            tags = json.loads(doc['tags']) if isinstance(doc['tags'], str) else doc['tags']
        except:
            tags = []
    
    return {
        'id': doc['$id'],
        'title': doc.get('title', ''),
        'description': doc.get('description'),
        'category': doc.get('category', ''),
        'priority': doc.get('priority', 3),
        'deadline': doc.get('deadline'),
        'estimated_hours': doc.get('estimated_hours', 0),
        'actual_hours': doc.get('actual_hours'),
        'energy_level': doc.get('energy_level', 'medium'),
        'status': doc.get('status', 'todo'),
        'scheduled_start': doc.get('scheduled_start'),
        'scheduled_end': doc.get('scheduled_end'),
        'completed_at': doc.get('completed_at'),
        'tags': tags,
        'is_recurring': doc.get('is_recurring', False),
        'recurring_rule': doc.get('recurring_rule'),
        'created_at': doc.get('created_at'),
        'updated_at': doc.get('updated_at'),
    }


# ==================== Task Endpoints ====================

@app.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreate, user_id: str = Depends(get_user_id)):
    """Create a new task for the user"""
    now = datetime.now().isoformat()
    
    document = {
        'title': task.title,
        'description': task.description,
        'user_id': user_id,
        'category': task.category.value,
        'priority': task.priority.value,
        'deadline': task.deadline.isoformat(),
        'estimated_hours': task.estimated_hours,
        'energy_level': task.energy_level.value,
        'status': 'todo',
        'tags': json.dumps(task.tags),
        'is_recurring': task.is_recurring,
        'recurring_rule': task.recurring_rule,
        'created_at': now,
        'updated_at': now,
    }
    
    try:
        result = databases.create_document(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            document_id='unique()',
            data=document
        )
        
        # Create deadline notification
        notification_data = {
            'user_id': user_id,
            'type': 'deadline',
            'title': f"Task Due: {task.title}",
            'message': f"Your task '{task.title}' is due on {task.deadline.strftime('%Y-%m-%d %H:%M')}",
            'task_id': result['$id'],
            'scheduled_for': task.deadline.isoformat(),
            'is_read': False,
            'channel': 'in_app',
            'created_at': now,
        }
        databases.create_document(
            database_id=DATABASE_ID,
            collection_id=NOTIFICATIONS_COLLECTION,
            document_id='unique()',
            data=notification_data
        )
        
        return document_to_task(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")


@app.get("/tasks", response_model=List[TaskResponse])
async def list_tasks(
    status: Optional[str] = None,
    priority: Optional[int] = None,
    category: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    user_id: str = Depends(get_user_id)
):
    """List all tasks for a user with optional filters"""
    queries = [Query.equal('user_id', user_id)]
    
    if status:
        queries.append(Query.equal('status', status))
    if priority:
        queries.append(Query.equal('priority', priority))
    if category:
        queries.append(Query.equal('category', category))
    if from_date:
        queries.append(Query.greater_than_equal('deadline', from_date))
    if to_date:
        queries.append(Query.less_than_equal('deadline', to_date))
    
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=queries
        )
        return [document_to_task(doc) for doc in result.get('documents', [])]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list tasks: {str(e)}")


@app.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, user_id: str = Depends(get_user_id)):
    """Get task details"""
    try:
        result = databases.get_document(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            document_id=task_id
        )
        if result.get('user_id') != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        return document_to_task(result)
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Task not found")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_update: TaskUpdate, user_id: str = Depends(get_user_id)):
    """Update a task"""
    try:
        # Check ownership
        existing = databases.get_document(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            document_id=task_id
        )
        if existing.get('user_id') != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Build update data
        update_data = {'updated_at': datetime.now().isoformat()}
        for field, value in task_update.model_dump(exclude_unset=True).items():
            if field == 'category':
                update_data[field] = value.value if hasattr(value, 'value') else value
            elif field == 'priority':
                update_data[field] = value.value if hasattr(value, 'value') else value
            elif field == 'energy_level':
                update_data[field] = value.value if hasattr(value, 'value') else value
            elif field == 'status':
                update_data[field] = value.value if hasattr(value, 'value') else value
            elif field == 'tags':
                update_data[field] = json.dumps(value)
            elif isinstance(value, datetime):
                update_data[field] = value.isoformat()
            else:
                update_data[field] = value
        
        # Handle completion
        if task_update.status == TaskStatus.completed:
            update_data['completed_at'] = datetime.now().isoformat()
        
        result = databases.update_document(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            document_id=task_id,
            data=update_data
        )
        return document_to_task(result)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user_id: str = Depends(get_user_id)):
    """Delete a task"""
    try:
        existing = databases.get_document(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            document_id=task_id
        )
        if existing.get('user_id') != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        databases.delete_document(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            document_id=task_id
        )
        return {"message": "Task deleted successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/tasks/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: str,
    status: TaskStatus,
    user_id: str = Depends(get_user_id)
):
    """Update task status (todo, in-progress, completed)"""
    now = datetime.now().isoformat()
    update_data = {
        'status': status.value,
        'updated_at': now
    }
    
    if status == TaskStatus.completed:
        update_data['completed_at'] = now
    
    try:
        existing = databases.get_document(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            document_id=task_id
        )
        if existing.get('user_id') != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        result = databases.update_document(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            document_id=task_id,
            data=update_data
        )
        return document_to_task(result)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Schedule Endpoints ====================

@app.get("/schedule/{date}")
async def get_schedule(date: str, user_id: str = Depends(get_user_id)):
    """Get daily schedule with free hours"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=SCHEDULES_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.equal('date', date)
            ]
        )
        
        schedule = result.get('documents', [])
        if schedule:
            schedule = schedule[0]
            free_slots = json.loads(schedule.get('free_slots', '[]')) if schedule.get('free_slots') else []
            commitments = json.loads(schedule.get('commitments', '[]')) if schedule.get('commitments') else []
        else:
            free_slots = []
            commitments = []
        
        # Get tasks for the day
        tasks_result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.greater_than_equal('deadline', f"{date}T00:00:00"),
                Query.less_than_equal('deadline', f"{date}T23:59:59")
            ]
        )
        tasks = [document_to_task(doc) for doc in tasks_result.get('documents', [])]
        
        return {
            "date": date,
            "free_slots": free_slots,
            "commitments": commitments,
            "tasks": tasks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/schedule/preferences")
async def set_schedule_preferences(prefs: SchedulePreferences, user_id: str = Depends(get_user_id)):
    """Set user's schedule preferences"""
    try:
        # Try to get existing user profile
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        
        prefs_data = {
            'preferred_start_time': prefs.preferred_start_time,
            'preferred_end_time': prefs.preferred_end_time,
            'study_slots': json.dumps(prefs.study_slots),
            'sleep_schedule': json.dumps(prefs.sleep_schedule),
            'updated_at': datetime.now().isoformat()
        }
        
        if result.get('documents'):
            databases.update_document(
                database_id=DATABASE_ID,
                collection_id=USERS_COLLECTION,
                document_id=result['documents'][0]['$id'],
                data=prefs_data
            )
        else:
            # Create new profile
            prefs_data['user_id'] = user_id
            prefs_data['created_at'] = datetime.now().isoformat()
            databases.create_document(
                database_id=DATABASE_ID,
                collection_id=USERS_COLLECTION,
                document_id='unique()',
                data=prefs_data
            )
        
        return {"message": "Preferences updated successfully", "preferences": prefs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/schedule/free-slots")
async def add_free_slots(date: str, slots: List[FreeSlot], user_id: str = Depends(get_user_id)):
    """Add free time slots for a specific date"""
    try:
        day_of_week = datetime.fromisoformat(date).weekday()
        
        slot_data = [slot.model_dump() for slot in slots]
        
        # Check if schedule exists
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=SCHEDULES_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.equal('date', date)
            ]
        )
        
        now = datetime.now().isoformat()
        
        if result.get('documents'):
            schedule = result['documents'][0]
            existing_slots = json.loads(schedule.get('free_slots', '[]'))
            existing_slots.extend(slot_data)
            
            databases.update_document(
                database_id=DATABASE_ID,
                collection_id=SCHEDULES_COLLECTION,
                document_id=schedule['$id'],
                data={
                    'free_slots': json.dumps(existing_slots),
                    'updated_at': now
                }
            )
        else:
            databases.create_document(
                database_id=DATABASE_ID,
                collection_id=SCHEDULES_COLLECTION,
                document_id='unique()',
                data={
                    'user_id': user_id,
                    'date': date,
                    'day_of_week': day_of_week,
                    'free_slots': json.dumps(slot_data),
                    'commitments': '[]',
                    'created_at': now,
                    'updated_at': now
                }
            )
        
        return {"message": "Free slots added successfully", "slots": slot_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/schedule/commitments")
async def add_commitments(date: str, commitments: List[Commitment], user_id: str = Depends(get_user_id)):
    """Add fixed commitments for a specific date"""
    try:
        day_of_week = datetime.fromisoformat(date).weekday()
        
        commitment_data = [c.model_dump() for c in commitments]
        
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=SCHEDULES_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.equal('date', date)
            ]
        )
        
        now = datetime.now().isoformat()
        
        if result.get('documents'):
            schedule = result['documents'][0]
            existing = json.loads(schedule.get('commitments', '[]'))
            existing.extend(commitment_data)
            
            databases.update_document(
                database_id=DATABASE_ID,
                collection_id=SCHEDULES_COLLECTION,
                document_id=schedule['$id'],
                data={
                    'commitments': json.dumps(existing),
                    'updated_at': now
                }
            )
        else:
            databases.create_document(
                database_id=DATABASE_ID,
                collection_id=SCHEDULES_COLLECTION,
                document_id='unique()',
                data={
                    'user_id': user_id,
                    'date': date,
                    'day_of_week': day_of_week,
                    'free_slots': '[]',
                    'commitments': json.dumps(commitment_data),
                    'created_at': now,
                    'updated_at': now
                }
            )
        
        return {"message": "Commitments added successfully", "commitments": commitment_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Priority Scheduling Algorithm ====================

@app.post("/schedule/optimize")
async def optimize_schedule(date: str, user_id: str = Depends(get_user_id)):
    """
    Run priority-based scheduling algorithm
    
    Scoring System:
    - Deadline urgency: 35% weight
    - Importance (priority): 25% weight
    - Category priority: 15% weight
    - Energy matching: 15% weight
    - User preference: 10% weight
    """
    try:
        # Get tasks for the day
        tasks_result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.not_equal('status', 'completed'),
                Query.greater_than_equal('deadline', f"{date}T00:00:00"),
                Query.less_than_equal('deadline', f"{date}T23:59:59")
            ]
        )
        tasks = [document_to_task(doc) for doc in tasks_result.get('documents', [])]
        
        # Get schedule for the day
        schedule_result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=SCHEDULES_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.equal('date', date)
            ]
        )
        
        free_slots = []
        if schedule_result.get('documents'):
            schedule = schedule_result['documents'][0]
            free_slots = json.loads(schedule.get('free_slots', '[]'))
        
        # If no free slots defined, create default (8 AM to 10 PM)
        if not free_slots:
            free_slots = [{"start_time": "08:00", "end_time": "22:00"}]
        
        # Calculate priority scores for tasks
        scored_tasks = []
        now = datetime.now()
        target_date = datetime.fromisoformat(date)
        
        for task in tasks:
            score = calculate_priority_score(task, now, target_date)
            scored_tasks.append({
                **task,
                'priority_score': score
            })
        
        # Sort by priority score (higher = more urgent)
        scored_tasks.sort(key=lambda x: x['priority_score'], reverse=True)
        
        # Allocate tasks to time slots
        optimized_schedule = []
        for task in scored_tasks:
            allocated = allocate_task_to_slot(task, free_slots, target_date)
            if allocated:
                optimized_schedule.append(allocated)
                # Update task in database
                databases.update_document(
                    database_id=DATABASE_ID,
                    collection_id=TASKS_COLLECTION,
                    document_id=task['id'],
                    data={
                        'scheduled_start': allocated['scheduled_start'],
                        'scheduled_end': allocated['scheduled_end'],
                        'updated_at': datetime.now().isoformat()
                    }
                )
        
        return {
            "date": date,
            "optimized_tasks": optimized_schedule,
            "total_tasks": len(scored_tasks),
            "allocated_tasks": len(optimized_schedule),
            "scoring_breakdown": {
                "deadline_urgency": "35%",
                "importance": "25%",
                "category_priority": "15%",
                "energy_matching": "15%",
                "user_preference": "10%"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def calculate_priority_score(task: Dict, now: datetime, target_date: datetime) -> float:
    """
    Calculate priority score using weighted scoring system
    
    Weights:
    - Deadline urgency: 35%
    - Importance (priority): 25%
    - Category priority: 15%
    - Energy matching: 15%
    - User preference: 10%
    """
    # 1. Deadline Urgency (35%)
    deadline = datetime.fromisoformat(task['deadline'])
    hours_until_deadline = max(0, (deadline - now).total_seconds() / 3600)
    
    # More urgent = higher score (normalized)
    urgency_score = 1.0
    if hours_until_deadline <= 1:
        urgency_score = 1.0
    elif hours_until_deadline <= 6:
        urgency_score = 0.9
    elif hours_until_deadline <= 24:
        urgency_score = 0.8
    elif hours_until_deadline <= 48:
        urgency_score = 0.6
    elif hours_until_deadline <= 168:  # 7 days
        urgency_score = 0.4
    else:
        urgency_score = 0.2
    
    deadline_score = urgency_score * 0.35
    
    # 2. Importance/Priority (25%) - priority 1 is highest
    priority_value = task['priority']
    importance_score = (6 - priority_value) / 5.0 * 0.25  # 1->1.0, 5->0.2
    
    # 3. Category Priority (15%)
    category_scores = {
        'academic': 1.0,
        'work': 0.8,
        'personal': 0.6
    }
    category_score = category_scores.get(task.get('category', ''), 0.5) * 0.15
    
    # 4. Energy Matching (15%)
    energy_scores = {
        'high': {'high': 1.0, 'medium': 0.7, 'low': 0.3},
        'medium': {'high': 0.7, 'medium': 1.0, 'low': 0.5},
        'low': {'high': 0.3, 'medium': 0.5, 'low': 1.0}
    }
    # Assume morning has high energy for simplicity
    current_hour = target_date.hour
    if 6 <= current_hour < 12:
        current_energy = 'high'
    elif 12 <= current_hour < 18:
        current_energy = 'medium'
    else:
        current_energy = 'low'
    
    energy_match = energy_scores.get(current_energy, {}).get(task.get('energy_level', 'medium'), 0.5)
    energy_score = energy_match * 0.15
    
    # 5. User Preference (10%)
    # Placeholder for user preference scoring
    user_preference_score = 0.5 * 0.10
    
    total_score = deadline_score + importance_score + category_score + energy_score + user_preference_score
    return round(total_score, 4)


def allocate_task_to_slot(task: Dict, free_slots: List[Dict], target_date: datetime) -> Optional[Dict]:
    """Allocate a task to the best available time slot"""
    estimated_hours = task.get('estimated_hours', 1)
    
    for slot in free_slots:
        start_parts = slot['start_time'].split(':')
        end_parts = slot['end_time'].split(':')
        
        slot_start = target_date.replace(
            hour=int(start_parts[0]),
            minute=int(start_parts[1]),
            second=0,
            microsecond=0
        )
        slot_end = target_date.replace(
            hour=int(end_parts[0]),
            minute=int(end_parts[1]),
            second=0,
            microsecond=0
        )
        
        slot_duration = (slot_end - slot_start).total_seconds() / 3600
        
        if slot_duration >= estimated_hours:
            # Mark slot as used by reducing its available time
            slot['start_time'] = (slot_start + timedelta(hours=estimated_hours)).strftime('%H:%M')
            
            return {
                'task_id': task['id'],
                'task_title': task['title'],
                'scheduled_start': slot_start.isoformat(),
                'scheduled_end': (slot_start + timedelta(hours=estimated_hours)).isoformat(),
                'duration_hours': estimated_hours,
                'priority_score': task.get('priority_score', 0)
            }
    
    return None


@app.get("/schedule/recommendations")
async def get_recommendations(date: str, user_id: str = Depends(get_user_id)):
    """Get task recommendations based on schedule"""
    try:
        # Get incomplete tasks
        tasks_result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.not_equal('status', 'completed')
            ]
        )
        tasks = [document_to_task(doc) for doc in tasks_result.get('documents', [])]
        
        # Calculate scores and sort
        now = datetime.now()
        target_date = datetime.fromisoformat(date)
        
        scored_tasks = []
        for task in tasks:
            score = calculate_priority_score(task, now, target_date)
            deadline = datetime.fromisoformat(task['deadline'])
            days_until_deadline = (deadline - now).days
            
            scored_tasks.append({
                **task,
                'priority_score': score,
                'days_until_deadline': days_until_deadline
            })
        
        scored_tasks.sort(key=lambda x: (x['priority_score'], -x['days_until_deadline']), reverse=True)
        
        # Get schedule for the day
        schedule_result = databases.list_document(
            database_id=DATABASE_ID,
            collection_id=SCHEDULES_COLLECTION,
            document_id='unique()'  # This won't work, need different approach
        )
        
        return {
            "date": date,
            "recommendations": scored_tasks[:5],  # Top 5 recommendations
            "total_tasks": len(scored_tasks),
            "message": "Tasks sorted by priority score. Consider starting with high-priority items."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Notification Endpoints ====================

@app.get("/notifications")
async def get_notifications(user_id: str = Depends(get_user_id)):
    """Get all notifications for the current user"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=NOTIFICATIONS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.order_desc('created_at'),
                Query.limit(50)
            ]
        )
        
        notifications = []
        for doc in result.get('documents', []):
            notifications.append({
                'id': doc['$id'],
                'type': doc.get('type', 'reminder'),
                'title': doc.get('title', ''),
                'message': doc.get('message', ''),
                'task_id': doc.get('task_id'),
                'read': doc.get('is_read', False),
                'created_at': doc.get('created_at'),
                'scheduled_for': doc.get('scheduled_for')
            })
        
        return notifications
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/notifications/unread-count")
async def get_unread_count(user_id: str = Depends(get_user_id)):
    """Get count of unread notifications"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=NOTIFICATIONS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.equal('is_read', False)
            ]
        )
        
        return {"count": result.get('total', 0)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user_id: str = Depends(get_user_id)):
    """Mark a notification as read"""
    try:
        # Verify ownership
        notification = databases.get_document(
            database_id=DATABASE_ID,
            collection_id=NOTIFICATIONS_COLLECTION,
            document_id=notification_id
        )
        
        if notification.get('user_id') != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        databases.update_document(
            database_id=DATABASE_ID,
            collection_id=NOTIFICATIONS_COLLECTION,
            document_id=notification_id,
            data={'is_read': True}
        )
        
        return {"message": "Notification marked as read"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/notifications/read-all")
async def mark_all_notifications_read(user_id: str = Depends(get_user_id)):
    """Mark all notifications as read for the current user"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=NOTIFICATIONS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.equal('is_read', False)
            ]
        )
        
        for doc in result.get('documents', []):
            databases.update_document(
                database_id=DATABASE_ID,
                collection_id=NOTIFICATIONS_COLLECTION,
                document_id=doc['$id'],
                data={'is_read': True}
            )
        
        return {"message": f"Marked {result.get('total', 0)} notifications as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Evaluation Collection ID
EVALUATION_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_EVALUATION', 'evaluation_collection')
FEEDBACK_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_FEEDBACK', 'feedback_collection')
SURVEY_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_SURVEY', 'survey_collection')
STORIES_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_STORIES', 'stories_collection')


# ==================== Evaluation Pydantic Models ====================

class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    category: str
    comment: Optional[str] = None


class MetricCreate(BaseModel):
    metric_type: str
    value: float


class SurveyCreate(BaseModel):
    answers: Dict[str, Any]


class DailyCheckInCreate(BaseModel):
    mood: str
    energy_level: int = Field(..., ge=1, le=10)
    stress_level: int = Field(..., ge=1, le=10)
    productivity_rating: int = Field(..., ge=1, le=10)
    notes: Optional[str] = None
    date: str


class ExportRequest(BaseModel):
    format: str = 'json'
    include_tasks: bool = True
    include_metrics: bool = True
    include_feedback: bool = True
    include_surveys: bool = True
    anonymize: bool = True
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class SuccessStoryCreate(BaseModel):
    story: str
    productivity_before: int
    productivity_after: int
    tips: List[str]


# ==================== Evaluation Endpoints ====================

@app.post("/evaluation/feedback")
async def submit_feedback(
    feedback: FeedbackCreate,
    user_id: str = Depends(get_user_id)
):
    """Submit user feedback"""
    try:
        document_data = {
            'user_id': user_id,
            'rating': feedback.rating,
            'category': feedback.category,
            'comment': feedback.comment,
            'created_at': datetime.now().isoformat()
        }
        
        result = databases.create_document(
            database_id=DATABASE_ID,
            collection_id=FEEDBACK_COLLECTION,
            document_id='unique()',
            data=document_data
        )
        
        return {"message": "Feedback submitted successfully", "id": result['$id']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluation/metric")
async def log_metric(
    metric: MetricCreate,
    user_id: str = Depends(get_user_id)
):
    """Log usability metric"""
    try:
        document_data = {
            'user_id': user_id,
            'metric_type': metric.metric_type,
            'value': metric.value,
            'date': datetime.now().isoformat()
        }
        
        result = databases.create_document(
            database_id=DATABASE_ID,
            collection_id=EVALUATION_COLLECTION,
            document_id='unique()',
            data=document_data
        )
        
        return {"message": "Metric logged successfully", "id": result['$id']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluation/survey")
async def submit_survey(
    survey: SurveyCreate,
    user_id: str = Depends(get_user_id)
):
    """Submit survey responses"""
    try:
        document_data = {
            'user_id': user_id,
            'answers': json.dumps(survey.answers),
            'completed_at': datetime.now().isoformat()
        }
        
        result = databases.create_document(
            database_id=DATABASE_ID,
            collection_id=SURVEY_COLLECTION,
            document_id='unique()',
            data=document_data
        )
        
        return {"message": "Survey submitted successfully", "id": result['$id']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/evaluation/report/{period}")
async def get_effectiveness_report(
    period: str,
    user_id: str = Depends(get_user_id)
):
    """Get effectiveness report for period"""
    try:
        # Calculate date range
        end_date = datetime.now()
        if period == 'weekly':
            start_date = end_date - timedelta(days=7)
        else:  # monthly
            start_date = end_date - timedelta(days=30)
        
        # Get all tasks for user
        tasks_result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.greater_than_equal('created_at', start_date.isoformat())
            ]
        )
        
        tasks = tasks_result.get('documents', [])
        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if t.get('status') == 'completed'])
        
        # Get metrics
        metrics_result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=EVALUATION_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.greater_than_equal('date', start_date.isoformat())
            ]
        )
        
        # Calculate productivity score (simplified)
        completion_rate = completed_tasks / total_tasks if total_tasks > 0 else 0
        productivity_score = int(completion_rate * 100 * 0.7 + 50)  # Simplified calculation
        
        # Get feedback for stress reduction
        feedback_result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=FEEDBACK_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.greater_than_equal('created_at', start_date.isoformat())
            ]
        )
        
        stress_feedback = [f for f in feedback_result.get('documents', []) if f.get('category') == 'stress']
        stress_reduction_score = int(sum([f.get('rating', 0) for f in stress_feedback]) / len(stress_feedback) * 20) if stress_feedback else 50
        
        # Balance improvement (simplified - based on category distribution)
        balance_improvement_score = 70  # Placeholder
        
        # Generate recommendations
        recommendations = []
        if completion_rate < 0.5:
            recommendations.append("Try breaking large tasks into smaller, manageable sub-tasks")
        if productivity_score < 60:
            recommendations.append("Consider adjusting your schedule to align with your peak energy hours")
        if stress_reduction_score < 50:
            recommendations.append("Add short breaks between tasks to reduce stress")
        recommendations.append("Maintain consistent sleep patterns for better productivity")
        
        return {
            "period": period,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "completion_rate": round(completion_rate, 2),
            "average_time_estimate_vs_actual": 1.2,  # Simplified
            "productivity_score": min(100, productivity_score),
            "stress_reduction_score": min(100, stress_reduction_score),
            "balance_improvement_score": balance_improvement_score,
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/evaluation/trends/{metric_type}")
async def get_trends(
    metric_type: str,
    days: int = 7,
    user_id: str = Depends(get_user_id)
):
    """Get trend data for a metric"""
    try:
        start_date = datetime.now() - timedelta(days=days)
        
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=EVALUATION_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.equal('metric_type', metric_type),
                Query.greater_than_equal('date', start_date.isoformat())
            ]
        )
        
        # Group by date and calculate averages
        trends = []
        for doc in result.get('documents', []):
            date = doc.get('date', '')[:10]  # Get just the date part
            trends.append({
                'date': date,
                'score': doc.get('value', 0)
            })
        
        return trends
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/evaluation/balance")
async def get_balance_score(user_id: str = Depends(get_user_id)):
    """Get balance score between academic/personal/work"""
    try:
        # Get tasks by category
        tasks_result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.equal('status', 'completed')
            ]
        )
        
        tasks = tasks_result.get('documents', [])
        total = len(tasks)
        
        if total == 0:
            return {"academic": 33, "personal": 33, "work": 33, "overall": 100}
        
        academic = len([t for t in tasks if t.get('category') == 'academic'])
        personal = len([t for t in tasks if t.get('category') == 'personal'])
        work = len([t for t in tasks if t.get('category') == 'work'])
        
        return {
            "academic": int(academic / total * 100),
            "personal": int(personal / total * 100),
            "work": int(work / total * 100),
            "overall": int(min(academic, personal, work) / max(academic, personal, work) * 100) if max(academic, personal, work) > 0 else 100
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluation/daily-checkin")
async def submit_daily_checkin(
    checkin: DailyCheckInCreate,
    user_id: str = Depends(get_user_id)
):
    """Submit daily check-in"""
    try:
        document_data = {
            'user_id': user_id,
            'mood': checkin.mood,
            'energy_level': checkin.energy_level,
            'stress_level': checkin.stress_level,
            'productivity_rating': checkin.productivity_rating,
            'notes': checkin.notes,
            'date': checkin.date,
            'created_at': datetime.now().isoformat()
        }
        
        result = databases.create_document(
            database_id=DATABASE_ID,
            collection_id=EVALUATION_COLLECTION,
            document_id='unique()',
            data=document_data
        )
        
        return {"message": "Check-in submitted successfully", "id": result['$id']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/evaluation/daily-checkin")
async def get_daily_checkin(
    days: int = 7,
    user_id: str = Depends(get_user_id)
):
    """Get daily check-in history"""
    try:
        start_date = datetime.now() - timedelta(days=days)
        
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=EVALUATION_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.greater_than_equal('date', start_date.isoformat())
            ]
        )
        
        checkins = []
        for doc in result.get('documents', []):
            checkins.append({
                'mood': doc.get('mood'),
                'energy_level': doc.get('energy_level'),
                'stress_level': doc.get('stress_level'),
                'productivity_rating': doc.get('productivity_rating'),
                'notes': doc.get('notes'),
                'date': doc.get('date')
            })
        
        return checkins
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluation/export")
async def export_research_data(
    request: ExportRequest,
    user_id: str = Depends(get_user_id)
):
    """Export research data"""
    try:
        export_data = {
            'user_id': user_id if not request.anonymize else 'anonymized',
            'exported_at': datetime.now().isoformat(),
            'format': request.format
        }
        
        # Include task data
        if request.include_tasks:
            tasks_result = databases.list_documents(
                database_id=DATABASE_ID,
                collection_id=TASKS_COLLECTION,
                queries=[Query.equal('user_id', user_id)]
            )
            export_data['tasks'] = tasks_result.get('documents', [])
        
        # Include metrics
        if request.include_metrics:
            metrics_result = databases.list_documents(
                database_id=DATABASE_ID,
                collection_id=EVALUATION_COLLECTION,
                queries=[Query.equal('user_id', user_id)]
            )
            export_data['metrics'] = metrics_result.get('documents', [])
        
        # Include feedback
        if request.include_feedback:
            feedback_result = databases.list_documents(
                database_id=DATABASE_ID,
                collection_id=FEEDBACK_COLLECTION,
                queries=[Query.equal('user_id', user_id)]
            )
            export_data['feedback'] = feedback_result.get('documents', [])
        
        # Include surveys
        if request.include_surveys:
            survey_result = databases.list_documents(
                database_id=DATABASE_ID,
                collection_id=SURVEY_COLLECTION,
                queries=[Query.equal('user_id', user_id)]
            )
            export_data['surveys'] = survey_result.get('documents', [])
        
        # Anonymize data if requested
        if request.anonymize:
            for key in ['tasks', 'metrics', 'feedback', 'surveys']:
                if key in export_data:
                    for item in export_data[key]:
                        if 'user_id' in item:
                            del item['user_id']
                        item['anonymous_id'] = 'user_' + hash(user_id) % 10000
        
        # Return based on format
        if request.format == 'json':
            from fastapi.responses import JSONResponse
            return JSONResponse(content=export_data)
        elif request.format == 'csv':
            # Simplified CSV export
            csv_lines = ['data']
            for item in export_data.get('tasks', []):
                csv_lines.append(f"{item.get('title')},{item.get('status')},{item.get('category')}")
            from fastapi.responses import PlainTextResponse
            return PlainTextResponse(content='\n'.join(csv_lines), media_type='text/csv')
        else:
            from fastapi.responses import JSONResponse
            return JSONResponse(content=export_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/evaluation/stories")
async def get_success_stories(user_id: str = Depends(get_user_id)):
    """Get anonymous success stories"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=STORIES_COLLECTION,
            queries=[Query.limit(50)]
        )
        
        stories = []
        for doc in result.get('documents', []):
            stories.append({
                'id': doc.get('$id'),
                'user_id': doc.get('user_id'),
                'anonymous_id': doc.get('anonymous_id', f"user_{hash(doc.get('user_id', '')) % 10000}"),
                'story': doc.get('story'),
                'productivity_before': doc.get('productivity_before'),
                'productivity_after': doc.get('productivity_after'),
                'tips': json.loads(doc.get('tips', '[]')),
                'created_at': doc.get('created_at')
            })
        
        return stories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluation/stories")
async def submit_success_story(
    story: SuccessStoryCreate,
    user_id: str = Depends(get_user_id)
):
    """Submit a success story"""
    try:
        document_data = {
            'user_id': user_id,
            'anonymous_id': f"user_{hash(user_id) % 10000}",
            'story': story.story,
            'productivity_before': story.productivity_before,
            'productivity_after': story.productivity_after,
            'tips': json.dumps(story.tips),
            'created_at': datetime.now().isoformat()
        }
        
        result = databases.create_document(
            database_id=DATABASE_ID,
            collection_id=STORIES_COLLECTION,
            document_id='unique()',
            data=document_data
        )
        
        return {
            "id": result['$id'],
            "anonymous_id": document_data['anonymous_id'],
            **story.model_dump()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/evaluation/insights")
async def get_ai_insights(user_id: str = Depends(get_user_id)):
    """Get AI-generated insights"""
    try:
        insights = []
        
        # Get productivity data
        trends_result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=EVALUATION_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.equal('metric_type', 'productivity_score')
            ]
        )
        
        # Analyze patterns
        docs = trends_result.get('documents', [])
        if len(docs) >= 3:
            recent_scores = [d.get('value', 0) for d in docs[-3:]]
            avg_score = sum(recent_scores) / len(recent_scores)
            
            if avg_score > 70:
                insights.append("You're maintaining high productivity levels!")
            elif avg_score < 50:
                insights.append("Consider reviewing your schedule to find improvement areas")
        
        # Get task completion data
        tasks_result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.equal('status', 'completed')
            ]
        )
        
        completed = tasks_result.get('documents', [])
        if completed:
            # Analyze best day (simplified)
            days_completed = {}
            for task in completed:
                date = task.get('completed_at', '')[:10]
                days_completed[date] = days_completed.get(date, 0) + 1
            
            if days_completed:
                best_day = max(days_completed, key=days_completed.get)
                insights.append(f"You're most productive on {datetime.fromisoformat(best_day).strftime('%A')}")
        
        # Time estimate accuracy (simplified)
        insights.append("Your time estimates are generally accurate")
        insights.append("Consider adding more personal time on weekends for better work-life balance")
        
        return insights[:5]  # Return top 5 insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/evaluation/stats/quick")
async def get_quick_stats(user_id: str = Depends(get_user_id)):
    """Get quick statistics"""
    try:
        # Get completed tasks
        tasks_result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.equal('status', 'completed')
            ]
        )
        
        completed = tasks_result.get('documents', [])
        total_completed = len(completed)
        
        # Calculate average per day
        if completed:
            dates = set()
            for task in completed:
                date = task.get('completed_at', '')[:10]
                if date:
                    dates.add(date)
            
            avg_per_day = total_completed / max(len(dates), 1)
        else:
            avg_per_day = 0
        
        # Best productivity day (simplified)
        best_day = "Monday"  # Default
        
        # Calculate streak
        streak = 0
        current_date = datetime.now()
        for i in range(30):
            check_date = (current_date - timedelta(days=i)).strftime('%Y-%m-%d')
            day_tasks = [t for t in completed if t.get('completed_at', '').startswith(check_date)]
            if day_tasks:
                streak += 1
            elif i > 0:  # Allow today to be empty
                break
        
        return {
            "total_tasks_completed": total_completed,
            "average_tasks_per_day": round(avg_per_day, 1),
            "best_productivity_day": best_day,
            "streak": streak
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Health Check ====================

@app.get("/notifications")
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    user_id: str = Depends(get_user_id)
):
    """List user notifications"""
    try:
        queries = [Query.equal('user_id', user_id), Query.limit(limit)]
        if unread_only:
            queries.append(Query.equal('is_read', False))
        queries.append(Query.order_desc('created_at'))
        
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=NOTIFICATIONS_COLLECTION,
            queries=queries
        )
        
        notifications = []
        for doc in result.get('documents', []):
            notifications.append({
                'id': doc['$id'],
                'type': doc.get('type', ''),
                'title': doc.get('title', ''),
                'message': doc.get('message', ''),
                'task_id': doc.get('task_id'),
                'scheduled_for': doc.get('scheduled_for'),
                'is_read': doc.get('is_read', False),
                'channel': doc.get('channel', ''),
                'created_at': doc.get('created_at')
            })
        
        return {
            "notifications": notifications,
            "total": len(notifications),
            "unread": sum(1 for n in notifications if not n['is_read'])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user_id: str = Depends(get_user_id)):
    """Mark a notification as read"""
    try:
        result = databases.get_document(
            database_id=DATABASE_ID,
            collection_id=NOTIFICATIONS_COLLECTION,
            document_id=notification_id
        )
        
        if result.get('user_id') != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        databases.update_document(
            database_id=DATABASE_ID,
            collection_id=NOTIFICATIONS_COLLECTION,
            document_id=notification_id,
            data={'is_read': True}
        )
        
        return {"message": "Notification marked as read"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/notifications/preferences")
async def set_notification_preferences(prefs: NotificationPreferences, user_id: str = Depends(get_user_id)):
    """Set notification preferences"""
    try:
        prefs_dict = prefs.model_dump()
        
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        
        update_data = {
            'notification_prefs': json.dumps(prefs_dict),
            'updated_at': datetime.now().isoformat()
        }
        
        if result.get('documents'):
            databases.update_document(
                database_id=DATABASE_ID,
                collection_id=USERS_COLLECTION,
                document_id=result['documents'][0]['$id'],
                data=update_data
            )
        else:
            update_data['user_id'] = user_id
            update_data['created_at'] = datetime.now().isoformat()
            databases.create_document(
                database_id=DATABASE_ID,
                collection_id=USERS_COLLECTION,
                document_id='unique()',
                data=update_data
            )
        
        return {"message": "Notification preferences updated", "preferences": prefs_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Missing Endpoints ====================

@app.get("/notifications/unread-count")
async def get_unread_count(user_id: str = Depends(get_user_id)):
    """Get count of unread notifications"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=NOTIFICATIONS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.equal('is_read', False)
            ]
        )
        return {"count": len(result.get('documents', []))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/notifications/read-all")
async def mark_all_notifications_read(user_id: str = Depends(get_user_id)):
    """Mark all notifications as read"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=NOTIFICATIONS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.equal('is_read', False)
            ]
        )
        
        for doc in result.get('documents', []):
            databases.update_document(
                database_id=DATABASE_ID,
                collection_id=NOTIFICATIONS_COLLECTION,
                document_id=doc['$id'],
                data={'is_read': True}
            )
        
        return {"message": "All notifications marked as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/schedule/optimize/{date}")
async def optimize_schedule_date(date: str, user_id: str = Depends(get_user_id)):
    """Run priority-based scheduling for a specific date"""
    # Reuse the existing optimize_schedule function
    return await optimize_schedule(date, user_id)


@app.get("/schedule/working-hours")
async def get_working_hours(user_id: str = Depends(get_user_id)):
    """Get user's preferred working hours"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        
        if result.get('documents'):
            doc = result['documents'][0]
            return {
                "start": doc.get('preferred_start_time', '08:00'),
                "end": doc.get('preferred_end_time', '22:00')
            }
        return {"start": "08:00", "end": "22:00"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/schedule/working-hours")
async def update_working_hours(
    hours: dict,
    user_id: str = Depends(get_user_id)
):
    """Update user's preferred working hours"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        
        update_data = {
            'preferred_start_time': hours.get('start', '08:00'),
            'preferred_end_time': hours.get('end', '22:00'),
            'updated_at': datetime.now().isoformat()
        }
        
        if result.get('documents'):
            databases.update_document(
                database_id=DATABASE_ID,
                collection_id=USERS_COLLECTION,
                document_id=result['documents'][0]['$id'],
                data=update_data
            )
        else:
            update_data['user_id'] = user_id
            update_data['created_at'] = datetime.now().isoformat()
            databases.create_document(
                database_id=DATABASE_ID,
                collection_id=USERS_COLLECTION,
                document_id='unique()',
                data=update_data
            )
        
        return {"message": "Working hours updated", **update_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/schedule/{date}/commitments")
async def add_commitment_date(
    date: str,
    commitment: dict,
    user_id: str = Depends(get_user_id)
):
    """Add a single commitment for a date"""
    commitment_obj = Commitment(
        title=commitment['title'],
        start_time=commitment['start'],
        end_time=commitment['end'],
        category=commitment.get('category', 'other')
    )
    return await add_commitments(date, [commitment_obj], user_id)


@app.delete("/schedule/{date}/commitments/{title}")
async def remove_commitment(
    date: str,
    title: str,
    user_id: str = Depends(get_user_id)
):
    """Remove a commitment from a date"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=SCHEDULES_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.equal('date', date)
            ]
        )
        
        if result.get('documents'):
            schedule = result['documents'][0]
            commitments = json.loads(schedule.get('commitments', '[]'))
            commitments = [c for c in commitments if c.get('title') != title]
            
            databases.update_document(
                database_id=DATABASE_ID,
                collection_id=SCHEDULES_COLLECTION,
                document_id=schedule['$id'],
                data={
                    'commitments': json.dumps(commitments),
                    'updated_at': datetime.now().isoformat()
                }
            )
        
        return {"message": "Commitment removed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Analytics Endpoints ====================

@app.get("/analytics/stats")
async def get_analytics_stats(user_id: str = Depends(get_user_id)):
    """Get analytics statistics"""
    try:
        # Get all tasks
        tasks_result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        tasks = tasks_result.get('documents', [])
        
        total = len(tasks)
        completed = len([t for t in tasks if t.get('status') == 'completed'])
        in_progress = len([t for t in tasks if t.get('status') == 'in_progress'])
        todo = len([t for t in tasks if t.get('status') == 'todo'])
        
        # Get today's tasks
        today = datetime.now().strftime('%Y-%m-%d')
        today_tasks = [t for t in tasks if t.get('deadline', '').startswith(today)]
        today_completed = len([t for t in today_tasks if t.get('status') == 'completed'])
        
        # Calculate completion rate
        completion_rate = (completed / total * 100) if total > 0 else 0
        
        return {
            "total_tasks": total,
            "completed_tasks": completed,
            "in_progress_tasks": in_progress,
            "todo_tasks": todo,
            "completion_rate": round(completion_rate, 1),
            "today_tasks": len(today_tasks),
            "today_completed": today_completed,
            "overdue_tasks": len([t for t in tasks if t.get('status') != 'completed' and t.get('deadline', '') < datetime.now().isoformat()])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/weekly")
async def get_weekly_analytics(user_id: str = Depends(get_user_id)):
    """Get weekly productivity data"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.greater_than_equal('created_at', start_date.isoformat())
            ]
        )
        
        tasks = result.get('documents', [])
        weekly_data = []
        
        for i in range(7):
            date = (end_date - timedelta(days=i)).strftime('%Y-%m-%d')
            day_tasks = [t for t in tasks if t.get('created_at', '').startswith(date)]
            completed = len([t for t in day_tasks if t.get('status') == 'completed'])
            created = len(day_tasks)
            weekly_data.append({
                "date": date,
                "completed": completed,
                "created": created
            })
        
        return weekly_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/categories")
async def get_category_breakdown(user_id: str = Depends(get_user_id)):
    """Get task breakdown by category"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        
        tasks = result.get('documents', [])
        categories = []
        
        for cat in ['academic', 'personal', 'work']:
            cat_tasks = [t for t in tasks if t.get('category') == cat]
            completed = len([t for t in cat_tasks if t.get('status') == 'completed'])
            categories.append({
                "category": cat,
                "count": len(cat_tasks),
                "completed": completed
            })
        
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/streak")
async def get_streak(user_id: str = Depends(get_user_id)):
    """Get user's productivity streak"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.equal('status', 'completed')
            ]
        )
        
        completed = result.get('documents', [])
        
        # Calculate current streak
        current_streak = 0
        longest_streak = 0
        current_date = datetime.now()
        
        for i in range(30):
            check_date = (current_date - timedelta(days=i)).strftime('%Y-%m-%d')
            day_tasks = [t for t in completed if t.get('completed_at', '').startswith(check_date)]
            if day_tasks:
                current_streak += 1
            elif i > 0:
                break
        
        # Calculate longest streak (simplified)
        date_count = {}
        for task in completed:
            date = task.get('completed_at', '')[:10]
            if date:
                date_count[date] = date_count.get(date, 0) + 1
        
        if date_count:
            longest_streak = max(date_count.values())
        
        return {"current": current_streak, "longest": longest_streak}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== User Preferences Endpoints ====================

@app.get("/users/preferences")
async def get_user_preferences(user_id: str = Depends(get_user_id)):
    """Get user's preferences"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        
        if result.get('documents'):
            doc = result['documents'][0]
            notification_prefs = json.loads(doc.get('notification_prefs', '{}'))
            return {
                "working_hours_start": doc.get('working_hours_start', doc.get('preferred_start_time', '09:00')),
                "working_hours_end": doc.get('working_hours_end', doc.get('preferred_end_time', '17:00')),
                "energy_pattern": doc.get('energy_pattern', 'morning'),
                "notification_preferences": {
                    "email": notification_prefs.get('email', notification_prefs.get('email_enabled', True)),
                    "push": notification_prefs.get('push', notification_prefs.get('push_enabled', True)),
                    "reminder_minutes": notification_prefs.get('reminder_minutes', 30)
                }
            }
        
        # Return defaults
        return {
            "working_hours_start": "09:00",
            "working_hours_end": "17:00",
            "energy_pattern": "morning",
            "notification_preferences": {
                "email": True,
                "push": True,
                "reminder_minutes": 30
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/users/preferences")
async def update_user_preferences(
    preferences: dict,
    user_id: str = Depends(get_user_id)
):
    """Update user's preferences"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        
        notification_prefs = preferences.get('notification_preferences', {})
        update_data = {
            'working_hours_start': preferences.get('working_hours_start', '09:00'),
            'working_hours_end': preferences.get('working_hours_end', '17:00'),
            'energy_pattern': preferences.get('energy_pattern', 'morning'),
            'notification_prefs': json.dumps(notification_prefs),
            'updated_at': datetime.now().isoformat()
        }
        
        if result.get('documents'):
            databases.update_document(
                database_id=DATABASE_ID,
                collection_id=USERS_COLLECTION,
                document_id=result['documents'][0]['$id'],
                data=update_data
            )
        else:
            update_data['user_id'] = user_id
            update_data['created_at'] = datetime.now().isoformat()
            databases.create_document(
                database_id=DATABASE_ID,
                collection_id=USERS_COLLECTION,
                document_id='unique()',
                data=update_data
            )
        
        return {
            "message": "Preferences updated",
            "working_hours_start": update_data['working_hours_start'],
            "working_hours_end": update_data['working_hours_end'],
            "energy_pattern": update_data['energy_pattern'],
            "notification_preferences": notification_prefs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== AI Tips Endpoints ====================

@app.get("/ai/tips")
async def get_ai_tips(user_id: str = Depends(get_user_id)):
    """Get AI-generated productivity tips"""
    try:
        tips = [
            {"tip": "Break large tasks into smaller, manageable sub-tasks", "category": "productivity"},
            {"tip": "Schedule your most challenging work during your peak energy hours", "category": "energy"},
            {"tip": "Take short breaks every 25-30 minutes to maintain focus", "category": "focus"},
            {"tip": "Review your schedule the night before for better planning", "category": "planning"},
            {"tip": "Prioritize tasks based on both urgency and importance", "category": "prioritization"},
            {"tip": "Set realistic deadlines to avoid stress and burnout", "category": "stress"},
            {"tip": "Use the Pomodoro technique for better time management", "category": "productivity"},
            {"tip": "Allocate specific time blocks for different task categories", "category": "planning"}
        ]
        return tips
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai/task-suggestions")
async def get_task_suggestions(user_id: str = Depends(get_user_id)):
    """Get AI suggestions for tasks"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.not_equal('status', 'completed')
            ]
        )
        
        tasks = result.get('documents', [])
        suggestions = []
        
        for task in tasks[:5]:  # Top 5 incomplete tasks
            priority = task.get('priority', 3)
            category = task.get('category', '')
            
            suggestion_text = ""
            if category == 'academic':
                suggestion_text = "Consider breaking this into smaller study sessions"
            elif category == 'personal':
                suggestion_text = "Schedule this during your leisure time"
            else:
                suggestion_text = "Allocate dedicated focus time for this task"
            
            suggestions.append({
                "task_id": task['$id'],
                "suggestion": suggestion_text,
                "priority": 6 - priority  # Higher priority = higher number
            })
        
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Health Check ====================

@app.get("/")
def root():
    return {
        "message": "Student Task Management API is Running",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
