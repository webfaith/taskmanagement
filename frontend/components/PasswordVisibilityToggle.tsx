"use client";

type PasswordVisibilityToggleProps = {
    show: boolean;
    onToggle: () => void;
    label?: string;
};

export function PasswordVisibilityToggle({
    show,
    onToggle,
    label = "password",
}: PasswordVisibilityToggleProps) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label={show ? `Hide ${label}` : `Show ${label}`}
        >
            {show ? (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                >
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A2 2 0 0012 15a2 2 0 001.42-3.42" />
                    <path d="M9.88 5.08A10.42 10.42 0 0112 5c5 0 9.27 3.11 11 7-0.63 1.42-1.5 2.7-2.56 3.79" />
                    <path d="M6.61 6.61C3.94 8.25 2.2 10.65 1 12c1.73 3.89 6 7 11 7 1.59 0 3.1-.29 4.47-.82" />
                </svg>
            ) : (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            )}
        </button>
    );
}
