import { Task, TaskFilters, UserSchedule, Notification, ScheduleRecommendation, ProductivityStats, UserPreferences } from '@/types/task';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
    private token: string | null = null;
    private userId: string | null = null;

    setToken(token: string) {
        this.token = token;
    }

    setUserId(userId: string) {
        this.userId = userId;
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

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
            throw new Error(error.detail || 'API request failed');
        }

        return response.json();
    }

    // Task operations
    async createTask(task: Partial<Task>): Promise<Task> {
        return this.request<Task>('/tasks/', {
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
        return this.request<Task[]>(`/tasks/${queryString ? `?${queryString}` : ''}`);
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
        return this.request<UserSchedule>(`/schedule/${date}`);
    }

    async updateSchedule(date: string, schedule: Partial<UserSchedule>): Promise<UserSchedule> {
        return this.request<UserSchedule>(`/schedule/${date}`, {
            method: 'PUT',
            body: JSON.stringify(schedule),
        });
    }

    async optimizeSchedule(date: string): Promise<ScheduleRecommendation[]> {
        return this.request<ScheduleRecommendation[]>(`/schedule/optimize/${date}`, {
            method: 'POST',
        });
    }

    async getWorkingHours(): Promise<{ start: string; end: string }> {
        return this.request<{ start: string; end: string }>('/schedule/working-hours');
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
        return this.request<Notification[]>('/notifications/');
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
        return this.request<{ count: number }>('/notifications/unread-count');
    }

    // Analytics operations
    async getProductivityStats(): Promise<ProductivityStats> {
        return this.request<ProductivityStats>('/analytics/stats');
    }

    async getWeeklyProductivity(): Promise<{ date: string; completed: number; created: number }[]> {
        return this.request<{ date: string; completed: number; created: number }[]>('/analytics/weekly');
    }

    async getCategoryBreakdown(): Promise<{ category: string; count: number; completed: number }[]> {
        return this.request<{ category: string; count: number; completed: number }[]>('/analytics/categories');
    }

    async getStreak(): Promise<{ current: number; longest: number }> {
        return this.request<{ current: number; longest: number }>('/analytics/streak');
    }

    // User preferences
    async getUserPreferences(): Promise<UserPreferences> {
        return this.request<UserPreferences>('/users/preferences');
    }

    async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
        return this.request<UserPreferences>('/users/preferences', {
            method: 'PUT',
            body: JSON.stringify(preferences),
        });
    }

    // AI Suggestions
    async getProductivityTips(): Promise<{ tip: string; category: string }[]> {
        return this.request<{ tip: string; category: string }[]>('/ai/tips');
    }

    async getTaskSuggestions(): Promise<{ task_id: string; suggestion: string; priority: number }[]> {
        return this.request<{ task_id: string; suggestion: string; priority: number }[]>('/ai/task-suggestions');
    }
}

export const apiClient = new ApiClient();
export default apiClient;
