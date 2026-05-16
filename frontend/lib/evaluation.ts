// Evaluation API Client for Student Task Management System
import {
    UserSurvey,
    EffectivenessReport,
    ProductivityTrend,
    BalanceScore,
    DailyCheckIn,
    ExportOptions,
    SuccessStory
} from '@/types/evaluation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const demoReport: EffectivenessReport = {
    period: 'weekly',
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date().toISOString(),
    total_tasks: 25,
    completed_tasks: 18,
    completion_rate: 0.72,
    average_time_estimate_vs_actual: 1.2,
    productivity_score: 78,
    stress_reduction_score: 65,
    balance_improvement_score: 72,
    recommendations: [
        'Break larger tasks into smaller milestones',
        'Reserve a small buffer between deep work blocks',
    ],
};

const demoBalance: BalanceScore = {
    academic: 45,
    personal: 30,
    work: 25,
    overall: 75,
};

const demoInsights = [
    'You are most productive earlier in the day.',
    'Short focus blocks improve completion rates.',
    'Leave a small buffer between demanding tasks.',
];

const demoQuickStats = {
    total_tasks_completed: 18,
    average_tasks_per_day: 3,
    best_productivity_day: 'Tuesday',
    streak: 6,
};

const isNetworkError = (err: unknown) =>
    err instanceof TypeError ||
    (err instanceof Error && /fetch|network|connection/i.test(err.message));

const requestJson = async <T>(path: string, init: RequestInit, fallback: () => T): Promise<T> => {
    try {
        const response = await fetch(`${API_BASE}${path}`, {
            ...init,
            headers: {
                ...getAuthHeaders(),
                ...init.headers,
            },
        });

        if (!response.ok) {
            throw new Error('request failed');
        }

        return response.json();
    } catch (err) {
        if (isNetworkError(err)) {
            return fallback();
        }
        throw err;
    }
};

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
    await requestJson('/evaluation/feedback', {
        method: 'POST',
        body: JSON.stringify({ rating, category, comment }),
    }, () => ({ ok: true, rating, category, comment }));
};

// Log usability metric
export const logUsabilityMetric = async (
    metricType: string,
    value: number
): Promise<void> => {
    await requestJson('/evaluation/metric', {
        method: 'POST',
        body: JSON.stringify({ metric_type: metricType, value }),
    }, () => ({ ok: true, metricType, value }));
};

// Submit survey responses
export const submitSurvey = async (
    answers: Record<string, number | string>
): Promise<UserSurvey> => {
    return requestJson('/evaluation/survey', {
        method: 'POST',
        body: JSON.stringify({ answers }),
    }, () => ({
        id: 'demo-survey',
        user_id: 'demo-user',
        questions: Object.entries(answers).map(([question, answer]) => ({ question, answer })),
        completed_at: new Date().toISOString(),
    }));
};

// Get effectiveness report
export const getEffectivenessReport = async (
    period: 'weekly' | 'monthly'
): Promise<EffectivenessReport> => {
    return requestJson(`/evaluation/report/${period}`, {
        method: 'GET',
    }, () => ({ ...demoReport, period }));
};

// Get productivity trend
export const getProductivityTrend = async (
    days: number
): Promise<ProductivityTrend[]> => {
    return requestJson(`/evaluation/trends/productivity?days=${days}`, { method: 'GET' }, () => (
        Array.from({ length: days }, (_, index) => ({
            date: new Date(Date.now() - (days - index - 1) * 24 * 60 * 60 * 1000).toISOString(),
            score: 60 + index,
        }))
    ));
};

// Get balance score
export const getBalanceScore = async (): Promise<BalanceScore> => {
    return requestJson('/evaluation/balance', { method: 'GET' }, () => demoBalance);
};

// Submit daily check-in
export const submitDailyCheckIn = async (
    checkIn: Omit<DailyCheckIn, 'date'>
): Promise<void> => {
    await requestJson('/evaluation/daily-checkin', {
        method: 'POST',
        body: JSON.stringify({
            ...checkIn,
            date: new Date().toISOString().split('T')[0],
        }),
    }, () => ({ ok: true, ...checkIn }));
};

// Get daily check-in history
export const getDailyCheckInHistory = async (
    days: number = 7
): Promise<DailyCheckIn[]> => {
    return requestJson(`/evaluation/daily-checkin?days=${days}`, { method: 'GET' }, () => (
        Array.from({ length: days }, (_, index) => ({
            mood: '😊',
            energy_level: 7,
            stress_level: 4,
            productivity_rating: 7,
            notes: index % 2 === 0 ? 'Solid focus block' : 'A little distracted',
            date: new Date(Date.now() - (days - index - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }))
    ));
};

// Get stress reduction trend
export const getStressTrend = async (
    days: number
): Promise<ProductivityTrend[]> => {
    return requestJson(`/evaluation/trends/stress?days=${days}`, { method: 'GET' }, () => (
        Array.from({ length: days }, (_, index) => ({
            date: new Date(Date.now() - (days - index - 1) * 24 * 60 * 60 * 1000).toISOString(),
            score: 50 + index,
        }))
    ));
};

// Get completion rate trend
export const getCompletionRateTrend = async (
    days: number
): Promise<ProductivityTrend[]> => {
    return requestJson(`/evaluation/trends/completion?days=${days}`, { method: 'GET' }, () => (
        Array.from({ length: days }, (_, index) => ({
            date: new Date(Date.now() - (days - index - 1) * 24 * 60 * 60 * 1000).toISOString(),
            score: 55 + index,
        }))
    ));
};

// Get time accuracy trend
export const getTimeAccuracyTrend = async (
    days: number
): Promise<ProductivityTrend[]> => {
    return requestJson(`/evaluation/trends/time-accuracy?days=${days}`, { method: 'GET' }, () => (
        Array.from({ length: days }, (_, index) => ({
            date: new Date(Date.now() - (days - index - 1) * 24 * 60 * 60 * 1000).toISOString(),
            score: 58 + index,
        }))
    ));
};

// Export research data
export const exportResearchData = async (
    options: ExportOptions
): Promise<Blob> => {
    try {
        const response = await fetch(`${API_BASE}/evaluation/export`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(options),
        });

        if (!response.ok) {
            throw new Error('Failed to export research data');
        }

        return response.blob();
    } catch (err) {
        if (isNetworkError(err)) {
            return new Blob([JSON.stringify({ exported: false, options }, null, 2)], { type: 'application/json' });
        }
        throw err;
    }
};

// Get success stories
export const getSuccessStories = async (): Promise<SuccessStory[]> => {
    return requestJson('/evaluation/stories', { method: 'GET' }, () => []);
};

// Submit success story
export const submitSuccessStory = async (
    story: Omit<SuccessStory, 'id' | 'user_id' | 'anonymous_id' | 'created_at'>
): Promise<SuccessStory> => {
    return requestJson('/evaluation/stories', {
        method: 'POST',
        body: JSON.stringify(story),
    }, () => ({
        id: 'demo-story',
        user_id: 'demo-user',
        anonymous_id: 'demo-anon',
        story: story.story,
        productivity_before: story.productivity_before,
        productivity_after: story.productivity_after,
        tips: story.tips,
        created_at: new Date().toISOString(),
    }));
};

// Get AI insights
export const getAIInsights = async (): Promise<string[]> => {
    return requestJson('/evaluation/insights', { method: 'GET' }, () => demoInsights);
};

// Get quick stats
export const getQuickStats = async (): Promise<{
    total_tasks_completed: number;
    average_tasks_per_day: number;
    best_productivity_day: string;
    streak: number;
}> => {
    return requestJson('/evaluation/stats/quick', { method: 'GET' }, () => demoQuickStats);
};
