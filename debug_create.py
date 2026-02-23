import urllib.request, json
from datetime import datetime, timedelta

base = 'http://localhost:8000'
now = datetime.now()

task_data = {
    'title': 'Detailed Error Test',
    'category': 'academic',
    'priority': 3,
    'deadline': (now + timedelta(days=1)).isoformat(),
    'estimated_hours': 2.0,
    'energy_level': 'medium',
    'tags': [],
    'is_recurring': False
}

body = json.dumps(task_data).encode()
req = urllib.request.Request(f'{base}/tasks', data=body,
    headers={'x-user-id': 'test-user-debug', 'Content-Type': 'application/json'},
    method='POST')

try:
    with urllib.request.urlopen(req) as r:
        print(f"SUCCESS: {r.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"HTTP ERROR {e.code}: {e.read().decode()}")
except Exception as e:
    print(f"OTHER ERROR: {e}")
