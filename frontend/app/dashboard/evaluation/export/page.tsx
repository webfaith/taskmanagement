// Research Export Page
'use client';

import { useState } from 'react';
import { exportResearchData, getEffectivenessReport } from '@/lib/evaluation';
import { ExportOptions, EffectivenessReport } from '@/types/evaluation';

export default function ResearchExportPage() {
    const [format, setFormat] = useState<'csv' | 'json' | 'pdf'>('json');
    const [includeTasks, setIncludeTasks] = useState(true);
    const [includeMetrics, setIncludeMetrics] = useState(true);
    const [includeFeedback, setIncludeFeedback] = useState(true);
    const [includeSurveys, setIncludeSurveys] = useState(true);
    const [anonymize, setAnonymize] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [preview, setPreview] = useState<EffectivenessReport | null>(null);

    // Fetch preview data
    const loadPreview = async () => {
        try {
            const report = await getEffectivenessReport('weekly');
            setPreview(report);
        } catch (error) {
            console.error('Failed to load preview:', error);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const options: ExportOptions = {
                format,
                include_tasks: includeTasks,
                include_metrics: includeMetrics,
                include_feedback: includeFeedback,
                include_surveys: includeSurveys,
                anonymize,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
            };

            const blob = await exportResearchData(options);

            // Download the file
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `research-data-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export data:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Research Data Export</h1>
                <p className="text-gray-500">Export anonymized data for research purposes</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Export Options */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Export Settings</h2>

                    {/* Format Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['csv', 'json', 'pdf'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFormat(f)}
                                    className={`py-2 px-4 rounded-lg font-medium transition-colors ${format === f
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {f.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Data Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Include Data</label>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeTasks}
                                    onChange={(e) => setIncludeTasks(e.target.checked)}
                                    className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Task completion patterns</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeMetrics}
                                    onChange={(e) => setIncludeMetrics(e.target.checked)}
                                    className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Time usage metrics</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeFeedback}
                                    onChange={(e) => setIncludeFeedback(e.target.checked)}
                                    className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">User feedback summaries</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeSurveys}
                                    onChange={(e) => setIncludeSurveys(e.target.checked)}
                                    className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Survey responses</span>
                            </label>
                        </div>
                    </div>

                    {/* Anonymization */}
                    <div className="mb-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={anonymize}
                                onChange={(e) => setAnonymize(e.target.checked)}
                                className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-gray-700">
                                <span className="font-medium">Anonymize data</span>
                                <span className="text-gray-400 block text-sm">Remove all user identifiers</span>
                            </span>
                        </label>
                    </div>

                    {/* Date Range */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range (Optional)</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        disabled={isExporting || (!includeTasks && !includeMetrics && !includeFeedback && !includeSurveys)}
                        className={`w-full py-3 rounded-xl font-medium transition-all ${isExporting || (!includeTasks && !includeMetrics && !includeFeedback && !includeSurveys)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                    >
                        {isExporting ? 'Exporting...' : 'Download Research Data'}
                    </button>
                </div>

                {/* Preview */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Data Preview</h2>
                        <button
                            onClick={loadPreview}
                            className="text-sm text-blue-500 hover:text-blue-600"
                        >
                            Refresh Preview
                        </button>
                    </div>

                    {preview ? (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-500 mb-2">Effectiveness Report Preview</p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-400">Period</p>
                                        <p className="font-medium capitalize">{preview.period}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Completion Rate</p>
                                        <p className="font-medium">{(preview.completion_rate * 100).toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Total Tasks</p>
                                        <p className="font-medium">{preview.total_tasks}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Completed</p>
                                        <p className="font-medium">{preview.completed_tasks}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 rounded-xl p-4">
                                <h3 className="font-medium text-blue-800 mb-2">Included Data Summary</h3>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    {includeTasks && <li>• {preview.total_tasks} task records</li>}
                                    {includeMetrics && <li>• Time usage metrics</li>}
                                    {includeFeedback && <li>• User feedback entries</li>}
                                    {includeSurveys && <li>• Survey responses</li>}
                                </ul>
                            </div>

                            {anonymize && (
                                <div className="bg-yellow-50 rounded-xl p-4">
                                    <p className="text-sm text-yellow-700">
                                        🔒 All user identifiers will be replaced with anonymous IDs
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <p>Click "Refresh Preview" to see a sample of your data</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
