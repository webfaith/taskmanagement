"""
Student Task Management System - FastAPI Backend
Comprehensive API for task management, scheduling, and notifications
"""
from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Tuple

from datetime import datetime, timedelta
from enum import Enum
from urllib import parse, request as urlrequest
from urllib.error import HTTPError, URLError
from copy import deepcopy
import json
import os
from uuid import uuid4
from dotenv import load_dotenv
import google.generativeai as genai

APPWRITE_AVAILABLE = True
try:
    from appwrite.client import Client
    from appwrite.query import Query
    from appwrite.id import ID
    from appwrite.services.tables_db import TablesDB
    from appwrite.exception import AppwriteException
except ImportError:
    APPWRITE_AVAILABLE = False
    class AppwriteException(Exception): pass

    class Client:  # type: ignore[no-redef]
        def set_endpoint(self, *_args, **_kwargs):
            return self

        def set_project(self, *_args, **_kwargs):
            return self

        def set_key(self, *_args, **_kwargs):
            return self

    class ID:  # type: ignore[no-redef]
        @staticmethod
        def unique():
            return str(uuid4())

    class Query:  # type: ignore[no-redef]
        @staticmethod
        def equal(field: str, value: Any):
            return ("equal", field, value)

        @staticmethod
        def not_equal(field: str, value: Any):
            return ("not_equal", field, value)

        @staticmethod
        def greater_than_equal(field: str, value: Any):
            return ("gte", field, value)

        @staticmethod
        def less_than_equal(field: str, value: Any):
            return ("lte", field, value)

        @staticmethod
        def order_desc(field: str):
            return ("order_desc", field)

        @staticmethod
        def limit(value: int):
            return ("limit", value)


DEMO_MODE = not APPWRITE_AVAILABLE


def _is_datetime_string(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return True
    except Exception:
        return False


def _normalize_query_value(value: Any) -> Any:
    if isinstance(value, str):
        if _is_datetime_string(value):
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        try:
            return json.loads(value)
        except Exception:
            return value
    return value


class FakeTablesDB:
    def __init__(self):
        self._tables: Dict[str, Dict[str, Dict[str, Any]]] = {}

    def _table(self, table_id: str) -> Dict[str, Dict[str, Any]]:
        return self._tables.setdefault(table_id, {})

    def _wrap(self, document_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now().isoformat()
        document = {"$id": document_id, "$createdAt": now, "$updatedAt": now}
        document.update(deepcopy(data))
        return document

    def _coerce_rows(self, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [deepcopy(row) for row in rows]

    def _matches(self, document: Dict[str, Any], query: Any) -> bool:
        if not isinstance(query, tuple) or not query:
            return True

        op = query[0]
        if op == "equal":
            _, field, value = query
            return _normalize_query_value(document.get(field)) == _normalize_query_value(value)
        if op == "not_equal":
            _, field, value = query
            return _normalize_query_value(document.get(field)) != _normalize_query_value(value)
        if op == "gte":
            _, field, value = query
            left = _normalize_query_value(document.get(field))
            right = _normalize_query_value(value)
            try:
                return left >= right
            except Exception:
                return str(left) >= str(right)
        if op == "lte":
            _, field, value = query
            left = _normalize_query_value(document.get(field))
            right = _normalize_query_value(value)
            try:
                return left <= right
            except Exception:
                return str(left) <= str(right)
        return True

    def _seed_demo_data(self, user_id: str):
        if self._table(USERS_COLLECTION):
            existing_users = self._table(USERS_COLLECTION)
            if any(doc.get("user_id") == user_id for doc in existing_users.values()):
                return
        now = datetime.now().isoformat()
        self.create_row(
            table_id=USERS_COLLECTION,
            row_id=f"{user_id}-profile",
            data={
                "user_id": user_id,
                "email": f"{user_id}@example.com" if "@" not in user_id else user_id,
                "display_name": user_id.replace(".", " ").title() if "@" not in user_id else user_id.split("@")[0].title(),
                "timezone": "Africa/Lagos",
                "schedule_preferences": json.dumps({
                    "working_hours_start": "08:00",
                    "working_hours_end": "18:00",
                    "energy_pattern": "morning",
                }),
                "notification_prefs": json.dumps({"email": True, "push": True, "reminder_minutes": 30}),
                "created_at": now,
                "updated_at": now,
            },
        )
        demo_tasks = [
            {
                "$id": f"{user_id}-task-1",
                "title": "Complete Math Assignment",
                "description": "Finish algebra problem set",
                "user_id": user_id,
                "userId": user_id,
                "category": "academic",
                "priority": 1,
                "deadline": (datetime.now() + timedelta(days=1)).isoformat(),
                "dueDate": (datetime.now() + timedelta(days=1)).isoformat(),
                "estimated_hours": 2,
                "actual_hours": 0.0,
                "energy_level": "high",
                "status": "in_progress",
                "scheduled_start": None,
                "scheduled_end": None,
                "completed_at": None,
                "tags": json.dumps(["math", "algebra"]),
                "is_recurring": False,
                "recurring_rule": None,
                "created_at": (datetime.now() - timedelta(days=2)).isoformat(),
                "updated_at": now,
            },
            {
                "$id": f"{user_id}-task-2",
                "title": "Review project notes",
                "description": "Summarize key meeting points",
                "user_id": user_id,
                "userId": user_id,
                "category": "work",
                "priority": 2,
                "deadline": (datetime.now() + timedelta(days=2)).isoformat(),
                "dueDate": (datetime.now() + timedelta(days=2)).isoformat(),
                "estimated_hours": 1.5,
                "actual_hours": 0.0,
                "energy_level": "medium",
                "status": "todo",
                "scheduled_start": None,
                "scheduled_end": None,
                "completed_at": None,
                "tags": json.dumps(["review", "notes"]),
                "is_recurring": False,
                "recurring_rule": None,
                "created_at": (datetime.now() - timedelta(days=1)).isoformat(),
                "updated_at": now,
            },
            {
                "$id": f"{user_id}-task-3",
                "title": "Plan weekend study block",
                "description": "Set up a focused study session",
                "user_id": user_id,
                "userId": user_id,
                "category": "personal",
                "priority": 3,
                "deadline": (datetime.now() + timedelta(days=4)).isoformat(),
                "dueDate": (datetime.now() + timedelta(days=4)).isoformat(),
                "estimated_hours": 1,
                "actual_hours": 0.0,
                "energy_level": "low",
                "status": "completed",
                "scheduled_start": None,
                "scheduled_end": None,
                "completed_at": (datetime.now() - timedelta(days=1)).isoformat(),
                "tags": json.dumps(["planning"]),
                "is_recurring": False,
                "recurring_rule": None,
                "created_at": (datetime.now() - timedelta(days=4)).isoformat(),
                "updated_at": now,
            },
        ]
        for task in demo_tasks:
            self.create_row(TASKS_COLLECTION, task["$id"], {k: v for k, v in task.items() if k != "$id"})

        notifications = [
            {
                "user_id": user_id,
                "type": "deadline",
                "title": "Math assignment due tomorrow",
                "message": "Your algebra assignment is coming up soon.",
                "task_id": f"{user_id}-task-1",
                "scheduled_for": (datetime.now() + timedelta(days=1)).isoformat(),
                "is_read": False,
                "channel": "in_app",
                "created_at": (datetime.now() - timedelta(days=1)).isoformat(),
            },
            {
                "user_id": user_id,
                "type": "reminder",
                "title": "Time to review your tasks",
                "message": "A short review session can help you stay on track.",
                "task_id": None,
                "scheduled_for": (datetime.now() - timedelta(days=3)).isoformat(),
                "is_read": True,
                "channel": "in_app",
                "created_at": (datetime.now() - timedelta(days=3)).isoformat(),
            },
        ]
        for index, notification in enumerate(notifications, start=1):
            self.create_row(NOTIFICATIONS_COLLECTION, f"{user_id}-notification-{index}", notification)

        self.create_row(
            SCHEDULES_COLLECTION,
            f"{user_id}-schedule-{datetime.now().date().isoformat()}",
            {
                "user_id": user_id,
                "date": datetime.now().date().isoformat(),
                "free_slots": json.dumps([
                    {"start": "09:00", "end": "10:30"},
                    {"start": "14:00", "end": "16:00"},
                ]),
                "commitments": json.dumps([
                    {"start": "11:00", "end": "12:00", "title": "Class"},
                ]),
                "working_hours": json.dumps({"start": "08:00", "end": "18:00"}),
                "created_at": now,
                "updated_at": now,
            },
        )

        self.create_row(
            GROUPS_COLLECTION,
            f"{user_id}-group-1",
            {
                "name": "Study Buddies",
                "description": "Shared study group for coursework and exams.",
                "owner_id": user_id,
                "member_ids": json.dumps([user_id, "member-1", "member-2"]),
                "settings": json.dumps({}),
                "is_active": True,
                "created_at": (datetime.now() - timedelta(days=7)).isoformat(),
                "updated_at": (datetime.now() - timedelta(days=1)).isoformat(),
            },
        )
        self.create_row(
            GROUPS_COLLECTION,
            f"{user_id}-group-2",
            {
                "name": "Project Team",
                "description": "Coordinate group assignments and reviews.",
                "owner_id": user_id,
                "member_ids": json.dumps([user_id, "member-3"]),
                "settings": json.dumps({}),
                "is_active": True,
                "created_at": (datetime.now() - timedelta(days=10)).isoformat(),
                "updated_at": (datetime.now() - timedelta(days=2)).isoformat(),
            },
        )
        self.create_row(
            GROUP_TASKS_COLLECTION,
            f"{user_id}-group-task-1",
            {
                "group_id": f"{user_id}-group-1",
                "task_id": f"{user_id}-task-1",
                "assigned_to": json.dumps(["member-1"]),
                "milestone": json.dumps({"name": "First draft"}),
                "progress": 45,
                "created_at": (datetime.now() - timedelta(days=2)).isoformat(),
                "updated_at": (datetime.now() - timedelta(days=1)).isoformat(),
            },
        )

    def create_row(self, table_id: str, row_id: str, data: Dict[str, Any]):
        document = self._wrap(row_id, data)
        self._table(table_id)[row_id] = document
        return deepcopy(document)

    def list_rows(self, table_id: str, queries: Optional[List[Any]] = None):
        rows = list(self._table(table_id).values())
        user_id = None
        for query in queries or []:
            if isinstance(query, tuple) and len(query) >= 3 and query[0] == "equal" and query[1] == "user_id":
                user_id = query[2]
                break

        if DEMO_MODE and not rows:
            self._seed_demo_data(user_id or "demo-user")
            rows = list(self._table(table_id).values())

        filtered = rows
        order_field = None
        order_desc = False
        limit = None

        for query in queries or []:
            if not isinstance(query, tuple) or not query:
                continue
            op = query[0]
            if op == "order_desc" and len(query) >= 2:
                order_field = query[1]
                order_desc = True
                continue
            if op == "limit" and len(query) >= 2:
                limit = int(query[1])
                continue
            filtered = [row for row in filtered if self._matches(row, query)]

        if order_field:
            filtered = sorted(filtered, key=lambda row: row.get(order_field) or "", reverse=order_desc)
        if limit is not None:
            filtered = filtered[:limit]
        return {"documents": self._coerce_rows(filtered)}

    def get_row(self, table_id: str, row_id: str):
        table = self._table(table_id)
        if row_id not in table:
            raise Exception("Document not found")
        return deepcopy(table[row_id])

    def update_row(self, table_id: str, row_id: str, data: Dict[str, Any]):
        table = self._table(table_id)
        if row_id not in table:
            raise Exception("Document not found")
        table[row_id].update(deepcopy(data))
        table[row_id]["$updatedAt"] = datetime.now().isoformat()
        return deepcopy(table[row_id])

    def delete_row(self, table_id: str, row_id: str):
        table = self._table(table_id)
        if row_id not in table:
            raise Exception("Document not found")
        del table[row_id]
        return {}

    def list_tables(self, *_args, **_kwargs):
        return {"tables": []}

    def create_table(self, *_args, **_kwargs):
        return {}

    def delete_table(self, *_args, **_kwargs):
        return {}

    def get_table(self, *_args, **_kwargs):
        return {}

# Load environment variables from the same directory as this file
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

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

class DatabasesWrapper:
    """
    Adapter to map old Databases service calls to the new TablesDB service.
    Falls back to the in-memory fake database when Appwrite is unavailable.
    """

    def __init__(self, service):
        self.service = service
        self.mapping = {
            'create_document': 'create_row',
            'list_documents': 'list_rows',
            'get_document': 'get_row',
            'update_document': 'update_row',
            'delete_document': 'delete_row',
            'list_collections': 'list_tables',
            'create_collection': 'create_table',
            'delete_collection': 'delete_table',
            'get_collection': 'get_table',
        }

    def __getattr__(self, name):
        mapped_name = self.mapping.get(name, name)
        attr = getattr(self.service, mapped_name, None)

        if attr is None:
            raise AttributeError(f"'{type(self.service).__name__}' object has no attribute '{mapped_name}'")

        if callable(attr):
            import inspect as _inspect
            _sig = _inspect.signature(attr)

            def wrapper(*args, **kwargs):
                if 'collection_id' in kwargs:
                    kwargs['table_id'] = kwargs.pop('collection_id')
                if 'document_id' in kwargs:
                    kwargs['row_id'] = kwargs.pop('document_id')

                if 'database_id' in kwargs and ('database_id' not in _sig.parameters or not APPWRITE_AVAILABLE):
                    kwargs.pop('database_id')
                if APPWRITE_AVAILABLE and 'database_id' in _sig.parameters and 'database_id' not in kwargs:
                    kwargs['database_id'] = DATABASE_ID

                import time
                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        result = attr(*args, **kwargs)
                        break
                    except KeyError as e:
                        if str(e) == "'content-type'":
                            if attempt < max_retries - 1:
                                time.sleep(1)
                                continue
                            raise Exception("Appwrite connection failed: rate limit or network error.")
                        raise
                    except Exception as e:
                        # Catch AppwriteException (like 429) and retry
                        if attempt < max_retries - 1:
                            time.sleep(1)
                            continue
                        raise

                if hasattr(result, 'rows'):
                    d = {'total': getattr(result, 'total', 0), 'documents': []}
                    for row in getattr(result, 'rows', []):
                        row_dict = row.to_dict() if hasattr(row, 'to_dict') else row.model_dump()
                        if 'data' in row_dict and isinstance(row_dict['data'], dict):
                            row_dict.update(row_dict.pop('data'))
                        d['documents'].append(row_dict)
                    return d
                elif hasattr(result, 'documents'):
                    d = {'total': getattr(result, 'total', 0), 'documents': []}
                    for doc in getattr(result, 'documents', []):
                        doc_dict = doc.to_dict() if hasattr(doc, 'to_dict') else doc.model_dump()
                        if 'data' in doc_dict and isinstance(doc_dict['data'], dict):
                            doc_dict.update(doc_dict.pop('data'))
                        d['documents'].append(doc_dict)
                    return d
                elif hasattr(result, 'to_dict'):
                    d = result.to_dict()
                    if 'data' in d and isinstance(d['data'], dict):
                        d.update(d.pop('data'))
                    return d
                return result

            return wrapper
        return attr
        return attr


# Appwrite Client Setup
client = Client()
client.set_endpoint(os.getenv('APPWRITE_ENDPOINT', 'https://fra.cloud.appwrite.io/v1'))
client.set_project(os.getenv('APPWRITE_PROJECT_ID', ''))
client.set_key(os.getenv('APPWRITE_API_KEY', ''))

tables_db_raw = FakeTablesDB() if not APPWRITE_AVAILABLE else TablesDB(client)
databases = DatabasesWrapper(tables_db_raw)

DATABASE_ID = os.getenv('APPWRITE_DATABASE_ID', 'scheduler_db')

# Collection IDs
USERS_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_USERS', 'users_collection')
TASKS_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_TASKS', 'tasks_collection')
SCHEDULES_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_SCHEDULES', 'schedules_collection')
NOTIFICATIONS_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_NOTIFICATIONS', 'notifications_collection')
ANALYTICS_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_ANALYTICS', 'analytics_collection')
GROUPS_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_GROUPS', 'groups_collection')
GROUP_TASKS_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_GROUP_TASKS', 'group_tasks_collection')

GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')
GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI', '')
GOOGLE_OAUTH_SCOPE = "https://www.googleapis.com/auth/calendar.events"

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


@app.middleware("http")
async def add_demo_mode_header(request: Request, call_next):
    response = await call_next(request)
    if DEMO_MODE:
        response.headers["X-Demo-Mode"] = "true"
    return response


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
    deadline: Optional[datetime] = None
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
    priority_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

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


class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    member_ids: List[str] = []
    settings: Dict[str, Any] = {}


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    member_ids: Optional[List[str]] = None
    settings: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class GroupMemberRequest(BaseModel):
    user_id: str


class GroupTaskCreate(BaseModel):
    task_id: str
    assigned_to: List[str] = []
    milestone: Dict[str, Any] = {}
    progress: float = 0.0


class GroupMessageCreate(BaseModel):
    message: str


class UserProfileSync(BaseModel):
    email: str
    display_name: Optional[str] = None


class GoogleCalendarCallback(BaseModel):
    code: str
    redirect_uri: Optional[str] = None


class GoogleCalendarSyncRequest(BaseModel):
    date: Optional[str] = None


# ==================== Helper Functions ====================

def make_naive(dt: Any) -> datetime:
    """Ensure a datetime is naive for safe subtraction"""
    if dt is None:
        return datetime.now()
    if isinstance(dt, str):
        try:
            # Handle 'Z', +00:00, etc.
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except Exception:
            try:
                # Fallback: strip any timezone string suffix or take first 19 chars
                dt = datetime.fromisoformat(dt[:19])
            except Exception:
                return datetime.now()
    
    if hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt


def get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    """Extract user_id from header - in production, this would validate JWT tokens"""
    if not x_user_id:
        if DEMO_MODE:
            return "demo-user"
        raise HTTPException(status_code=401, detail="User ID required in header")
    return x_user_id


def _parse_json_field(value: Any, default: Any):
    if value is None:
        return default
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return default
    return default


def _safe_datetime(value: Any) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except Exception:
            try:
                return datetime.fromisoformat(value[:19])
            except Exception:
                return None
    return None


def _google_auth_url(redirect_uri: Optional[str] = None, state: Optional[str] = None) -> str:
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=400, detail="Google Calendar is not configured")
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri or GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "access_type": "offline",
        "prompt": "consent",
        "scope": GOOGLE_OAUTH_SCOPE,
    }
    if state:
        params["state"] = state
    return f"https://accounts.google.com/o/oauth2/v2/auth?{parse.urlencode(params)}"


def _google_token_request(data: Dict[str, str]) -> Dict[str, Any]:
    body = parse.urlencode(data).encode("utf-8")
    req = urlrequest.Request(
        "https://oauth2.googleapis.com/token",
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urlrequest.urlopen(req, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as err:
        detail = err.read().decode("utf-8", errors="ignore")
        raise HTTPException(status_code=400, detail=f"Google token exchange failed: {detail}")
    except URLError as err:
        raise HTTPException(status_code=502, detail=f"Google token exchange unavailable: {err.reason}")


def _google_api_request(url: str, method: str = "GET", token: Optional[str] = None, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(payload).encode("utf-8")
    req = urlrequest.Request(url, data=data, headers=headers, method=method)
    try:
        with urlrequest.urlopen(req, timeout=20) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except HTTPError as err:
        detail = err.read().decode("utf-8", errors="ignore")
        raise HTTPException(status_code=400, detail=f"Google API request failed: {detail}")
    except URLError as err:
        raise HTTPException(status_code=502, detail=f"Google API request unavailable: {err.reason}")


def _refresh_google_token_if_needed(user_doc: Dict[str, Any]) -> Optional[str]:
    token_data = _parse_json_field(user_doc.get("google_calendar_token"), {})
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    expires_at = _safe_datetime(token_data.get("expires_at"))

    if not access_token:
        return None

    if expires_at and expires_at > datetime.now() + timedelta(minutes=2):
        return access_token

    if not refresh_token or not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return access_token

    refreshed = _google_token_request({
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    })
    new_access = refreshed.get("access_token")
    if not new_access:
        return access_token

    token_data["access_token"] = new_access
    token_data["expires_in"] = refreshed.get("expires_in")
    token_data["expires_at"] = (datetime.now() + timedelta(seconds=int(refreshed.get("expires_in", 3600)))).isoformat()
    if refreshed.get("refresh_token"):
        token_data["refresh_token"] = refreshed["refresh_token"]

    try:
        databases.update_document(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            document_id=user_doc["$id"],
            data={
                "google_calendar_token": json.dumps(token_data),
                "updated_at": datetime.now().isoformat()
            }
        )
    except Exception:
        pass

    return new_access


def _parse_group_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": doc.get("$id"),
        "name": doc.get("name", ""),
        "description": doc.get("description"),
        "owner_id": doc.get("owner_id"),
        "member_ids": _parse_json_field(doc.get("member_ids"), []),
        "settings": _parse_json_field(doc.get("settings"), {}),
        "is_active": doc.get("is_active", True),
        "created_at": doc.get("created_at") or doc.get("$createdAt"),
        "updated_at": doc.get("updated_at") or doc.get("$updatedAt"),
    }


def _parse_group_task_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": doc.get("$id"),
        "group_id": doc.get("group_id"),
        "task_id": doc.get("task_id"),
        "assigned_to": _parse_json_field(doc.get("assigned_to"), []),
        "milestone": _parse_json_field(doc.get("milestone"), {}),
        "progress": doc.get("progress", 0.0),
        "created_at": doc.get("created_at") or doc.get("$createdAt"),
        "updated_at": doc.get("updated_at") or doc.get("$updatedAt"),
    }


def _get_group_accessible_doc(group_id: str, user_id: str) -> Dict[str, Any]:
    group = databases.get_document(
        database_id=DATABASE_ID,
        collection_id=GROUPS_COLLECTION,
        document_id=group_id
    )
    members = _parse_json_field(group.get("member_ids"), [])
    if group.get("owner_id") != user_id and user_id not in members:
        raise HTTPException(status_code=403, detail="Access denied")
    return group


def calculate_priority(deadline: datetime, estimated_hours: float, category: str) -> Tuple[int, str]:
    """
    AI Rule-Based Priority Assignment
    Returns (priority, reason) where priority is 1 (Critical) to 5 (Very Low)
    """
    now = datetime.now()
    deadline = make_naive(deadline)
    hours_until_deadline = (deadline - now).total_seconds() / 3600

    reasons = []

    # Base priority from deadline urgency
    if hours_until_deadline <= 0:
        base_priority = 1
        reasons.append("Task is overdue")
    elif hours_until_deadline <= 24:
        base_priority = 1
        reasons.append("Due in less than 24 hours")
    elif hours_until_deadline <= 72:
        base_priority = 2
        reasons.append("Due within 3 days")
    elif hours_until_deadline <= 168:
        base_priority = 3
        reasons.append("Due within a week")
    elif hours_until_deadline <= 336:
        base_priority = 4
        reasons.append("Due within 14 days")
    else:
        base_priority = 5
        reasons.append("Long-term deadline")

    # Effort modifier: heavy tasks get bumped up by 1 level
    if estimated_hours > 5 and base_priority > 1:
        base_priority -= 1
        reasons.append(f"High effort ({estimated_hours}h) requires early start")

    # Category weight modifier
    if category == "academic":
        base_priority = max(1, base_priority - 1)
        reasons.append("Academic tasks prioritized for school success")
    elif category == "work":
        # work stays same
        pass
    else:
        base_priority = min(5, base_priority + 1)
        reasons.append("Personal/Low-impact category")

    final_priority = max(1, min(5, base_priority))
    reason_str = ". ".join(reasons) + "."
    
    return final_priority, reason_str

def document_to_task(doc: Dict) -> Dict:
    """Convert Appwrite document to TaskResponse format"""
    tags = []
    if doc.get('tags'):
        try:
            tags = json.loads(doc['tags']) if isinstance(doc['tags'], str) else doc['tags']
        except:
            tags = []
    
    # Re-calculate priority reason live
    deadline_val = doc.get('deadline') or doc.get('dueDate')
    priority_reason = "Manual override"
    if deadline_val:
        try:
            dl_dt = datetime.fromisoformat(deadline_val.replace('Z', '+00:00'))
            _, priority_reason = calculate_priority(dl_dt, doc.get('estimated_hours', 1), doc.get('category', 'personal'))
        except:
            pass

    priority_val = doc.get('priority')
    if priority_val is None:
        priority_val = 3

    return {
        'id': doc.get('$id', ''),
        'title': doc.get('title') or '',
        'description': doc.get('description'),
        'category': doc.get('category') or '',
        'priority': int(priority_val),
        'deadline': deadline_val,
        'estimated_hours': doc.get('estimated_hours') or 0,
        'actual_hours': doc.get('actual_hours'),
        'energy_level': doc.get('energy_level') or 'medium',
        'status': doc.get('status') or 'todo',
        'scheduled_start': doc.get('scheduled_start'),
        'scheduled_end': doc.get('scheduled_end'),
        'completed_at': doc.get('completed_at'),
        'tags': tags,
        'is_recurring': doc.get('is_recurring', False),
        'recurring_rule': doc.get('recurring_rule'),
        'priority_reason': priority_reason,
        'created_at': doc.get('created_at') or doc.get('$createdAt'),
        'updated_at': doc.get('updated_at') or doc.get('$updatedAt'),
    }


# ==================== Task Endpoints ====================

@app.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreate, user_id: str = Depends(get_user_id)):
    """Create a new task — AI auto-assigns priority based on deadline, effort, and category"""
    now = datetime.now().isoformat()

    # AI: Override user-supplied priority with computed priority
    ai_priority, _ = calculate_priority(task.deadline, task.estimated_hours, task.category.value)

    document = {
        'title': task.title,
        'description': task.description,
        'user_id': user_id,
        'userId': user_id,
        'category': task.category.value,
        'priority': int(ai_priority),
        'deadline': task.deadline.isoformat(),
        'dueDate': task.deadline.isoformat(),
        'estimated_hours': task.estimated_hours,
        'actual_hours': 0.0,
        'energy_level': task.energy_level.value,
        'status': 'todo',
        'tags': json.dumps(task.tags),
        'is_recurring': task.is_recurring,
        'recurring_rule': task.recurring_rule,
        'created_at': now,
        'updated_at': now,
    }

    try:
        # DEBUG: show payload being written to DB
        try:
            print("DEBUG create_document payload:", json.dumps(document, default=str))
        except Exception:
            print("DEBUG create_document payload: <unserializable>")

        result = databases.create_document(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            document_id=ID.unique(),
            data=document
        )
        # DEBUG: show raw result from DB
        try:
            print("DEBUG create_document result:", result)
        except Exception:
            print("DEBUG create_document result: <unprintable>")

        # Determine notification type based on urgency
        hours_left = (make_naive(task.deadline) - datetime.now()).total_seconds() / 3600
        notif_type = 'deadline' if hours_left <= 24 else 'reminder'
        notif_title = f"⚠️ Due Soon: {task.title}" if hours_left <= 24 else f"📋 Task Created: {task.title}"
        notif_msg = (f"URGENT: '{task.title}' is due in less than 24 hours!"
                     if hours_left <= 24
                     else f"Task '{task.title}' created. Due: {task.deadline.strftime('%Y-%m-%d %H:%M')}. AI Priority: {ai_priority}/5")

        notification_data = {
            'user_id': user_id,
            'type': notif_type,
            'title': notif_title,
            'message': notif_msg,
            'task_id': result['$id'],
            'scheduled_for': task.deadline.isoformat(),
            'is_read': False,
            'channel': 'in_app',
            'created_at': now,
        }
        try:
            databases.create_document(
                database_id=DATABASE_ID,
                collection_id=NOTIFICATIONS_COLLECTION,
                document_id=ID.unique(),
                data=notification_data
            )
        except Exception:
            pass  # Don't fail task creation if notification fails

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


@app.get("/tasks/prioritized", response_model=List[TaskResponse])
async def get_prioritized_tasks(user_id: str = Depends(get_user_id)):
    """
    Returns all incomplete tasks sorted by AI-computed priority score.
    Also recalculates and updates priority for any task where it may be stale.
    """
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.not_equal('status', 'completed'),
                Query.limit(100)
            ]
        )

        tasks = []
        for doc in result.get('documents', []):
            # Recalculate priority based on current time
            try:
                deadline = datetime.fromisoformat(doc['deadline'].replace('Z', ''))
                fresh_priority, _ = calculate_priority(
                    deadline,
                    doc.get('estimated_hours', 1),
                    doc.get('category', 'personal')
                )
                # Update in DB if priority changed
                if fresh_priority != doc.get('priority'):
                    databases.update_document(
                        database_id=DATABASE_ID,
                        collection_id=TASKS_COLLECTION,
                        document_id=doc['$id'],
                        data={'priority': fresh_priority, 'updated_at': datetime.now().isoformat()}
                    )
                    doc['priority'] = fresh_priority
            except Exception:
                pass
            tasks.append(document_to_task(doc))

        # Sort by priority ascending (1=most urgent)
        tasks.sort(key=lambda t: (t['priority'], t['deadline']))
        return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
                val = value.value if hasattr(value, 'value') else value
                update_data[field] = str(val)
            elif field == 'energy_level':
                update_data[field] = value.value if hasattr(value, 'value') else value
            elif field == 'status':
                update_data[field] = value.value if hasattr(value, 'value') else value
            elif field == 'tags':
                update_data[field] = json.dumps(value)
            elif isinstance(value, datetime):
                iso_val = value.isoformat()
                update_data[field] = iso_val
                if field == 'deadline':
                    update_data['dueDate'] = iso_val
            else:
                update_data[field] = value
        
        # AI: Recalculate priority if key fields changed
        if 'deadline' in update_data or 'category' in update_data or 'estimated_hours' in update_data:
            dl_str = existing.get('deadline') or existing.get('dueDate')
            dl_dt = task_update.deadline or datetime.fromisoformat(dl_str.replace('Z', ''))
            cat = task_update.category.value if task_update.category else existing.get('category', 'personal')
            est = task_update.estimated_hours if task_update.estimated_hours is not None else existing.get('estimated_hours', 1)
            ai_priority, _ = calculate_priority(dl_dt, est, cat)
            update_data['priority'] = int(ai_priority)
        
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
        
        # Hydrate missing required fields to bypass Appwrite schema validation
        if 'priority' not in update_data and existing.get('priority') is None:
            update_data['priority'] = 3
        if 'category' not in update_data and not existing.get('category'):
            update_data['category'] = 'personal'
        if 'estimated_hours' not in update_data and existing.get('estimated_hours') is None:
            update_data['estimated_hours'] = 1.0

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
    """Set user's schedule preferences inside schedule_preferences JSON"""
    try:
        now = datetime.now().isoformat()
        prefs_data: Dict[str, Any] = {
            'preferred_start_time': prefs.preferred_start_time,
            'preferred_end_time': prefs.preferred_end_time,
            'working_hours_start': prefs.preferred_start_time,
            'working_hours_end': prefs.preferred_end_time,
            'study_slots': json.dumps(prefs.study_slots),
            'sleep_schedule': json.dumps(prefs.sleep_schedule),
            'updated_at': now,
        }
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        if result.get('documents'):
            existing = result['documents'][0]
            merged = {**_parse_json_field(existing.get('schedule_preferences'), {}),
                      **{k: v for k, v in prefs_data.items() if k != 'updated_at'}}
            databases.update_document(
                database_id=DATABASE_ID,
                collection_id=USERS_COLLECTION,
                document_id=existing['$id'],
                data={
                    'schedule_preferences': json.dumps(merged),
                    'updated_at': now,
                },
            )
        else:
            databases.create_document(
                database_id=DATABASE_ID,
                collection_id=USERS_COLLECTION,
                document_id=ID.unique(),
                data={
                    'user_id': user_id,
                    'schedule_preferences': json.dumps({k: v for k, v in prefs_data.items() if k != 'updated_at'}),
                    'created_at': now,
                    'updated_at': now,
                },
            )
        return {"message": "Preferences updated successfully", "preferences": prefs_data}
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
                document_id=ID.unique(),
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
                document_id=ID.unique(),
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
                Query.not_equal('status', 'completed')
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
                # Update task in database, hydrating missing required fields
                update_payload = {
                    'scheduled_start': allocated['scheduled_start'],
                    'scheduled_end': allocated['scheduled_end'],
                    'updated_at': datetime.now().isoformat()
                }
                if task.get('priority') is None:
                    update_payload['priority'] = 3
                if not task.get('category'):
                    update_payload['category'] = 'personal'
                if task.get('estimated_hours') is None:
                    update_payload['estimated_hours'] = 1.0

                databases.update_document(
                    database_id=DATABASE_ID,
                    collection_id=TASKS_COLLECTION,
                    document_id=task['id'],
                    data=update_payload
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
    deadline = make_naive(task.get('deadline'))
    current_now = make_naive(now)
    hours_until_deadline = max(0, (deadline - current_now).total_seconds() / 3600)
    
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
        schedule_result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=SCHEDULES_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.equal('date', date)
            ]
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
                Query.equal('is_read', False),
                Query.limit(100)
            ]
        )
        count = 0
        for doc in result.get('documents', []):
            databases.update_document(
                database_id=DATABASE_ID,
                collection_id=NOTIFICATIONS_COLLECTION,
                document_id=doc['$id'],
                data={'is_read': True}
            )
            count += 1
        return {"message": f"{count} notifications marked as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/notifications/generate-reminders")
async def generate_reminders(user_id: str = Depends(get_user_id)):
    """
    AI Reminder Generator:
    Scans incomplete tasks and creates reminder notifications
    for tasks due within 24 hours that haven't been reminded yet.
    """
    now = datetime.now()
    now_str = now.isoformat()
    reminders_created = 0

    try:
        # Fetch all incomplete tasks for this user
        tasks_result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.not_equal('status', 'completed'),
                Query.limit(100)
            ]
        )

        for task in tasks_result.get('documents', []):
            deadline_str = task.get('deadline', '')
            if not deadline_str:
                continue

            deadline = make_naive(deadline_str)
            current_now = make_naive(now)
            hours_left = (deadline - current_now).total_seconds() / 3600

            # Only remind for tasks due in the next 24 hours
            if 0 < hours_left <= 24:
                # Check if a reminder already exists for this task today
                existing = databases.list_documents(
                    database_id=DATABASE_ID,
                    collection_id=NOTIFICATIONS_COLLECTION,
                    queries=[
                        Query.equal('user_id', user_id),
                        Query.equal('task_id', task['$id']),
                        Query.equal('type', 'reminder'),
                        Query.limit(1)
                    ]
                )
                if existing.get('total', 0) > 0:
                    continue  # Already reminded

                notif_data = {
                    'user_id': user_id,
                    'type': 'reminder',
                    'title': f"⏰ Reminder: {task.get('title', 'Task')} due soon",
                    'message': f"'{task.get('title')}' is due in {int(hours_left)}h {int((hours_left % 1)*60)}m. Priority: {task.get('priority', 3)}/5",
                    'task_id': task['$id'],
                    'scheduled_for': deadline_str,
                    'is_read': False,
                    'channel': 'in_app',
                    'created_at': now_str,
                }
                databases.create_document(
                    database_id=DATABASE_ID,
                    collection_id=NOTIFICATIONS_COLLECTION,
                    document_id=ID.unique(),
                    data=notif_data
                )
                reminders_created += 1

        return {"reminders_created": reminders_created, "message": f"Generated {reminders_created} new reminders"}
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
            document_id=ID.unique(),
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
            document_id=ID.unique(),
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
        print(f"[SURVEY] Submitting survey for user_id={user_id}")
        print(f"[SURVEY] Answers received: {survey.answers}")
        
        # Validate answers
        if not survey.answers:
            print("[SURVEY] ERROR: No answers provided")
            raise ValueError("Survey answers cannot be empty")
        
        # Prepare document data
        document_data = {
            'user_id': user_id,
            'answers': json.dumps(survey.answers),
            'completed_at': datetime.now().isoformat(),
            'category': 'weekly',
            'score': 0
        }
        print(f"[SURVEY] Document data prepared: {list(document_data.keys())}")
        
        # Create document
        print(f"[SURVEY] Creating document in {SURVEY_COLLECTION} collection")
        print(f"[SURVEY] DATABASE_ID={DATABASE_ID}, SURVEY_COLLECTION={SURVEY_COLLECTION}")
        print(f"[SURVEY] APPWRITE_AVAILABLE={APPWRITE_AVAILABLE}")
        
        result = databases.create_document(
            database_id=DATABASE_ID,
            collection_id=SURVEY_COLLECTION,
            document_id=ID.unique(),
            data=document_data
        )
        
        print(f"[SURVEY] SUCCESS: Survey submitted with id={result.get('$id')}")
        return {"message": "Survey submitted successfully", "id": result['$id']}
    except json.JSONDecodeError as e:
        error_msg = f"JSON serialization error: {str(e)}"
        print(f"[SURVEY] JSON ERROR: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    except ValueError as e:
        error_msg = f"Validation error: {str(e)}"
        print(f"[SURVEY] VALIDATION ERROR: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
        print(f"[SURVEY] CRITICAL ERROR: {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)


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
            document_id=ID.unique(),
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
            document_id=ID.unique(),
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
        elif not docs:
            insights.append("Complete your first tasks to see productivity insights")
        else:
            insights.append("Keep logging your tasks to unlock personalized AI insights")
        
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
        days_completed = {}
        if completed:
            # Analyze best day (simplified)
            insights.append(f"You've completed {len(completed)} tasks so far. Great start!")
            for task in completed:
                date = task.get('completed_at', '')[:10]
                days_completed[date] = days_completed.get(date, 0) + 1
        else:
            insights.append("Add and complete tasks to see your progress here")
        
        # Add a general tip if list is thin
        if len(insights) < 2:
            insights.append("Tip: Use the 'Optimize' button in the schedule view to let AI plan your day")
            
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


# ==================== Missing Endpoints & Preferences ====================

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
                document_id=ID.unique(),
                data=update_data
            )
        return {"message": "Notification preferences updated", "preferences": prefs_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/schedule/optimize/{date}")
async def optimize_schedule_date(date: str, user_id: str = Depends(get_user_id)):
    """Run priority-based scheduling for a specific date"""
    return await optimize_schedule(date, user_id)


@app.get("/schedule/working-hours")
async def get_working_hours(user_id: str = Depends(get_user_id)):
    """Get user's preferred working hours from schedule_preferences JSON"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        if result.get('documents'):
            doc = result['documents'][0]
            prefs = _parse_json_field(doc.get('schedule_preferences'), {})
            return {
                "start": prefs.get('working_hours_start',
                    prefs.get('preferred_start_time', '08:00')),
                "end": prefs.get('working_hours_end',
                    prefs.get('preferred_end_time', '22:00'))
            }
        return {"start": "08:00", "end": "22:00"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/schedule/working-hours")
async def update_working_hours(hours: dict, user_id: str = Depends(get_user_id)):
    """Update user's preferred working hours inside schedule_preferences JSON"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        now = datetime.now().isoformat()
        new_entries = {
            'working_hours_start': hours.get('start', '08:00'),
            'working_hours_end': hours.get('end', '22:00'),
            'preferred_start_time': hours.get('start', '08:00'),
            'preferred_end_time': hours.get('end', '22:00'),
        }
        if result.get('documents'):
            existing = result['documents'][0]
            merged = {**_parse_json_field(existing.get('schedule_preferences'), {}), **new_entries}
            databases.update_document(
                database_id=DATABASE_ID,
                collection_id=USERS_COLLECTION,
                document_id=existing['$id'],
                data={
                    'schedule_preferences': json.dumps(merged),
                    'updated_at': now,
                },
            )
        else:
            databases.create_document(
                database_id=DATABASE_ID,
                collection_id=USERS_COLLECTION,
                document_id=ID.unique(),
                data={
                    'user_id': user_id,
                    'schedule_preferences': json.dumps(new_entries),
                    'created_at': now,
                    'updated_at': now,
                },
            )
        return {"message": "Working hours updated", **new_entries}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/schedule/{date}/commitments")
async def add_commitment_date(date: str, commitment: dict, user_id: str = Depends(get_user_id)):
    """Add a single commitment for a date"""
    commitment_obj = Commitment(
        title=commitment['title'],
        start_time=commitment['start'],
        end_time=commitment['end'],
        category=commitment.get('category', 'other')
    )
    return await add_commitments(date, [commitment_obj], user_id)


@app.delete("/schedule/{date}/commitments/{title}")
async def remove_commitment(date: str, title: str, user_id: str = Depends(get_user_id)):
    """Remove a commitment from a date"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=SCHEDULES_COLLECTION,
            queries=[Query.equal('user_id', user_id), Query.equal('date', date)]
        )
        if result.get('documents'):
            schedule = result['documents'][0]
            commitments = json.loads(schedule.get('commitments', '[]'))
            commitments = [c for c in commitments if c.get('title') != title]
            databases.update_document(
                database_id=DATABASE_ID,
                collection_id=SCHEDULES_COLLECTION,
                document_id=schedule['$id'],
                data={'commitments': json.dumps(commitments), 'updated_at': datetime.now().isoformat()}
            )
        return {"message": "Commitment removed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Analytics Endpoints ====================

@app.get("/analytics/stats")
async def get_analytics_stats(user_id: str = Depends(get_user_id)):
    """Get analytics statistics"""
    try:
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
        today = datetime.now().strftime('%Y-%m-%d')
        today_tasks = [t for t in tasks if t.get('deadline', '').startswith(today)]
        today_completed = len([t for t in today_tasks if t.get('status') == 'completed'])
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
            queries=[Query.equal('user_id', user_id), Query.greater_than_equal('created_at', start_date.isoformat())]
        )
        tasks = result.get('documents', [])
        weekly_data = []
        for i in range(7):
            date = (end_date - timedelta(days=i)).strftime('%Y-%m-%d')
            day_tasks = [t for t in tasks if t.get('created_at', '').startswith(date)]
            completed = len([t for t in day_tasks if t.get('status') == 'completed'])
            created = len(day_tasks)
            weekly_data.append({"date": date, "completed": completed, "created": created})
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
            categories.append({"category": cat, "count": len(cat_tasks), "completed": completed})
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
            queries=[Query.equal('user_id', user_id), Query.equal('status', 'completed')]
        )
        completed = result.get('documents', [])
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
            schedule_prefs = _parse_json_field(doc.get('schedule_preferences'), {})
            notification_prefs = _parse_json_field(doc.get('notification_prefs'), {})
            return {
                "working_hours_start": schedule_prefs.get('working_hours_start',
                    schedule_prefs.get('preferred_start_time',
                        doc.get('preferred_start_time', '09:00'))),
                "working_hours_end": schedule_prefs.get('working_hours_end',
                    schedule_prefs.get('preferred_end_time',
                        doc.get('preferred_end_time', '17:00'))),
                "energy_pattern": schedule_prefs.get('energy_pattern',
                    doc.get('energy_pattern', 'morning')),
                "theme": schedule_prefs.get('theme', doc.get('theme', 'system')),
                "notification_preferences": {
                    "email": notification_prefs.get('email',
                        notification_prefs.get('email_enabled', True)),
                    "push": notification_prefs.get('push',
                        notification_prefs.get('push_enabled', True)),
                    "reminder_minutes": notification_prefs.get('reminder_minutes', 30)
                }
            }
        return {
            "working_hours_start": "09:00", "working_hours_end": "17:00",
            "energy_pattern": "morning", "theme": "system",
            "notification_preferences": {"email": True, "push": True, "reminder_minutes": 30}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users/sync")
async def sync_user_profile(payload: UserProfileSync, user_id: str = Depends(get_user_id)):
    """Ensure the user's profile exists in the users_collection database."""
    try:
        # Check if user exists in collection
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        if result.get("documents"):
            return {"status": "already_exists", "user_id": user_id}
            
        # Create user profile
        data = {
            "user_id": user_id,
            "email": payload.email,
            "display_name": payload.display_name or payload.email.split('@')[0],
            "timezone": "UTC",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        result = databases.create_document(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            document_id=ID.unique(),
            data=data
        )
        return {"status": "created", "user_id": user_id}
    except AppwriteException as e:
        raise HTTPException(status_code=500, detail=f"Appwrite DB Error: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/search")
async def search_users(query: str, user_id: str = Depends(get_user_id)):
    """Search user profiles by email, name, or user ID using fuzzy matching."""
    try:
        results = []
        
        # Fetch a reasonable batch of users
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            queries=[Query.limit(100)]
        )
        
        query_lower = query.lower().strip()
        
        for doc in result.get("documents", []):
            doc_email = (doc.get("email") or "").lower()
            doc_name = (doc.get("display_name") or doc.get("name") or "").lower()
            doc_uid = (doc.get("user_id") or "").lower()
            
            # Fuzzy match: if query is a substring of any of these fields
            if query_lower in doc_email or query_lower in doc_name or query_lower in doc_uid:
                results.append({
                    "id": doc.get("$id"),
                    "user_id": doc.get("user_id"),
                    "email": doc.get("email"),
                    "display_name": doc.get("display_name") or doc.get("name"),
                    "timezone": doc.get("timezone", "UTC"),
                })

        # Return exact matches first, then partial matches
        results.sort(key=lambda x: (
            0 if x['email'].lower() == query_lower or (x['user_id'] and x['user_id'].lower() == query_lower) else 1,
            x['email']
        ))

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/users/preferences")
async def update_user_preferences(preferences: dict, user_id: str = Depends(get_user_id)):
    """Update user's preferences — schedule settings stored inside schedule_preferences JSON"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        notification_prefs = preferences.get('notification_preferences', {})
        email = preferences.get('email')
        now = datetime.now().isoformat()

        # Build the merged schedule_preferences payload
        schedule_prefs_update: Dict[str, Any] = {}
        wh_start = preferences.get('working_hours_start')
        if wh_start:
            schedule_prefs_update['working_hours_start'] = wh_start
        wh_end = preferences.get('working_hours_end')
        if wh_end:
            schedule_prefs_update['working_hours_end'] = wh_end
        ep = preferences.get('energy_pattern')
        if ep:
            schedule_prefs_update['energy_pattern'] = ep
        theme = preferences.get('theme')
        if theme:
            schedule_prefs_update['theme'] = theme
        # Also accept legacy flat keys for backwards compat
        pst = preferences.get('preferred_start_time')
        if pst:
            schedule_prefs_update['preferred_start_time'] = pst
            if 'working_hours_start' not in schedule_prefs_update:
                schedule_prefs_update['working_hours_start'] = pst
        pet = preferences.get('preferred_end_time')
        if pet:
            schedule_prefs_update['preferred_end_time'] = pet
            if 'working_hours_end' not in schedule_prefs_update:
                schedule_prefs_update['working_hours_end'] = pet

        if result.get('documents'):
            existing_doc = result['documents'][0]
            existing_schedule_prefs = _parse_json_field(existing_doc.get('schedule_preferences'), {})
            merged_schedule = {**existing_schedule_prefs, **schedule_prefs_update}
            update_data: Dict[str, Any] = {
                'schedule_preferences': json.dumps(merged_schedule),
                'notification_prefs': json.dumps(notification_prefs),
                'updated_at': now,
            }
            if email:
                update_data['email'] = email
            databases.update_document(
                database_id=DATABASE_ID,
                collection_id=USERS_COLLECTION,
                document_id=existing_doc['$id'],
                data=update_data,
            )
            return {
                "message": "Preferences updated",
                "working_hours_start": merged_schedule.get('working_hours_start',
                    merged_schedule.get('preferred_start_time', '09:00')),
                "working_hours_end": merged_schedule.get('working_hours_end',
                    merged_schedule.get('preferred_end_time', '17:00')),
                "energy_pattern": merged_schedule.get('energy_pattern', 'morning'),
                "theme": merged_schedule.get('theme', 'system'),
                "notification_preferences": notification_prefs,
            }
        else:
            if not email:
                raise HTTPException(status_code=400, detail="Email is required to save preferences")
            if not schedule_prefs_update:
                raise HTTPException(status_code=400, detail="No schedule preferences provided")
            create_data: Dict[str, Any] = {
                'user_id': user_id,
                'email': email,
                'schedule_preferences': json.dumps(schedule_prefs_update),
                'notification_prefs': json.dumps(notification_prefs),
                'created_at': now,
                'updated_at': now,
            }
            databases.create_document(
                database_id=DATABASE_ID,
                collection_id=USERS_COLLECTION,
                document_id=ID.unique(),
                data=create_data,
            )
            return {
                "message": "Preferences created",
                "working_hours_start": schedule_prefs_update.get('working_hours_start',
                    schedule_prefs_update.get('preferred_start_time', '09:00')),
                "working_hours_end": schedule_prefs_update.get('working_hours_end',
                    schedule_prefs_update.get('preferred_end_time', '17:00')),
                "energy_pattern": schedule_prefs_update.get('energy_pattern', 'morning'),
                "theme": schedule_prefs_update.get('theme', 'system'),
                "notification_preferences": notification_prefs,
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Group Collaboration ====================

@app.post("/groups")
async def create_group(group: GroupCreate, user_id: str = Depends(get_user_id)):
    try:
        member_ids = list(dict.fromkeys([user_id, *group.member_ids]))
        payload = {
            "name": group.name,
            "description": group.description,
            "owner_id": user_id,
            "member_ids": json.dumps(member_ids),
            "settings": json.dumps(group.settings or {}),
            "is_active": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }
        result = databases.create_document(
            database_id=DATABASE_ID,
            collection_id=GROUPS_COLLECTION,
            document_id=ID.unique(),
            data=payload,
        )
        return _parse_group_doc(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/groups")
async def list_groups(user_id: str = Depends(get_user_id)):
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=GROUPS_COLLECTION,
        )
        groups = []
        for doc in result.get("documents", []):
            parsed = _parse_group_doc(doc)
            if parsed["owner_id"] == user_id or user_id in parsed["member_ids"]:
                groups.append(parsed)
        groups.sort(key=lambda item: item.get("updated_at") or "", reverse=True)
        return groups
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/groups/{group_id}")
async def get_group(group_id: str, user_id: str = Depends(get_user_id)):
    try:
        group = _get_group_accessible_doc(group_id, user_id)
        tasks_result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=GROUP_TASKS_COLLECTION,
            queries=[Query.equal("group_id", group_id)],
        )
        return {
            "group": _parse_group_doc(group),
            "tasks": [_parse_group_task_doc(doc) for doc in tasks_result.get("documents", [])],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/groups/{group_id}")
async def update_group(group_id: str, update: GroupUpdate, user_id: str = Depends(get_user_id)):
    try:
        existing = _get_group_accessible_doc(group_id, user_id)
        update_data: Dict[str, Any] = {"updated_at": datetime.now().isoformat()}
        if update.name is not None:
            update_data["name"] = update.name
        if update.description is not None:
            update_data["description"] = update.description
        if update.member_ids is not None:
            update_data["member_ids"] = json.dumps(list(dict.fromkeys([existing.get("owner_id"), *update.member_ids])))
        if update.settings is not None:
            update_data["settings"] = json.dumps(update.settings)
        if update.is_active is not None:
            update_data["is_active"] = update.is_active
        result = databases.update_document(
            database_id=DATABASE_ID,
            collection_id=GROUPS_COLLECTION,
            document_id=group_id,
            data=update_data,
        )
        return _parse_group_doc(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/groups/{group_id}")
async def delete_group(group_id: str, user_id: str = Depends(get_user_id)):
    try:
        group = _get_group_accessible_doc(group_id, user_id)
        if group.get("owner_id") != user_id:
            raise HTTPException(status_code=403, detail="Only the group owner can delete the group")

        group_tasks = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=GROUP_TASKS_COLLECTION,
            queries=[Query.equal("group_id", group_id)],
        )
        for task in group_tasks.get("documents", []):
            databases.delete_document(
                database_id=DATABASE_ID,
                collection_id=GROUP_TASKS_COLLECTION,
                document_id=task["$id"],
            )

        databases.delete_document(
            database_id=DATABASE_ID,
            collection_id=GROUPS_COLLECTION,
            document_id=group_id,
        )
        return {"message": "Group deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/members")
async def add_group_member(group_id: str, payload: GroupMemberRequest, user_id: str = Depends(get_user_id)):
    try:
        group = _get_group_accessible_doc(group_id, user_id)
        if group.get("owner_id") != user_id:
            raise HTTPException(status_code=403, detail="Only the group owner can manage members")
        members = _parse_json_field(group.get("member_ids"), [])
        if payload.user_id not in members:
            members.append(payload.user_id)
        result = databases.update_document(
            database_id=DATABASE_ID,
            collection_id=GROUPS_COLLECTION,
            document_id=group_id,
            data={
                "member_ids": json.dumps(members),
                "updated_at": datetime.now().isoformat(),
            }
        )
        return _parse_group_doc(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/groups/{group_id}/members/{member_id}")
async def remove_group_member(group_id: str, member_id: str, user_id: str = Depends(get_user_id)):
    try:
        group = _get_group_accessible_doc(group_id, user_id)
        if group.get("owner_id") != user_id:
            raise HTTPException(status_code=403, detail="Only the group owner can manage members")
        members = [m for m in _parse_json_field(group.get("member_ids"), []) if m != member_id and m != group.get("owner_id")]
        result = databases.update_document(
            database_id=DATABASE_ID,
            collection_id=GROUPS_COLLECTION,
            document_id=group_id,
            data={
                "member_ids": json.dumps(members),
                "updated_at": datetime.now().isoformat(),
            }
        )
        return _parse_group_doc(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/groups/{group_id}/tasks")
async def add_group_task(group_id: str, payload: GroupTaskCreate, user_id: str = Depends(get_user_id)):
    try:
        group = _get_group_accessible_doc(group_id, user_id)
        task = databases.get_document(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            document_id=payload.task_id,
        )
        if task.get("user_id") != user_id and group.get("owner_id") != user_id and user_id not in _parse_json_field(group.get("member_ids"), []):
            raise HTTPException(status_code=403, detail="Access denied")
        data = {
            "group_id": group_id,
            "task_id": payload.task_id,
            "assigned_to": json.dumps(list(dict.fromkeys(payload.assigned_to))),
            "milestone": json.dumps(payload.milestone or {}),
            "progress": payload.progress,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }
        result = databases.create_document(
            database_id=DATABASE_ID,
            collection_id=GROUP_TASKS_COLLECTION,
            document_id=ID.unique(),
            data=data,
        )
        return _parse_group_task_doc(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/groups/{group_id}/tasks")
async def list_group_tasks(group_id: str, user_id: str = Depends(get_user_id)):
    try:
        _get_group_accessible_doc(group_id, user_id)
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=GROUP_TASKS_COLLECTION,
            queries=[Query.equal("group_id", group_id)],
        )
        return [_parse_group_task_doc(doc) for doc in result.get("documents", [])]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

GROUP_MESSAGES_COLLECTION = os.getenv('APPWRITE_COLLECTION_ID_GROUP_MESSAGES', 'group_messages_collection')

@app.post("/groups/{group_id}/messages")
async def send_group_message(group_id: str, payload: GroupMessageCreate, user_id: str = Depends(get_user_id)):
    try:
        _get_group_accessible_doc(group_id, user_id)
        data = {
            "group_id": group_id,
            "sender_id": user_id,
            "message": payload.message,
            "created_at": datetime.now().isoformat(),
        }
        result = databases.create_document(
            database_id=DATABASE_ID,
            collection_id=GROUP_MESSAGES_COLLECTION,
            document_id=ID.unique(),
            data=data,
        )
        return {"id": result["$id"], **data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/groups/{group_id}/messages")
async def get_group_messages(group_id: str, user_id: str = Depends(get_user_id)):
    try:
        _get_group_accessible_doc(group_id, user_id)
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=GROUP_MESSAGES_COLLECTION,
            queries=[
                Query.equal("group_id", group_id),
                Query.order_asc("created_at"),
                Query.limit(100)
            ],
        )
        messages = []
        for doc in result.get("documents", []):
            messages.append({
                "id": doc.get("$id"),
                "group_id": doc.get("group_id"),
                "sender_id": doc.get("sender_id"),
                "message": doc.get("message"),
                "created_at": doc.get("created_at")
            })
        return messages
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ==================== Google Calendar Integration ====================

@app.get("/google/calendar/auth-url")
async def get_google_calendar_auth_url(redirect_uri: Optional[str] = None, user_id: str = Depends(get_user_id)):
    """Generate the Google OAuth consent URL for calendar access."""
    try:
        return {
            "auth_url": _google_auth_url(redirect_uri=redirect_uri, state=user_id),
            "redirect_uri": redirect_uri or GOOGLE_REDIRECT_URI,
            "scopes": [GOOGLE_OAUTH_SCOPE],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/google/calendar/callback")
async def connect_google_calendar(payload: GoogleCalendarCallback, user_id: str = Depends(get_user_id)):
    """Exchange an OAuth code for Google Calendar tokens and store them on the user profile."""
    try:
        redirect_uri = payload.redirect_uri or GOOGLE_REDIRECT_URI
        if not redirect_uri:
            raise HTTPException(status_code=400, detail="Google redirect URI is required")

        token_response = _google_token_request({
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": payload.code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        })

        access_token = token_response.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Google did not return an access token")

        expires_in = int(token_response.get("expires_in", 3600))
        token_data = {
            "access_token": access_token,
            "refresh_token": token_response.get("refresh_token"),
            "scope": token_response.get("scope", GOOGLE_OAUTH_SCOPE),
            "token_type": token_response.get("token_type", "Bearer"),
            "expires_in": expires_in,
            "expires_at": (datetime.now() + timedelta(seconds=expires_in)).isoformat(),
            "connected_at": datetime.now().isoformat(),
            "redirect_uri": redirect_uri,
        }

        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        if not result.get('documents'):
            raise HTTPException(status_code=404, detail="User profile not found. Save preferences first so the profile exists.")

        user_doc = result['documents'][0]
        databases.update_document(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            document_id=user_doc['$id'],
            data={
                'google_calendar_token': json.dumps(token_data),
                'timezone': user_doc.get('timezone', 'UTC'),
                'updated_at': datetime.now().isoformat()
            }
        )
        return {"message": "Google Calendar connected", "connected": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/google/calendar/status")
async def google_calendar_status(user_id: str = Depends(get_user_id)):
    """Return whether the current user has connected Google Calendar."""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        if not result.get('documents'):
            return {"connected": False}

        doc = result['documents'][0]
        token_data = _parse_json_field(doc.get('google_calendar_token'), {})
        return {
            "connected": bool(token_data.get('access_token')),
            "scope": token_data.get('scope'),
            "expires_at": token_data.get('expires_at'),
            "connected_at": token_data.get('connected_at'),
            "timezone": doc.get('timezone', 'UTC'),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/google/calendar/disconnect")
async def disconnect_google_calendar(user_id: str = Depends(get_user_id)):
    """Remove Google Calendar tokens from the user's profile."""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        if not result.get('documents'):
            raise HTTPException(status_code=404, detail="User profile not found")

        doc = result['documents'][0]
        databases.update_document(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            document_id=doc['$id'],
            data={
                'google_calendar_token': json.dumps({}),
                'updated_at': datetime.now().isoformat()
            }
        )
        return {"message": "Google Calendar disconnected", "connected": False}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/google/calendar/sync")
async def sync_google_calendar(payload: GoogleCalendarSyncRequest, user_id: str = Depends(get_user_id)):
    """Sync scheduled tasks to Google Calendar for a given day."""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=USERS_COLLECTION,
            queries=[Query.equal('user_id', user_id)]
        )
        if not result.get('documents'):
            raise HTTPException(status_code=404, detail="User profile not found")

        user_doc = result['documents'][0]
        access_token = _refresh_google_token_if_needed(user_doc)
        if not access_token:
            raise HTTPException(status_code=400, detail="Google Calendar is not connected")

        date = payload.date or datetime.now().strftime("%Y-%m-%d")
        tasks_result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=[
                Query.equal('user_id', user_id),
                Query.greater_than_equal('scheduled_start', f"{date}T00:00:00"),
                Query.less_than_equal('scheduled_start', f"{date}T23:59:59")
            ]
        )
        tasks = tasks_result.get('documents', [])
        created_events = []
        skipped = 0

        for task in tasks:
            scheduled_start = _safe_datetime(task.get('scheduled_start'))
            scheduled_end = _safe_datetime(task.get('scheduled_end'))
            if not scheduled_start or not scheduled_end:
                skipped += 1
                continue

            event_payload = {
                "summary": task.get('title', 'Task'),
                "description": task.get('description') or '',
                "start": {
                    "dateTime": scheduled_start.isoformat(),
                    "timeZone": user_doc.get('timezone', 'UTC'),
                },
                "end": {
                    "dateTime": scheduled_end.isoformat(),
                    "timeZone": user_doc.get('timezone', 'UTC'),
                },
            }
            created_event = _google_api_request(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                method="POST",
                token=access_token,
                payload=event_payload,
            )
            created_events.append({
                "task_id": task.get('$id'),
                "event_id": created_event.get('id'),
                "html_link": created_event.get('htmlLink'),
                "summary": created_event.get('summary'),
            })

        return {
            "message": "Google Calendar sync completed",
            "date": date,
            "synced": len(created_events),
            "skipped": skipped,
            "events": created_events,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== AI Tips Endpoints ====================

@app.get("/ai/tips")
async def get_ai_tips(user_id: str = Depends(get_user_id)):
    """Get AI-generated productivity tips"""
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = "Provide exactly 3 concise productivity tips for a student. Format the response as a valid JSON array of objects, where each object has a 'tip' (string) and a 'category' (string like 'focus', 'planning', or 'energy')."
        response = model.generate_content(prompt)
        text = response.text
        if text.startswith("```json"):
            text = text.split("```json")[1].rsplit("```", 1)[0].strip()
        elif text.startswith("```"):
            text = text.split("```")[1].rsplit("```", 1)[0].strip()
        return json.loads(text)
    except Exception as e:
        print(f"Gemini AI error: {e}")
        return [
            {"tip": "Break large tasks into smaller, manageable sub-tasks", "category": "productivity"},
            {"tip": "Schedule your most challenging work during your peak energy hours", "category": "energy"},
            {"tip": "Take short breaks every 25-30 minutes to maintain focus", "category": "focus"}
        ]


@app.post("/ai/task-suggestions")
async def get_task_suggestions(user_id: str = Depends(get_user_id)):
    """Get AI suggestions for tasks"""
    try:
        result = databases.list_documents(
            database_id=DATABASE_ID,
            collection_id=TASKS_COLLECTION,
            queries=[Query.equal('user_id', user_id), Query.not_equal('status', 'completed')]
        )
        tasks = result.get('documents', [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    if not tasks:
        return []
        
    try:
        tasks_data = [{"id": t['$id'], "title": t.get('title'), "category": t.get('category')} for t in tasks[:5]]
        prompt = f"Given these tasks: {json.dumps(tasks_data)}, provide a practical suggestion for each task. Return a valid JSON array of objects. Each object must have 'task_id' (string matching the provided id), 'suggestion' (string), and 'priority' (integer 1-5)."
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        text = response.text
        if text.startswith("```json"):
            text = text.split("```json")[1].rsplit("```", 1)[0].strip()
        elif text.startswith("```"):
            text = text.split("```")[1].rsplit("```", 1)[0].strip()
            
        parsed = json.loads(text)
        if not isinstance(parsed, list):
            raise ValueError("Response is not a JSON list")
        return parsed
    except Exception as e:
        print(f"Gemini AI task suggestion error: {e}")
        suggestions = []
        for task in tasks[:5]:
            priority = task.get('priority', 3)
            category = task.get('category', '')
            suggestion_text = "Consider breaking this into smaller study sessions" if category == 'academic' else \
                             "Schedule this during your leisure time" if category == 'personal' else \
                             "Allocate dedicated focus time for this task"
            suggestions.append({"task_id": task['$id'], "suggestion": suggestion_text, "priority": max(1, min(5, 6 - priority))})
        return suggestions


# ==================== Health Check ====================

@app.get("/")
def root():
    return {"message": "Student Task Management API is Running", "version": "1.0.0", "status": "healthy"}


@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
