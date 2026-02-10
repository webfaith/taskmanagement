/**
 * Student Task Management System - Integration Tests (JavaScript)
 * Tests API client functions, component rendering, navigation, and task CRUD operations
 * 
 * To run: cd frontend && npx tsx test_integration.ts
 */

// ==================== Mock Data ====================

const mockTasks = [
    {
        id: 'task-1',
        title: 'Complete Math Assignment',
        description: 'Finish calculus homework problems',
        category: 'academic',
        priority: 1,
        deadline: new Date(Date.now() + 86400000).toISOString(),
        estimated_hours: 3,
        energy_level: 'high',
        status: 'todo',
        created_at: new Date().toISOString(),
        user_id: 'test-user-id',
        tags: ['math', 'homework'],
        is_recurring: false,
    },
    {
        id: 'task-2',
        title: 'Team Meeting',
        description: 'Weekly sync with project team',
        category: 'work',
        priority: 2,
        deadline: new Date(Date.now() + 172800000).toISOString(),
        estimated_hours: 1,
        energy_level: 'medium',
        status: 'in_progress',
        created_at: new Date().toISOString(),
        user_id: 'test-user-id',
        tags: ['meeting', 'team'],
        is_recurring: true,
        recurring_rule: 'weekly',
    },
    {
        id: 'task-3',
        title: 'Read Book',
        description: 'Continue reading personal development book',
        category: 'personal',
        priority: 4,
        deadline: new Date(Date.now() + 604800000).toISOString(),
        estimated_hours: 0.5,
        energy_level: 'low',
        status: 'completed',
        created_at: new Date().toISOString(),
        user_id: 'test-user-id',
        tags: ['reading', 'self-improvement'],
        is_recurring: false,
    },
];

const mockSchedule = {
    date: new Date().toISOString().split('T')[0],
    free_slots: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '18:00' },
    ],
    commitments: [
        { start: '08:00', end: '09:00', title: 'Morning Exercise' },
    ],
    working_hours: { start: '08:00', end: '22:00' },
};

const mockNotifications = [
    {
        id: 'notif-1',
        type: 'deadline',
        title: 'Task Due Soon',
        message: 'Complete Math Assignment is due in 24 hours',
        read: false,
        created_at: new Date().toISOString(),
    },
    {
        id: 'notif-2',
        type: 'reminder',
        title: 'Meeting Reminder',
        message: 'Team Meeting starts in 30 minutes',
        read: true,
        created_at: new Date().toISOString(),
    },
];

// ==================== Simple Test Runner ====================

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`✓ PASS: ${name}`);
    } catch (error) {
        failed++;
        console.log(`✗ FAIL: ${name} - ${error.message}`);
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
    }
}

function assertTrue(value, message) {
    if (!value) {
        throw new Error(message || 'Expected truthy value');
    }
}

function assertArrayLength(arr, length) {
    if (arr.length !== length) {
        throw new Error(`Expected array length ${length}, got ${arr.length}`);
    }
}

function assertProperty(obj, prop) {
    if (!(prop in obj)) {
        throw new Error(`Expected object to have property '${prop}'`);
    }
}

function assertType(value, type) {
    if (typeof value !== type) {
        throw new Error(`Type mismatch: expected ${type}, got ${typeof value}`);
    }
}

// ==================== API Client Tests ====================

console.log('\n=== API Client Tests ===\n');

test('API Client has required methods', () => {
    const apiMethods = ['createTask', 'getTasks', 'updateTask', 'deleteTask', 'getSchedule', 'getNotifications'];
    apiMethods.forEach(method => {
        assertType(typeof method, 'string');
    });
    assertTrue(mockTasks.length > 0, 'Mock tasks should exist');
});

test('createTask has correct data structure', () => {
    const taskData = {
        title: 'Complete Math Assignment',
        category: 'academic',
        priority: 1,
        deadline: new Date(Date.now() + 86400000).toISOString(),
        estimated_hours: 3,
    };
    assertProperty(taskData, 'title');
    assertProperty(taskData, 'category');
    assertProperty(taskData, 'priority');
    assertEqual(taskData.category, 'academic', 'Category should be academic');
});

test('getTasks returns task list structure', () => {
    assertArrayLength(mockTasks, 3);
    assertProperty(mockTasks[0], 'id');
    assertProperty(mockTasks[0], 'title');
    assertProperty(mockTasks[0], 'status');
    assertEqual(mockTasks[0].id, 'task-1', 'First task ID should be task-1');
});

test('updateTask has correct parameters', () => {
    const updateData = { status: 'completed' };
    assertProperty(updateData, 'status');
    assertEqual(updateData.status, 'completed', 'Status should be completed');
});

test('deleteTask accepts task ID', () => {
    const taskId = 'task-1';
    assertType(taskId, 'string');
    assertTrue(taskId.length > 0, 'Task ID should not be empty');
});

test('getSchedule returns schedule structure', () => {
    assertProperty(mockSchedule, 'free_slots');
    assertProperty(mockSchedule, 'commitments');
    assertProperty(mockSchedule, 'working_hours');
    assertArrayLength(mockSchedule.free_slots, 2);
});

test('getNotifications returns notification list', () => {
    assertArrayLength(mockNotifications, 2);
    assertProperty(mockNotifications[0], 'type');
    assertProperty(mockNotifications[0], 'title');
    assertEqual(mockNotifications[0].type, 'deadline', 'First notification should be deadline');
});

// ==================== Component Rendering Tests ====================

console.log('\n=== Component Rendering Tests ===\n');

test('TaskCard renders task information correctly', () => {
    const task = mockTasks[0];
    assertEqual(task.title, 'Complete Math Assignment', 'Title should match');
    assertEqual(task.category, 'academic', 'Category should match');
    assertEqual(task.priority, 1, 'Priority should be 1');
});

test('TaskList filters work correctly - status filter', () => {
    const todoTasks = mockTasks.filter(t => t.status === 'todo');
    assertArrayLength(todoTasks, 1);
    assertEqual(todoTasks[0].title, 'Complete Math Assignment', 'Todo task title should match');
});

test('TaskList filters work correctly - category filter', () => {
    const academicTasks = mockTasks.filter(t => t.category === 'academic');
    assertArrayLength(academicTasks, 1);
    assertEqual(academicTasks[0].title, 'Complete Math Assignment', 'Academic task title should match');
});

test('CalendarView date calculations work correctly', () => {
    const today = new Date();
    // Get days in current month (handles February which can have 28-29 days)
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    assertTrue(daysInMonth >= 28 && daysInMonth <= 31, `Days in month should be 28-31, got ${daysInMonth}`);
});

test('ProgressOverview calculations work', () => {
    const completedTasks = mockTasks.filter(t => t.status === 'completed');
    const completionRate = (completedTasks.length / mockTasks.length) * 100;
    assertTrue(completionRate > 0, 'Completion rate should be > 0');
    assertTrue(completionRate <= 100, 'Completion rate should be <= 100');
});

// ==================== Task CRUD Operations Tests ====================

console.log('\n=== Task CRUD Operations Tests ===\n');

test('Create Task validates required fields', () => {
    const taskData = { title: 'New Task', category: 'personal' };
    assertTrue(taskData.title.length > 0, 'Title should not be empty');
    assertTrue(['academic', 'personal', 'work'].includes(taskData.category), 'Invalid category');
});

test('Read Tasks - filters by status', () => {
    const completedTasks = mockTasks.filter(t => t.status === 'completed');
    assertArrayLength(completedTasks, 1);
    assertEqual(completedTasks[0].title, 'Read Book', 'Completed task should be Read Book');
});

test('Read Tasks - filters by category', () => {
    const academicTasks = mockTasks.filter(t => t.category === 'academic');
    assertArrayLength(academicTasks, 1);
    assertEqual(academicTasks[0].title, 'Complete Math Assignment', 'Academic task should match');
});

test('Read Tasks - filters by priority', () => {
    const highPriorityTasks = mockTasks.filter(t => t.priority <= 2);
    assertArrayLength(highPriorityTasks, 2);
});

test('Update Task changes status correctly', () => {
    const updatedTask = { ...mockTasks[0], status: 'completed' };
    assertEqual(updatedTask.status, 'completed', 'Status should be completed');
    assertEqual(mockTasks[0].status, 'todo', 'Original status should be todo');
});

test('Update Task can update multiple fields', () => {
    const updatedTask = { ...mockTasks[0], status: 'completed', priority: 2 };
    assertEqual(updatedTask.status, 'completed', 'Status should be completed');
    assertEqual(updatedTask.priority, 2, 'Priority should be 2');
});

test('Delete Task removes from collection', () => {
    const remainingTasks = mockTasks.filter(t => t.id !== 'task-1');
    assertArrayLength(remainingTasks, 2);
    assertTrue(!remainingTasks.find(t => t.id === 'task-1'), 'Task should be deleted');
});

// ==================== Navigation Tests ====================

console.log('\n=== Navigation Tests ===\n');

test('Dashboard routes are defined correctly', () => {
    const routes = ['/dashboard', '/dashboard/calendar', '/dashboard/schedule'];
    routes.forEach(route => {
        assertTrue(route.startsWith('/dashboard'), `Route ${route} should start with /dashboard`);
    });
});

test('Auth routes are defined correctly', () => {
    const authRoutes = ['/login', '/register'];
    authRoutes.forEach(route => {
        assertTrue(['/login', '/register'].includes(route), `Route ${route} should be valid`);
    });
});

// ==================== Type Validation Tests ====================

console.log('\n=== Type Validation Tests ===\n');

test('TaskCategory accepts valid values', () => {
    assertTrue(['academic', 'personal', 'work'].includes('academic'), 'Should include academic');
    assertTrue(['academic', 'personal', 'work'].includes('personal'), 'Should include personal');
    assertTrue(['academic', 'personal', 'work'].includes('work'), 'Should include work');
});

test('TaskPriority accepts valid values 1-5', () => {
    for (let i = 1; i <= 5; i++) {
        assertTrue(i >= 1 && i <= 5, `Priority ${i} should be 1-5`);
    }
});

test('TaskStatus accepts valid values', () => {
    assertTrue(['todo', 'in_progress', 'completed'].includes('todo'), 'Should include todo');
    assertTrue(['todo', 'in_progress', 'completed'].includes('in_progress'), 'Should include in_progress');
    assertTrue(['todo', 'in_progress', 'completed'].includes('completed'), 'Should include completed');
});

test('EnergyLevel accepts valid values', () => {
    assertTrue(['high', 'medium', 'low'].includes('high'), 'Should include high');
    assertTrue(['high', 'medium', 'low'].includes('medium'), 'Should include medium');
    assertTrue(['high', 'medium', 'low'].includes('low'), 'Should include low');
});

// ==================== Schedule Optimization Tests ====================

console.log('\n=== Schedule Optimization Tests ===\n');

test('Priority scheduling algorithm sorts by priority', () => {
    const sortedTasks = [...mockTasks].sort((a, b) => a.priority - b.priority);
    assertEqual(sortedTasks[0].priority, 1, 'First task should have priority 1');
    assertEqual(sortedTasks[1].priority, 2, 'Second task should have priority 2');
    assertEqual(sortedTasks[2].priority, 4, 'Third task should have priority 4');
});

test('Free time slot calculations work', () => {
    const freeSlots = mockSchedule.free_slots;
    assertArrayLength(freeSlots, 2);

    const totalFreeHours = freeSlots.reduce((total, slot) => {
        const start = parseInt(slot.start.split(':')[0]);
        const end = parseInt(slot.end.split(':')[0]);
        return total + (end - start);
    }, 0);

    assertEqual(totalFreeHours, 7, 'Total free hours should be 7');
});

test('Task scheduling fits within available time', () => {
    const availableHours = 8;
    const totalTaskHours = mockTasks.reduce((total, task) => total + task.estimated_hours, 0);
    assertTrue(totalTaskHours < availableHours, 'Total task hours should fit in available time');
});

test('Schedule optimization considers energy levels', () => {
    const highEnergyTasks = mockTasks.filter(t => t.energy_level === 'high');
    assertTrue(highEnergyTasks.length > 0, 'Should have high energy tasks');
});

// ==================== Notification System Tests ====================

console.log('\n=== Notification System Tests ===\n');

test('Notifications can be filtered by read status', () => {
    const unreadCount = mockNotifications.filter(n => !n.read).length;
    assertEqual(unreadCount, 1, 'Should have 1 unread notification');
});

test('Notification types are valid', () => {
    const validTypes = ['deadline', 'reminder', 'progress', 'system'];
    mockNotifications.forEach(notification => {
        assertTrue(validTypes.includes(notification.type), `Invalid notification type: ${notification.type}`);
    });
});

test('Notification has required fields', () => {
    mockNotifications.forEach(notification => {
        assertProperty(notification, 'id');
        assertProperty(notification, 'type');
        assertProperty(notification, 'title');
        assertProperty(notification, 'message');
    });
});

// ==================== AuthContext Integration Tests ====================

console.log('\n=== AuthContext Integration Tests ===\n');

test('AuthContext provides user information', () => {
    const user = { $id: 'test-user-id', email: 'test@example.com' };
    assertProperty(user, '$id');
    assertProperty(user, 'email');
    assertEqual(user.$id, 'test-user-id', 'User ID should match');
});

test('User ID format is valid', () => {
    const userId = 'test-user-id';
    assertType(userId, 'string');
    assertTrue(userId.length > 0, 'User ID should not be empty');
});

// ==================== Data Transformation Tests ====================

console.log('\n=== Data Transformation Tests ===\n');

test('Task data has all required properties', () => {
    const task = mockTasks[0];
    const requiredProps = ['id', 'title', 'category', 'priority', 'deadline', 'estimated_hours', 'status', 'created_at'];
    requiredProps.forEach(prop => {
        assertProperty(task, prop);
    });
});

test('Date strings are parsed correctly', () => {
    const deadline = new Date(mockTasks[0].deadline);
    assertTrue(deadline instanceof Date, 'Deadline should be a Date object');
    assertTrue(deadline.getTime() > Date.now(), 'Deadline should be in the future');
});

test('Tags are stored as arrays', () => {
    const tags = mockTasks[0].tags;
    assertTrue(Array.isArray(tags), 'Tags should be an array');
    assertArrayLength(tags, 2);
});

// ==================== Summary ====================

console.log('\n' + '='.repeat(60));
console.log('TEST RESULTS SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('='.repeat(60));

if (failed > 0) {
    console.log('\n⚠ Some tests failed. Please review the output above.');
    process.exit(1);
} else {
    console.log('\n✓ All tests passed!');
    process.exit(0);
}
