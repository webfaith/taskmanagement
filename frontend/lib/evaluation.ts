// Evaluation API Client for Student Task Management System
import {
    UserFeedback,
    UsabilityMetric,
    UserSurvey,
    EffectivenessReport,
    ProductivityTrend,
    BalanceScore,
    DailyCheckIn,
    ExportOptions,
    SuccessStory
} from '@/types/evaluation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(userId ? { 'x-user-id': userId } : {}),
    };
};

// Submit user feedback
export const submitFeedback = async (
    rating: number,
    category: string,
    comment?: string
): Promise<void> => {
    const response = await fetch(`${API_BASE}/evaluation/feedback`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rating, category, comment }),
    });

    if (!response.ok) {
        throw new Error('Failed to submit feedback');
    }
};

// Log usability metric
export const logUsabilityMetric = async (
    metricType: string,
    value: number
): Promise<void> => {
    const response = await fetch(`${API_BASE}/evaluation/metric`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ metric_type: metricType, value }),
    });

    if (!response.ok) {
        throw new Error('Failed to log metric');
    }
};

// Submit survey responses
export const submitSurvey = async (
    answers: Record<string, number | string>
): Promise<UserSurvey> => {
    const response = await fetch(`${API_BASE}/evaluation/survey`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ answers }),
    });

    if (!response.ok) {
        throw new Error('Failed to submit survey');
    }

    return response.json();
};

// Get effectiveness report
export const getEffectivenessReport = async (
    period: 'weekly' | 'monthly'
): Promise<EffectivenessReport> => {
    const response = await fetch(`${API_BASE}/evaluation/report/${period}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to get effectiveness report');
    }

    return response.json();
};

// Get productivity trend
export const getProductivityTrend = async (
    days: number
): Promise<ProductivityTrend[]> => {
    const response = await fetch(`${API_BASE}/evaluation/trends/productivity?days=${days}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to get productivity trend');
    }

    return response.json();
};

// Get balance score
export const getBalanceScore = async (): Promise<BalanceScore> => {
    const response = await fetch(`${API_BASE}/evaluation/balance`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to get balance score');
    }

    return response.json();
};

// Submit daily check-in
export const submitDailyCheckIn = async (
    checkIn: Omit<DailyCheckIn, 'date'>
): Promise<void> => {
    const response = await fetch(`${API_BASE}/evaluation/daily-checkin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            ...checkIn,
            date: new Date().toISOString().split('T')[0],
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to submit daily check-in');
    }
};

// Get daily check-in history
export const getDailyCheckInHistory = async (
    days: number = 7
): Promise<DailyCheckIn[]> => {
    const response = await fetch(`${API_BASE}/evaluation/daily-checkin?days=${days}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to get daily check-in history');
    }

    return response.json();
};

// Get stress reduction trend
export const getStressTrend = async (
    days: number
): Promise<ProductivityTrend[]> => {
    const response = await fetch(`${API_BASE}/evaluation/trends/stress?days=${days}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to get stress trend');
    }

    return response.json();
};

// Get completion rate trend
export const getCompletionRateTrend = async (
    days: number
): Promise<ProductivityTrend[]> => {
    const response = await fetch(`${API_BASE}/evaluation/trends/completion?days=${days}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to get completion rate trend');
    }

    return response.json();
};

// Get time accuracy trend
export const getTimeAccuracyTrend = async (
    days: number
): Promise<ProductivityTrend[]> => {
    const response = await fetch(`${API_BASE}/evaluation/trends/time-accuracy?days=${days}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to get time accuracy trend');
    }

    return response.json();
};

// Export research data
export const exportResearchData = async (
    options: ExportOptions
): Promise<Blob> => {
    const response = await fetch(`${API_BASE}/evaluation/export`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(options),
    });

    if (!response.ok) {
        throw new Error('Failed to export research data');
    }

    return response.blob();
};

// Get success stories
export const getSuccessStories = async (): Promise<SuccessStory[]> => {
    const response = await fetch(`${API_BASE}/evaluation/stories`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to get success stories');
    }

    return response.json();
};

// Submit success story
export const submitSuccessStory = async (
    story: Omit<SuccessStory, 'id' | 'user_id' | 'anonymous_id' | 'created_at'>
): Promise<SuccessStory> => {
    const response = await fetch(`${API_BASE}/evaluation/stories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(story),
    });

    if (!response.ok) {
        throw new Error('Failed to submit success story');
    }

    return response.json();
};

// Get AI insights
export const getAIInsights = async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE}/evaluation/insights`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to get AI insights');
    }

    return response.json();
};

// Get quick stats
export const getQuickStats = async (): Promise<{
    total_tasks_completed: number;
    average_tasks_per_day: number;
    best_productivity_day: string;
    streak: number;
}> => {
    const response = await fetch(`${API_BASE}/evaluation/stats/quick`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to get quick stats');
    }

    return response.json();
};
