# Student Task Management System

A comprehensive task management and scheduling system for students, built with FastAPI (backend) and Next.js (frontend), featuring AI-powered schedule optimization, productivity tracking, and evaluation features.

## Features

- **Task Management** - Create, update, delete, and organize tasks with priorities, categories, and tags
- **Smart Scheduling** - AI-powered schedule optimization considering energy levels and deadlines
- **Calendar View** - Visual calendar showing tasks and deadlines
- **Analytics Dashboard** - Productivity tracking with charts and statistics
- **Notifications** - Deadline reminders and task updates
- **Evaluation System** - Feedback collection and student surveys
- **Responsive Design** - Works on desktop and mobile devices
- **Secure Authentication** - Built on Appwrite with JWT tokens

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Appwrite** - Backend-as-a-Service for database and authentication
- **Pydantic** - Data validation using Python type hints

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React** - UI component library

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.0 or later
- **Python** 3.9 or later
- **Appwrite** account (cloud or self-hosted)
- **Git** for version control

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd agbochinitaskmanement
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd ai_service

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from template
copy .env.example .env  # On Windows
# or
cp .env.example .env  # On Linux/Mac
```

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
copy .env.local.example .env.local  # On Windows
# or
cp .env.local.example .env.local  # On Linux/Mac
```

## Configuration

### Backend Environment Variables

Edit `ai_service/.env` with your Appwrite credentials:

```env
# Appwrite Configuration
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_DATABASE_ID=scheduler_db

# Collection IDs (created by init_db.py)
APPWRITE_COLLECTION_ID_USERS=users_collection
APPWRITE_COLLECTION_ID_TASKS=tasks_collection
APPWRITE_COLLECTION_ID_SCHEDULES=schedules_collection
APPWRITE_COLLECTION_ID_NOTIFICATIONS=notifications_collection
APPWRITE_COLLECTION_ID_ANALYTICS=analytics_collection
```

### Frontend Environment Variables

Edit `frontend/.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=scheduler_db
```

## Database Setup

### Initialize Appwrite Database

Before running the application, you need to set up the Appwrite database:

```bash
cd ai_service

# Run the database initialization script
python init_db.py
```

This will:
1. Create the database "Student Task Management DB"
2. Create all required collections with proper attributes
3. Set up indexes for efficient queries

**Note:** Ensure your Appwrite API key has the following permissions:
- databases.create
- collections.create
- attributes.create
- indexes.create

## Running the Application

### Start the Backend

```bash
cd ai_service

# Activate virtual environment (if created)
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### Start the Frontend

```bash
cd frontend

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Testing

### Run Backend Tests

```bash
cd ai_service
python test_system.py
```

### Run Frontend Integration Tests

```bash
cd frontend
npx tsx test_integration.ts
```

### Run Frontend Linting

```bash
cd frontend
npm run lint
```

### Build for Production

```bash
cd frontend
npm run build
```

## Project Structure

```
agbochinitaskmanement/
├── ai_service/                 # FastAPI Backend
│   ├── main.py               # Main API application
│   ├── init_db.py            # Database initialization
│   ├── requirements.txt      # Python dependencies
│   └── .env                   # Environment variables
│
├── frontend/                  # Next.js Frontend
│   ├── app/                   # App Router pages
│   │   ├── (auth)/           # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/       # Protected dashboard pages
│   │   │   ├── calendar/
│   │   │   ├── schedule/
│   │   │   ├── analytics/
│   │   │   ├── evaluation/
│   │   │   └── profile/
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   │   ├── CreateTaskModal.tsx
│   │   ├── TaskList.tsx
│   │   ├── TaskCard.tsx
│   │   ├── CalendarView.tsx
│   │   ├── NotificationsPanel.tsx
│   │   └── ...
│   ├── context/              # React context providers
│   │   ├── AuthContext.tsx
│   │   └── EvaluationContext.tsx
│   ├── lib/                  # Utility libraries
│   │   ├── api.ts            # API client
│   │   ├── appwrite.ts       # Appwrite configuration
│   │   └── evaluation.ts     # Evaluation functions
│   ├── types/                # TypeScript types
│   │   ├── task.ts
│   │   └── evaluation.ts
│   └── package.json
│
├── test_system.py            # Backend test suite
├── TESTING_REPORT.md         # Test results documentation
└── README.md                 # This file
```

## API Endpoints

### Tasks
- `POST /tasks` - Create a new task
- `GET /tasks` - List all tasks (with optional filters)
- `GET /tasks/{task_id}` - Get task details
- `PUT /tasks/{task_id}` - Update a task
- `DELETE /tasks/{task_id}` - Delete a task
- `PATCH /tasks/{task_id}/status` - Update task status

### Schedule
- `GET /schedule/{date}` - Get daily schedule
- `PUT /schedule/preferences` - Set schedule preferences

### Notifications
- `GET /notifications/` - List notifications
- `PUT /notifications/{id}/read` - Mark notification as read

### Analytics
- `GET /analytics/stats` - Get productivity statistics
- `GET /analytics/weekly` - Get weekly productivity data

## Evaluation Features

The system includes comprehensive evaluation features:

### Feedback System
- Collect student feedback on tasks and schedules
- Rate productivity and satisfaction

### Surveys
- Create and manage student surveys
- Analyze responses and trends

### Stories
- Share success stories and experiences
- Track personal growth

## Deployment

### Docker Deployment (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./ai_service
    ports:
      - "8000:8000"
    environment:
      - APPWRITE_ENDPOINT=${APPWRITE_ENDPOINT}
      - APPWRITE_PROJECT_ID=${APPWRITE_PROJECT_ID}
      - APPWRITE_API_KEY=${APPWRITE_API_KEY}
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend
    restart: unless-stopped
```

### Vercel Deployment (Frontend)

```bash
cd frontend
vercel deploy
```

### Railway Deployment

1. Connect your GitHub repository
2. Set environment variables
3. Deploy both services

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the repository or contact the development team.

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Amazing Python web framework
- [Next.js](https://nextjs.org/) - Powerful React framework
- [Appwrite](https://appwrite.io/) - Open-source Backend-as-a-Service
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
