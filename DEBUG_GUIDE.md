# Debug Guide: Survey Submission & Authentication Issues

## Issues Identified

### 1. **Survey Submission 500 Error**
**Error**: `Failed to submit survey: Error: Failed to submit survey`
- **Root Cause**: Backend endpoint was throwing generic 500 errors without details
- **Fix Applied**: Added comprehensive logging to `/evaluation/survey` endpoint in `ai_service/main.py`

### 2. **Appwrite Permission Error**
**Error**: `AppwriteException: User (role: guests) missing scopes (["account"])`
- **Root Cause**: The Appwrite backend API key doesn't have permission to access account functions
- **Impact**: Authentication fails during login and registration
- **Fix Applied**: Added error handling to gracefully degrade when Appwrite is misconfigured

### 3. **404 at /login Page**
**Error**: `This page could not be found` when accessing `/login`
- **Root Cause**: Appwrite permission error during AuthContext initialization was crashing the entire app
- **Fix Applied**: Wrapped all Appwrite calls in try-catch with graceful error handling

---

## Fixes Applied

### Backend (ai_service/main.py)
✅ Enhanced survey submission endpoint with detailed logging:
```python
# Added logs for:
- User ID validation
- Answer data inspection
- Database operation debugging
- Specific error type identification (JSON, Validation, Database errors)
- Full stack trace on failures
```

### Frontend (frontend/context/AuthContext.tsx)
✅ Improved error handling throughout:
- `checkUserStatus()`: Handles Appwrite scope errors gracefully
- `login()`: Detailed logging of each step
- `register()`: Added logging and error categorization
- `requestPasswordReset()`: Better error handling
- `completePasswordReset()`: Error logging
- `logout()`: Error handling without crashing

---

## How to Debug Issues Now

### Step 1: Check Backend Logs
When survey submission fails:

1. **If running locally**:
   ```bash
   cd ai_service
   python main.py
   ```
   Look for logs starting with `[SURVEY]` - they'll show exactly where it fails

2. **If deployed on Render**:
   - Go to your Render dashboard
   - Navigate to your service logs
   - Look for `[SURVEY]` prefix logs to see the error details

### Step 2: Check Frontend Console
Open browser DevTools → Console to see:
- `[AuthContext]` logs showing authentication flow
- `[SURVEY]` endpoint will now return specific error types instead of generic 500

### Step 3: Verify Environment Variables

**Backend Requirements** (`ai_service/.env`):
```
APPWRITE_ENDPOINT=your_endpoint
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key  # Must have account scope!
APPWRITE_DATABASE_ID=scheduler_db
APPWRITE_COLLECTION_ID_SURVEY=survey_collection
```

**Frontend Requirements** (`frontend/.env.local`):
```
NEXT_PUBLIC_APPWRITE_ENDPOINT=your_endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_API_URL=http://localhost:8000  # or your backend URL
```

---

## Fixing Appwrite Scope Error

The error `missing scopes (["account"])` means your API key doesn't have permission.

### To Fix in Appwrite Console:

1. Go to **Settings → API Keys**
2. Select or create an API key
3. Ensure these scopes are enabled:
   - `account` (for user authentication)
   - `databases` (for data operations)
   - `documents` (for CRUD operations)

4. Or generate a new API key with all required scopes

### For Demo Mode
If you want to skip Appwrite entirely:
- Leave `NEXT_PUBLIC_APPWRITE_ENDPOINT` and `NEXT_PUBLIC_APPWRITE_PROJECT_ID` unset
- The app will use demo data (no real authentication)
- Frontend will show: `[AuthContext] Appwrite not configured - using demo mode`
- Backend will show: `DEMO_MODE = True`

---

## Testing the Survey Endpoint

### Manual Test with cURL:

```bash
curl -X POST http://localhost:8000/evaluation/survey \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{
    "answers": {
      "q1": 8,
      "q2": "positive",
      "q3": 7
    }
  }'
```

Expected response:
- **Success (201)**: `{"message": "Survey submitted successfully", "id": "..."}`
- **Error (400)**: `{"detail": "Validation error: ..."}`
- **Error (500)**: `{"detail": "TypeError: ..."}`  (with specific error type now!)

---

## Checklist for Full System Testing

- [ ] Backend server running (`cd ai_service && python main.py`)
- [ ] Frontend dev server running (`cd frontend && npm run dev`)
- [ ] Environment variables configured for both backend and frontend
- [ ] Appwrite API key has required scopes (account, databases, documents)
- [ ] x-user-id header is sent in all API requests from frontend
- [ ] Browser console shows `[AuthContext]` logs (no errors)
- [ ] Backend terminal shows debug logs for all operations

---

## Next Steps

1. **Test locally first** to isolate issues:
   - Ensure Appwrite is running and configured
   - Run backend and frontend dev servers
   - Try submitting a survey
   - Check both browser console and backend terminal logs

2. **Review the detailed logs** to identify the specific failure point

3. **Fix the root cause**:
   - For Appwrite errors: Update API key scopes
   - For database errors: Run `python init_db.py`
   - For validation errors: Check the survey data format

4. **Re-test** and verify logs show the expected flow

