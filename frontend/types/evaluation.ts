// Evaluation Types for Student Task Management System

export interface UserFeedback {
    id: string;
    user_id: string;
    rating: number; // 1-5 scale
    category: 'usability' | 'effectiveness' | 'productivity' | 'stress' | 'overall';
    comment?: string;
    created_at: string;
}

export interface UsabilityMetric {
    id: string;
    user_id: string;
    metric_type: 'task_completion_rate' | 'schedule_adherence' | 'time_estimate_accuracy' | 'productivity_score';
    value: number;
    date: string;
}

export interface UserSurvey {
    id: string;
    user_id: string;
    questions: {
        question: string;
        answer: number | string;
    }[];
    completed_at: string;
}

export interface EffectivenessReport {
    period: 'weekly' | 'monthly';
    start_date: string;
    end_date: string;
    total_tasks: number;
    completed_tasks: number;
    completion_rate: number;
    average_time_estimate_vs_actual: number;
    productivity_score: number;
    stress_reduction_score: number; // based on user feedback
    balance_improvement_score: number;
    recommendations: string[];
}

export interface ProductivityTrend {
    date: string;
    score: number;
}

export interface BalanceScore {
    academic: number;
    personal: number;
    work: number;
    overall: number;
}

export interface DailyCheckIn {
    mood: '😊' | '😐' | '😓' | '😡';
    energy_level: number; // 1-10
    stress_level: number; // 1-10
    productivity_rating: number; // 1-10
    notes?: string;
    date: string;
}

export interface SurveyQuestion {
    id: string;
    question: string;
    type: 'rating' | 'text';
    min?: number;
    max?: number;
    required: boolean;
}

export const WEEKLY_SURVEY_QUESTIONS: SurveyQuestion[] = [
    {
        id: 'balance',
        question: 'How balanced did your schedule feel this week?',
        type: 'rating',
        min: 1,
        max: 10,
        required: true,
    },
    {
        id: 'overwhelmed',
        question: 'Did you feel overwhelmed with tasks?',
        type: 'rating',
        min: 1,
        max: 10,
        required: true,
    },
    {
        id: 'time_accuracy',
        question: 'How accurate were your time estimates?',
        type: 'rating',
        min: 1,
        max: 10,
        required: true,
    },
    {
        id: 'productivity_help',
        question: 'How much did the system help with productivity?',
        type: 'rating',
        min: 1,
        max: 10,
        required: true,
    },
    {
        id: 'stress_level',
        question: 'Rate your overall stress level this week',
        type: 'rating',
        min: 1,
        max: 10,
        required: true,
    },
    {
        id: 'suggestions',
        question: 'Any suggestions for improvement?',
        type: 'text',
        required: false,
    },
];

export interface SuccessStory {
    id: string;
    user_id: string;
    anonymous_id: string;
    story: string;
    productivity_before: number;
    productivity_after: number;
    tips: string[];
    created_at: string;
}

export interface ExportOptions {
    format: 'csv' | 'json' | 'pdf';
    include_tasks: boolean;
    include_metrics: boolean;
    include_feedback: boolean;
    include_surveys: boolean;
    anonymize: boolean;
    start_date?: string;
    end_date?: string;
}
