export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                <div className="text-center mb-8">
                    <span className="text-4xl">🎓</span>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">TaskFlow</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Smart Student Scheduler</p>
                </div>
                {children}
            </div>
        </div>
    );
}
