// Evaluation Context for managing evaluation state and auto-triggers
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { logUsabilityMetric } from '@/lib/evaluation';

interface EvaluationContextType {
    taskCompletionCount: number;
    shouldShowFeedback: boolean;
    shouldShowSurvey: boolean;
    feedbackModalOpen: boolean;
    openFeedbackModal: () => void;
    closeFeedbackModal: () => void;
    incrementTaskCompletion: () => void;
    resetTaskCount: () => void;
    checkSurveyTime: () => boolean;
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);

const SURVEY_TRIGGER_COUNT = 3;
const LAST_SURVEY_KEY = 'last_survey_date';
const SURVEY_INTERVAL_DAYS = 7;

export function EvaluationProvider({ children }: { children: ReactNode }) {
    const { user, userId } = useAuth();
    const [taskCompletionCount, setTaskCompletionCount] = useState(0);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

    // Increment task completion count and trigger feedback if needed
    const incrementTaskCompletion = async () => {
        if (!userId) return;

        const newCount = taskCompletionCount + 1;
        setTaskCompletionCount(newCount);

        // Trigger feedback after every SURVEY_TRIGGER_COUNT tasks
        if (newCount % SURVEY_TRIGGER_COUNT === 0) {
            setFeedbackModalOpen(true);
        }

        // Log productivity metric
        try {
            await logUsabilityMetric('task_completion_rate', newCount);
        } catch (error) {
            console.error('Failed to log task completion metric:', error);
        }
    };

    const resetTaskCount = () => {
        setTaskCompletionCount(0);
    };

    const openFeedbackModal = () => {
        setFeedbackModalOpen(true);
    };

    const closeFeedbackModal = () => {
        setFeedbackModalOpen(false);
    };

    // Check if it's time for weekly survey (every Sunday)
    const checkSurveyTime = (): boolean => {
        if (!userId) return false;

        const lastSurvey = localStorage.getItem(`${LAST_SURVEY_KEY}_${userId}`);
        if (!lastSurvey) return true;

        const lastSurveyDate = new Date(lastSurvey);
        const now = new Date();
        const daysSinceLastSurvey = Math.floor(
            (now.getTime() - lastSurveyDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return daysSinceLastSurvey >= SURVEY_INTERVAL_DAYS;
    };

    // Check for Sunday (day 0) for weekly survey
    const shouldShowSurvey = (): boolean => {
        if (!userId) return false;
        const today = new Date();
        const isSunday = today.getDay() === 0;
        const lastSurvey = localStorage.getItem(`${LAST_SURVEY_KEY}_${userId}`);

        if (!lastSurvey && isSunday) return true;
        if (!lastSurvey) return false;

        const lastSurveyDate = new Date(lastSurvey);
        const daysSinceLastSurvey = Math.floor(
            (today.getTime() - lastSurveyDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return isSunday && daysSinceLastSurvey >= SURVEY_INTERVAL_DAYS;
    };

    const shouldShowFeedback = taskCompletionCount > 0 && taskCompletionCount % SURVEY_TRIGGER_COUNT === 0;

    return (
        <EvaluationContext.Provider
            value={{
                taskCompletionCount,
                shouldShowFeedback,
                shouldShowSurvey: shouldShowSurvey(),
                feedbackModalOpen,
                openFeedbackModal,
                closeFeedbackModal,
                incrementTaskCompletion,
                resetTaskCount,
                checkSurveyTime,
            }}
        >
            {children}
        </EvaluationContext.Provider>
    );
}

export function useEvaluation() {
    const context = useContext(EvaluationContext);
    if (context === undefined) {
        throw new Error('useEvaluation must be used within an EvaluationProvider');
    }
    return context;
}
