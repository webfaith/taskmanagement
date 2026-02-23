import urllib.request, json
from datetime import datetime, timedelta

base = 'http://localhost:8000'

def get(path):
    req = urllib.request.Request(f'{base}{path}', headers={'x-user-id': 'test-user-verify'})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
    except Exception as e:
        return 0, str(e)

def post(path, data=None):
    body = json.dumps(data or {}).encode()
    req = urllib.request.Request(f'{base}{path}', data=body,
        headers={'x-user-id': 'test-user-verify', 'Content-Type': 'application/json'},
        method='POST')
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
    except Exception as e:
        return 0, str(e)

# ── Priority logic unit tests ──────────────────────────────────────────────────
def calculate_priority(deadline, estimated_hours, category):
    now = datetime.now()
    if deadline.tzinfo is not None:
        deadline = deadline.replace(tzinfo=None)
    hours = (deadline - now).total_seconds() / 3600
    if hours <= 0:      base = 1
    elif hours <= 24:   base = 1
    elif hours <= 72:   base = 2
    elif hours <= 168:  base = 3
    elif hours <= 336:  base = 4
    else:               base = 5
    if estimated_hours > 5 and base > 1:
        base -= 1
    bump = {'academic': -1, 'work': 0, 'personal': 1}.get(category, 0)
    return max(1, min(5, base + bump))

now = datetime.now()
unit_tests = [
    ("Due in 12h, 6h, academic",  now + timedelta(hours=12), 6, 'academic', 1),
    ("Due in 48h, 2h, work",      now + timedelta(hours=48), 2, 'work',     2),
    ("Due in 5d, 3h, personal",   now + timedelta(days=5),   3, 'personal', 4),
    ("Due in 20d, 1h, academic",  now + timedelta(days=20),  1, 'academic', 4),
    ("Overdue, 2h, work",         now - timedelta(hours=1),  2, 'work',     1),
]

print("\n=== Priority Logic Unit Tests ===")
all_pass = True
for label, dl, hrs, cat, expected in unit_tests:
    got = calculate_priority(dl, hrs, cat)
    ok = got == expected
    if not ok: all_pass = False
    print(f"  {'PASS' if ok else 'FAIL'} {label:<36} expected P{expected}, got P{got}")

print(f"\n  Unit tests: {'ALL PASS' if all_pass else 'SOME FAILED'}")

# ── Live API tests ─────────────────────────────────────────────────────────────
print("\n=== Live API Endpoint Tests ===")
results = []

s, d = get('/tasks')
results.append(('GET /tasks', s, f"{len(d)} tasks" if isinstance(d, list) else str(d)[:60]))

s, d = get('/tasks/prioritized')
results.append(('GET /tasks/prioritized', s, f"{len(d)} tasks" if isinstance(d, list) else str(d)[:60]))

s, d = get('/notifications')
results.append(('GET /notifications', s, f"{len(d)} notifs" if isinstance(d, list) else str(d)[:60]))

s, d = get('/notifications/unread-count')
results.append(('GET /notifications/unread-count', s, str(d)))

s, d = post('/notifications/generate-reminders')
results.append(('POST /notifications/generate-reminders', s, str(d)[:80]))

# Create task with deadline 10h away, 6hrs estimated, academic
# Expected AI priority = 1 (<=24h -> P1, effort >5 -> no change since P1, academic -1 -> max(1,0)=1)
task_data = {
    'title': 'AI Priority Test Task',
    'category': 'academic',
    'priority': 5,  # User wants low; AI should override to P1
    'deadline': (now + timedelta(hours=10)).isoformat(),
    'estimated_hours': 6,
    'energy_level': 'high',
    'tags': [],
    'is_recurring': False
}
s, d = post('/tasks', task_data)
if s == 200:
    ai_p = d.get('priority', '?')
    results.append(('POST /tasks (AI override)', s, f"AI P={ai_p} (expected 1, user gave 5)"))
else:
    results.append(('POST /tasks (AI override)', s, str(d)[:80]))

for label, status, msg in results:
    icon = 'PASS' if status == 200 else 'FAIL'
    print(f"  [{icon}] {label:<40} HTTP {status} | {msg}")

print()
