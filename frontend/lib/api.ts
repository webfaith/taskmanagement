import { Task, TaskFilters, UserSchedule, Notification, ScheduleRecommendation, ProductivityStats, UserPreferences, Group, GroupTask } from '@/types/task';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const demoNow = new Date();
const demoDate = (daysOffset: number) => new Date(demoNow.getTime() + daysOffset * 24 * 60 * 60 * 1000).toISOString();

const createDemoTasks = (): Task[] => [
    {
        id: 'demo-task-1',
        title: 'Complete Math Assignment',
        description: 'Finish algebra problem set',
        category: 'academic',
        priority: 1,
        deadline: demoDate(1),
        estimated_hours: 2,
        energy_level: 'high',
        status: 'in_progress',
        created_at: demoDate(-2),
        user_id: 'demo-user',
        tags: ['math', 'algebra'],
        is_recurring: false,
        scheduled_time: demoDate(0),
        priority_reason: 'Due tomorrow and high impact',
    },
    {
        id: 'demo-task-2',
        title: 'Review project notes',
        description: 'Summarize key meeting points',
        category: 'work',
        priority: 2,
        deadline: demoDate(2),
        estimated_hours: 1.5,
        energy_level: 'medium',
        status: 'todo',
        created_at: demoDate(-1),
        user_id: 'demo-user',
        tags: ['review', 'notes'],
        is_recurring: false,
    },
    {
        id: 'demo-task-3',
        title: 'Plan weekend study block',
        description: 'Set up a focused study session',
        category: 'personal',
        priority: 3,
        deadline: demoDate(4),
        estimated_hours: 1,
        energy_level: 'low',
        status: 'completed',
        created_at: demoDate(-4),
        user_id: 'demo-user',
        tags: ['planning'],
        is_recurring: false,
    },
];

const createDemoNotifications = (): Notification[] => [
    {
        id: 'demo-notif-1',
        type: 'deadline',
        title: 'Math assignment due tomorrow',
        message: 'Your algebra assignment is coming up soon.',
        read: false,
        created_at: demoDate(-1),
    },
    {
        id: 'demo-notif-2',
        type: 'reminder',
        title: 'Time to review your tasks',
        message: 'A short review session can help you stay on track.',
        read: true,
        created_at: demoDate(-3),
    },
];

const createDemoStats = (): ProductivityStats => {
    const weekly_data = [
        { date: demoDate(-6).split('T')[0], completed: 2, created: 3 },
        { date: demoDate(-5).split('T')[0], completed: 1, created: 2 },
        { date: demoDate(-4).split('T')[0], completed: 3, created: 4 },
        { date: demoDate(-3).split('T')[0], completed: 2, created: 2 },
        { date: demoDate(-2).split('T')[0], completed: 4, created: 5 },
        { date: demoDate(-1).split('T')[0], completed: 3, created: 3 },
        { date: demoDate(0).split('T')[0], completed: 1, created: 2 },
    ];

    return {
        total_tasks: 23,
        completed_tasks: 16,
        completion_rate: 70,
        tasks_today: 4,
        hours_scheduled: 18,
        hours_free: 10,
        streak_days: 6,
        weekly_data,
        category_breakdown: [
            { category: 'academic', count: 10, completed: 7 },
            { category: 'personal', count: 7, completed: 5 },
            { category: 'work', count: 6, completed: 4 },
        ],
        priority_distribution: [
            { priority: 1, count: 4 },
            { priority: 2, count: 5 },
            { priority: 3, count: 6 },
            { priority: 4, count: 4 },
            { priority: 5, count: 4 },
        ],
    };
};

const createDemoSchedule = (): UserSchedule => ({
    date: demoDate(0).split('T')[0],
    free_slots: [
        { start: '09:00', end: '10:30' },
        { start: '14:00', end: '16:00' },
    ],
    commitments: [
        { start: '11:00', end: '12:00', title: 'Class' },
    ],
    working_hours: { start: '08:00', end: '18:00' },
});

const createDemoGroups = (): Group[] => [
    {
        id: 'demo-group-1',
        name: 'Study Buddies',
        description: 'Shared study group for coursework and exams.',
        owner_id: 'demo-user',
        member_ids: ['demo-user', 'member-1', 'member-2'],
        settings: {},
        is_active: true,
        created_at: demoDate(-7),
        updated_at: demoDate(-1),
    },
    {
        id: 'demo-group-2',
        name: 'Project Team',
        description: 'Coordinate group assignments and reviews.',
        owner_id: 'demo-user',
        member_ids: ['demo-user', 'member-3'],
        settings: {},
        is_active: true,
        created_at: demoDate(-10),
        updated_at: demoDate(-2),
    },
];

const createDemoGroupTasks = (groupId: string): GroupTask[] => [
    {
        id: `${groupId}-task-1`,
        group_id: groupId,
        task_id: 'demo-task-1',
        assigned_to: ['member-1'],
        milestone: { name: 'First draft' },
        progress: 45,
        created_at: demoDate(-2),
        updated_at: demoDate(-1),
    },
];

const createDemoRecommendations = (date: string): ScheduleRecommendation[] => {
    const tasks = createDemoTasks()
        .filter((task) => task.status !== 'completed')
        .sort((a, b) => a.priority - b.priority);

    const baseTimes = ['09:00', '11:00', '14:00', '16:00'];
    return tasks.map((task, index) => {
        const suggestedTime = `${date}T${baseTimes[index % baseTimes.length]}:00`;
        const energyMatch =
            (task.energy_level === 'high' && index === 0) ||
            (task.energy_level === 'medium' && index <= 1) ||
            task.energy_level === 'low';

        return {
            task_id: task.id,
            task,
            suggested_time: suggestedTime,
            reason: energyMatch
                ? 'Matches your estimated energy window and current priority.'
                : 'Fits into an available focus block based on task priority.',
            energy_match: energyMatch,
        };
    });
};

const createDemoPreferences = (): UserPreferences => ({
    working_hours_start: '08:00',
    working_hours_end: '18:00',
    energy_pattern: 'morning',
    theme: 'system',
    notification_preferences: {
        email: true,
        push: true,
        reminder_minutes: 30,
    },
});

type DemoModeListener = (isDemoMode: boolean) => void;

const demoModeListeners = new Set<DemoModeListener>();
let backendDemoMode = false;

const notifyDemoModeListeners = () => {
    demoModeListeners.forEach((listener) => listener(backendDemoMode));
};

const setBackendDemoMode = (isDemoMode: boolean) => {
    if (backendDemoMode === isDemoMode) {
        return;
    }
    backendDemoMode = isDemoMode;
    notifyDemoModeListeners();
};

class ApiClient {
    private token: string | null = null;
    private userId: string | null = null;
    private backendUnavailable = false;

    setToken(token: string) {
        this.token = token;
    }

    setUserId(userId: string) {
        this.userId = userId;
    }

    isDemoMode() {
        return backendDemoMode || this.backendUnavailable;
    }

    subscribeDemoMode(listener: DemoModeListener) {
        demoModeListeners.add(listener);
        listener(this.isDemoMode());
        return () => {
            demoModeListeners.delete(listener);
        };
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        if (this.userId) {
            headers['x-user-id'] = this.userId;
        }
        return headers;
    }

    private markDemoMode(isDemoMode: boolean) {
        this.backendUnavailable = isDemoMode;
        setBackendDemoMode(isDemoMode);
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
        });

        if (response.headers.get('x-demo-mode') === 'true') {
            this.markDemoMode(true);
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
            throw new Error(error.detail || 'API request failed');
        }

        return response.json();
    }

    private async requestWithFallback<T>(
        endpoint: string,
        fallback: () => T,
        options: RequestInit = {}
    ): Promise<T> {
        if (this.backendUnavailable) {
            return fallback();
        }

        try {
            return await this.request<T>(endpoint, options);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const isNetworkError =
                err instanceof TypeError ||
                (err instanceof Error && /fetch|network|connection/i.test(err.message));
            const shouldFallback =
                isNetworkError ||
                /not found|404|service unavailable|failed to fetch/i.test(message);
            if (shouldFallback) {
                this.markDemoMode(true);
                return fallback();
            }
            throw err;
        }
    }

    // Task operations
    async createTask(task: Partial<Task>): Promise<Task> {
        return this.request<Task>('/tasks', {
            method: 'POST',
            body: JSON.stringify(task),
        });
    }

    async getTasks(filters?: TaskFilters): Promise<Task[]> {
        const params = new URLSearchParams();
        if (filters) {
            if (filters.status) params.append('status', filters.status);
            if (filters.category) params.append('category', filters.category);
            if (filters.priority) params.append('priority', filters.priority.toString());
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            if (filters.search) params.append('search', filters.search);
        }
        const queryString = params.toString();
        return this.requestWithFallback<Task[]>(
            `/tasks${queryString ? `?${queryString}` : ''}`,
            () => createDemoTasks()
        );
    }

    async getTask(id: string): Promise<Task> {
        return this.request<Task>(`/tasks/${id}`);
    }

    async updateTask(id: string, data: Partial<Task>): Promise<Task> {
        return this.request<Task>(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteTask(id: string): Promise<void> {
        await this.request(`/tasks/${id}`, {
            method: 'DELETE',
        });
    }

    async updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
        return this.updateTask(id, { status });
    }

    // Schedule operations
    async getSchedule(date: string): Promise<UserSchedule> {
        return this.requestWithFallback<UserSchedule>(`/schedule/${date}`, () => createDemoSchedule());
    }

    async updateSchedule(date: string, schedule: Partial<UserSchedule>): Promise<UserSchedule> {
        return this.request<UserSchedule>(`/schedule/${date}`, {
            method: 'PUT',
            body: JSON.stringify(schedule),
        });
    }

    async optimizeSchedule(date: string): Promise<ScheduleRecommendation[]> {
        return this.requestWithFallback<ScheduleRecommendation[]>(
            `/schedule/optimize/${date}`,
            () => createDemoRecommendations(date),
            { method: 'POST' }
        );
    }

    async getWorkingHours(): Promise<{ start: string; end: string }> {
        return this.requestWithFallback<{ start: string; end: string }>('/schedule/working-hours', () => createDemoSchedule().working_hours);
    }

    async updateWorkingHours(workingHours: { start: string; end: string }): Promise<void> {
        await this.request('/schedule/working-hours', {
            method: 'PUT',
            body: JSON.stringify(workingHours),
        });
    }

    async addCommitment(date: string, commitment: { title: string; start: string; end: string }): Promise<UserSchedule> {
        return this.request<UserSchedule>(`/schedule/${date}/commitments`, {
            method: 'POST',
            body: JSON.stringify(commitment),
        });
    }

    async removeCommitment(date: string, commitmentTitle: string): Promise<UserSchedule> {
        return this.request<UserSchedule>(`/schedule/${date}/commitments/${encodeURIComponent(commitmentTitle)}`, {
            method: 'DELETE',
        });
    }

    // Notification operations
    async getNotifications(): Promise<Notification[]> {
        return this.requestWithFallback<Notification[]>('/notifications', () => createDemoNotifications());
    }

    async markNotificationRead(id: string): Promise<void> {
        await this.request(`/notifications/${id}/read`, {
            method: 'PUT',
        });
    }

    async markAllNotificationsRead(): Promise<void> {
        await this.request('/notifications/read-all', {
            method: 'PUT',
        });
    }

    async getUnreadCount(): Promise<{ count: number }> {
        return this.requestWithFallback<{ count: number }>('/notifications/unread-count', () => ({
            count: createDemoNotifications().filter((notification) => !notification.read).length,
        }));
    }

    // Analytics operations
    async getProductivityStats(): Promise<ProductivityStats> {
        return this.requestWithFallback<ProductivityStats>('/analytics/stats', () => createDemoStats());
    }

    async getWeeklyProductivity(): Promise<{ date: string; completed: number; created: number }[]> {
        return this.requestWithFallback<{ date: string; completed: number; created: number }[]>('/analytics/weekly', () => createDemoStats().weekly_data);
    }

    async getCategoryBreakdown(): Promise<{ category: string; count: number; completed: number }[]> {
        return this.requestWithFallback<{ category: string; count: number; completed: number }[]>('/analytics/categories', () => createDemoStats().category_breakdown);
    }

    async getStreak(): Promise<{ current: number; longest: number }> {
        return this.requestWithFallback<{ current: number; longest: number }>('/analytics/streak', () => ({
            current: createDemoStats().streak_days,
            longest: Math.max(createDemoStats().streak_days, 12),
        }));
    }

    // User preferences
    async getUserPreferences(): Promise<UserPreferences> {
        return this.requestWithFallback<UserPreferences>('/users/preferences', () => createDemoPreferences());
    }

    async updateUserPreferences(preferences: Partial<UserPreferences> & { email?: string }): Promise<UserPreferences> {
        return this.request<UserPreferences>('/users/preferences', {
            method: 'PUT',
            body: JSON.stringify(preferences),
        });
    }

    // Google Calendar integration
    async getGoogleCalendarAuthUrl(redirectUri: string): Promise<{ auth_url: string; redirect_uri: string; scopes: string[] }> {
        const params = new URLSearchParams({ redirect_uri: redirectUri });
        return this.request<{ auth_url: string; redirect_uri: string; scopes: string[] }>(`/google/calendar/auth-url?${params.toString()}`);
    }

    async connectGoogleCalendar(code: string, redirectUri: string): Promise<{ message: string; connected: boolean }> {
        return this.request<{ message: string; connected: boolean }>('/google/calendar/callback', {
            method: 'POST',
            body: JSON.stringify({ code, redirect_uri: redirectUri }),
        });
    }

    async getGoogleCalendarStatus(): Promise<{ connected: boolean; scope?: string; expires_at?: string; connected_at?: string; timezone?: string }> {
        return this.request<{ connected: boolean; scope?: string; expires_at?: string; connected_at?: string; timezone?: string }>('/google/calendar/status');
    }

    async disconnectGoogleCalendar(): Promise<{ message: string; connected: boolean }> {
        return this.request<{ message: string; connected: boolean }>('/google/calendar/disconnect', {
            method: 'DELETE',
        });
    }

    async syncGoogleCalendar(date?: string): Promise<{ message: string; date: string; synced: number; skipped: number; events: { task_id?: string; event_id?: string; html_link?: string; summary?: string }[] }> {
        return this.request<{ message: string; date: string; synced: number; skipped: number; events: { task_id?: string; event_id?: string; html_link?: string; summary?: string }[] }>('/google/calendar/sync', {
            method: 'POST',
            body: JSON.stringify({ date }),
        });
    }

    // AI Suggestions
    async getProductivityTips(): Promise<{ tip: string; category: string }[]> {
        return this.requestWithFallback<{ tip: string; category: string }[]>('/ai/tips', () => ([
            { tip: 'Break large tasks into 25-minute focus blocks.', category: 'focus' },
            { tip: 'Batch similar tasks to reduce context switching.', category: 'planning' },
        ]));
    }

    async getTaskSuggestions(): Promise<{ task_id: string; suggestion: string; priority: number }[]> {
        return this.requestWithFallback<{ task_id: string; suggestion: string; priority: number }[]>('/ai/task-suggestions', () => ([
            { task_id: 'demo-task-1', suggestion: 'Start with the most difficult problem first.', priority: 1 },
            { task_id: 'demo-task-2', suggestion: 'Group these notes into three summary bullets.', priority: 2 },
        ]));
    }

    async generateReminders(): Promise<{ reminders_created: number; message: string }> {
        return this.requestWithFallback<{ reminders_created: number; message: string }>(
            '/notifications/generate-reminders',
            () => ({
                reminders_created: 1,
                message: 'Demo reminders are ready while the backend is offline.',
            }),
            { method: 'POST' }
        );
    }

    async getPrioritizedTasks(): Promise<Task[]> {
        return this.requestWithFallback<Task[]>('/tasks/prioritized', () => createDemoTasks());
    }

    async getAIInsights(): Promise<string[]> {
        return this.requestWithFallback<string[]>('/evaluation/insights', () => ([
            'You are most productive earlier in the day.',
            'Short focus blocks improve completion rates.',
            'Leave a small buffer between demanding tasks.',
        ]));
    }

    async searchUsers(query: string): Promise<{ id: string; user_id: string; email: string; display_name?: string | null; timezone?: string }[]> {
        const params = new URLSearchParams({ query });
        return this.requestWithFallback<{ id: string; user_id: string; email: string; display_name?: string | null; timezone?: string }[]>(
            `/users/search?${params.toString()}`,
            () => {
                const value = query.trim();
                if (!value) return [];
                return [
                    {
                        id: 'demo-user-1',
                        user_id: value.includes('@') ? value : 'demo-user-1',
                        email: value.includes('@') ? value : `${value.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                        display_name: value.includes('@') ? value.split('@')[0] : value,
                        timezone: 'Africa/Lagos',
                    },
                ];
            }
        );
    }

    // Group collaboration
    async getGroups(): Promise<Group[]> {
        return this.requestWithFallback<Group[]>('/groups', () => createDemoGroups());
    }

    async createGroup(data: { name: string; description?: string; member_ids?: string[]; settings?: Record<string, unknown> }): Promise<Group> {
        return this.request<Group>('/groups', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getGroup(groupId: string): Promise<{ group: Group; tasks: GroupTask[] }> {
        return this.requestWithFallback<{ group: Group; tasks: GroupTask[] }>(`/groups/${groupId}`, () => {
            const groups = createDemoGroups();
            const group = groups.find((item) => item.id === groupId) || groups[0];
            return {
                group,
                tasks: createDemoGroupTasks(group.id),
            };
        });
    }

    async updateGroup(groupId: string, data: Partial<{ name: string; description: string; member_ids: string[]; settings: Record<string, unknown>; is_active: boolean }>): Promise<Group> {
        return this.request<Group>(`/groups/${groupId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteGroup(groupId: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/groups/${groupId}`, {
            method: 'DELETE',
        });
    }

    async addGroupMember(groupId: string, userId: string): Promise<Group> {
        return this.request<Group>(`/groups/${groupId}/members`, {
            method: 'POST',
            body: JSON.stringify({ user_id: userId }),
        });
    }

    async removeGroupMember(groupId: string, memberId: string): Promise<Group> {
        return this.request<Group>(`/groups/${groupId}/members/${encodeURIComponent(memberId)}`, {
            method: 'DELETE',
        });
    }

    async getGroupTasks(groupId: string): Promise<GroupTask[]> {
        return this.requestWithFallback<GroupTask[]>(`/groups/${groupId}/tasks`, () => createDemoGroupTasks(groupId));
    }

    async addGroupTask(groupId: string, taskId: string, assignedTo: string[] = [], milestone: Record<string, unknown> = {}, progress = 0): Promise<GroupTask> {
        return this.request<GroupTask>(`/groups/${groupId}/tasks`, {
            method: 'POST',
            body: JSON.stringify({ task_id: taskId, assigned_to: assignedTo, milestone, progress }),
        });
    }
}

export const apiClient = new ApiClient();
export default apiClient;
