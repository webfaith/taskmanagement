export type TaskCategory = 'academic' | 'personal' | 'work';
export type TaskPriority = 1 | 2 | 3 | 4 | 5; // 1=highest priority
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type EnergyLevel = 'high' | 'medium' | 'low';

export interface Task {
    id: string;
    title: string;
    description?: string;
    category: TaskCategory;
    priority: TaskPriority;
    deadline: string;
    estimated_hours: number;
    energy_level: EnergyLevel;
    status: TaskStatus;
    created_at: string;
    user_id: string;
    tags: string[];
    is_recurring: boolean;
    recurring_rule?: string;
    scheduled_time?: string;
    priority_reason?: string;
}

export interface TaskFilters {
    status?: TaskStatus;
    category?: TaskCategory;
    priority?: TaskPriority;
    date_from?: string;
    date_to?: string;
    search?: string;
}

export interface UserSchedule {
    date: string;
    free_slots: { start: string; end: string }[];
    commitments: { start: string; end: string; title: string }[];
    working_hours: { start: string; end: string };
}

export interface Notification {
    id: string;
    type: 'deadline' | 'reminder' | 'progress' | 'system';
    title: string;
    message: string;
    read: boolean;
    created_at: string;
}

export interface ScheduleRecommendation {
    task_id: string;
    task: Task;
    suggested_time: string;
    reason: string;
    energy_match: boolean;
}

export interface Group {
    id: string;
    name: string;
    description?: string | null;
    owner_id: string;
    member_ids: string[];
    settings: Record<string, unknown>;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface GroupTask {
    id: string;
    group_id: string;
    task_id: string;
    assigned_to: string[];
    milestone: Record<string, unknown>;
    progress: number;
    created_at?: string;
    updated_at?: string;
}

export interface GroupMessage {
    id: string;
    group_id: string;
    sender_id: string;
    message: string;
    created_at: string;
}

export interface UserPreferences {
    working_hours_start: string;
    working_hours_end: string;
    energy_pattern: 'morning' | 'afternoon' | 'evening' | 'split';
    theme?: 'light' | 'dark' | 'system';
    notification_preferences: {
        email: boolean;
        push: boolean;
        reminder_minutes: number;
    };
}

export interface ProductivityStats {
    total_tasks: number;
    completed_tasks: number;
    completion_rate: number;
    tasks_today: number;
    hours_scheduled: number;
    hours_free: number;
    streak_days: number;
    weekly_data: { date: string; completed: number; created: number }[];
    category_breakdown: { category: TaskCategory; count: number; completed: number }[];
    priority_distribution: { priority: TaskPriority; count: number }[];
}

export interface TimeSlot {
    start: string;
    end: string;
    type: 'free' | 'committed' | 'task';
    task_id?: string;
}
