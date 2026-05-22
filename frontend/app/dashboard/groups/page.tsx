"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
import { Group, GroupTask, Task, GroupMessage } from "@/types/task";
import NotificationsPanel from "@/components/NotificationsPanel";
import Link from "next/link";

const UserSearchInput = ({ 
    value, 
    onChange, 
    placeholder,
    className 
}: { 
    value: string; 
    onChange: (val: string) => void; 
    placeholder?: string;
    className?: string;
}) => {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    
    const currentTerm = useMemo(() => {
        const parts = value.split(',');
        return parts[parts.length - 1].trim();
    }, [value]);

    useEffect(() => {
        if (!currentTerm || currentTerm.length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }
        
        const delayDebounceFn = setTimeout(async () => {
            try {
                const results = await apiClient.searchUsers(currentTerm);
                setSuggestions(results);
                setIsOpen(results.length > 0);
            } catch (err) {
                console.error("Search failed", err);
            }
        }, 300);
        
        return () => clearTimeout(delayDebounceFn);
    }, [currentTerm]);

    const handleSelect = (user: any) => {
        const parts = value.split(',');
        parts.pop();
        const newStr = parts.length > 0 ? parts.join(', ') + ', ' + user.email : user.email;
        onChange(newStr + (placeholder?.includes('comma') ? ', ' : ''));
        setIsOpen(false);
    };

    return (
        <div className="relative w-full">
            <input
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setIsOpen(true);
                }}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                placeholder={placeholder}
                className={className}
            />
            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                    {suggestions.map((u) => (
                        <div 
                            key={u.id} 
                            onClick={() => handleSelect(u)}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col"
                        >
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {u.display_name || 'Unnamed'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {u.email}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function GroupsPage() {
    const { user } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>("");
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [groupTasks, setGroupTasks] = useState<GroupTask[]>([]);
    const [memberDirectory, setMemberDirectory] = useState<Record<string, { email: string; display_name?: string | null }>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: "", description: "", memberIds: "" });
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [taskId, setTaskId] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [chatMessages, setChatMessages] = useState<GroupMessage[]>([]);
    const [chatInput, setChatInput] = useState("");

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [groupData, taskData] = await Promise.all([
                apiClient.getGroups(),
                apiClient.getTasks(),
            ]);
            setGroups(groupData);
            setTasks(taskData);
            if (!selectedGroupId && groupData.length > 0) {
                setSelectedGroupId(groupData[0].id);
            }
        } catch (err) {
            console.error("Failed to load groups:", err);
        } finally {
            setLoading(false);
        }
    }, [selectedGroupId]);

    const loadSelectedGroup = async (groupId: string) => {
        try {
            const data = await apiClient.getGroup(groupId);
            setSelectedGroup(data.group);
            setGroupTasks(data.tasks);
            const msgs = await apiClient.getGroupMessages(groupId);
            setChatMessages(msgs);
            const ids = Array.from(new Set([data.group.owner_id, ...data.group.member_ids]));
            const directoryEntries = await Promise.all(
                ids.map(async (id) => {
                    try {
                        const matches = await apiClient.searchUsers(id);
                        const match = matches[0];
                        return match ? [id, { email: match.email, display_name: match.display_name }] : null;
                    } catch {
                        return null;
                    }
                })
            );
            const directory = Object.fromEntries(directoryEntries.filter(Boolean) as [string, { email: string; display_name?: string | null }][]);
            setMemberDirectory(directory);
        } catch (err) {
            console.error("Failed to load group details:", err);
        }
    };

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, loadData]);

    useEffect(() => {
        if (selectedGroupId) {
            loadSelectedGroup(selectedGroupId);
        } else {
            setSelectedGroup(null);
            setGroupTasks([]);
        }
    }, [selectedGroupId]);

    useEffect(() => {
        if (!selectedGroupId) return;
        const interval = setInterval(async () => {
            try {
                const msgs = await apiClient.getGroupMessages(selectedGroupId);
                setChatMessages(msgs);
            } catch (err) {
                console.error("Poll failed:", err);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [selectedGroupId]);

    const titleByTaskId = useMemo(() => {
        return new Map(tasks.map((task) => [task.id, task.title]));
    }, [tasks]);

    const resolveUserIds = async (entries: string[]) => {
        const resolved: string[] = [];
        for (const entry of entries) {
            const value = entry.trim();
            if (!value) continue;
            try {
                const matches = await apiClient.searchUsers(value);
                const first = matches[0];
                resolved.push(first?.user_id || value);
            } catch {
                resolved.push(value);
            }
        }
        return Array.from(new Set(resolved));
    };

    const handleCreateGroup = async () => {
        if (!newGroup.name.trim()) return;
        try {
            setCreating(true);
            const member_ids = await resolveUserIds(newGroup.memberIds
                .split(",")
                .map((member) => member.trim())
                .filter(Boolean));
            const created = await apiClient.createGroup({
                name: newGroup.name.trim(),
                description: newGroup.description.trim() || undefined,
                member_ids,
                settings: {},
            });
            setNewGroup({ name: "", description: "", memberIds: "" });
            await loadData();
            setSelectedGroupId(created.id);
        } catch (err) {
            console.error("Failed to create group:", err);
        } finally {
            setCreating(false);
        }
    };

    const handleAddMember = async () => {
        if (!selectedGroupId || !newMemberEmail.trim()) return;
        try {
            setSaving(true);
            const resolved = await resolveUserIds([newMemberEmail.trim()]);
            await apiClient.addGroupMember(selectedGroupId, resolved[0] || newMemberEmail.trim());
            setNewMemberEmail("");
            await loadSelectedGroup(selectedGroupId);
            await loadData();
        } catch (err) {
            console.error("Failed to add member:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!selectedGroupId) return;
        try {
            setSaving(true);
            await apiClient.removeGroupMember(selectedGroupId, memberId);
            await loadSelectedGroup(selectedGroupId);
            await loadData();
        } catch (err) {
            console.error("Failed to remove member:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleAddTask = async () => {
        if (!selectedGroupId || !taskId.trim()) return;
        try {
            setSaving(true);
            const assigned = await resolveUserIds(assignedTo
                .split(",")
                .map((member) => member.trim())
                .filter(Boolean));
            await apiClient.addGroupTask(selectedGroupId, taskId.trim(), assigned, {}, 0);
            setTaskId("");
            setAssignedTo("");
            await loadSelectedGroup(selectedGroupId);
        } catch (err) {
            console.error("Failed to add group task:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !selectedGroupId) return;
        try {
            const msg = await apiClient.sendGroupMessage(selectedGroupId, chatInput);
            setChatMessages((prev) => [...prev, msg]);
            setChatInput("");
        } catch (err) {
            console.error("Failed to send message:", err);
            alert("Failed to send message.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-2 inline-block">
                                ← Back to Dashboard
                            </Link>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">👥 Groups</h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Create shared study groups and assign tasks together
                            </p>
                        </div>
                        <NotificationsPanel />
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Group</h3>
                            <div className="space-y-3">
                                <input
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                    placeholder="Group name"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <textarea
                                    value={newGroup.description}
                                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                                    placeholder="Description"
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <UserSearchInput
                                    value={newGroup.memberIds}
                                    onChange={(val) => setNewGroup({ ...newGroup, memberIds: val })}
                                    placeholder="Member emails or IDs, comma separated"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <button
                                    onClick={handleCreateGroup}
                                    disabled={creating}
                                    className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {creating ? "Creating..." : "Create Group"}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Groups</h3>
                            <div className="space-y-3">
                                {groups.length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No groups yet.</p>
                                ) : (
                                    groups.map((group) => (
                                        <button
                                            key={group.id}
                                            onClick={() => setSelectedGroupId(group.id)}
                                            className={`w-full text-left p-4 rounded-lg border transition ${
                                                selectedGroupId === group.id
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{group.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {group.member_ids.length} members
                                                    </p>
                                                </div>
                                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                    {group.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        {selectedGroup ? (
                            <>
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedGroup.name}</h3>
                                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                                {selectedGroup.description || "No description provided"}
                                            </p>
                                        </div>
                                    <div className="text-right">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Owner</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {memberDirectory[selectedGroup.owner_id]?.email || selectedGroup.owner_id}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Members</h4>
                                        <div className="space-y-2 mb-4">
                                            {selectedGroup.member_ids.length === 0 ? (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No members added.</p>
                                            ) : (
                                                selectedGroup.member_ids.map((memberId) => (
                                                    <div key={memberId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                                        <span className="text-sm text-gray-900 dark:text-white truncate">
                                                            {memberDirectory[memberId]?.email || memberId}
                                                        </span>
                                                        {memberId !== selectedGroup.owner_id && (
                                                            <button
                                                                onClick={() => handleRemoveMember(memberId)}
                                                                className="text-xs text-red-600 dark:text-red-400 hover:underline"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <UserSearchInput
                                                value={newMemberEmail}
                                                onChange={(val) => setNewMemberEmail(val)}
                                                placeholder="Add member by email or ID"
                                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full"
                                            />
                                            <button
                                                onClick={handleAddMember}
                                                disabled={saving}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assign Task</h4>
                                        <div className="space-y-3">
                                            <select
                                                value={taskId}
                                                onChange={(e) => setTaskId(e.target.value)}
                                                aria-label="Select task to assign"
                                                title="Select a task to assign to members"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            >
                                                <option value="">Select a task</option>
                                                {tasks.map((task) => (
                                                    <option key={task.id} value={task.id}>
                                                        {task.title}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                value={assignedTo}
                                                onChange={(e) => setAssignedTo(e.target.value)}
                                                placeholder="Assigned emails or IDs, comma separated"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                            <button
                                                onClick={handleAddTask}
                                                disabled={saving}
                                                className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                                            >
                                                Add Group Task
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Group Tasks</h4>
                                    <div className="space-y-3">
                                        {groupTasks.length === 0 ? (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">No tasks assigned to this group yet.</p>
                                        ) : (
                                            groupTasks.map((groupTask) => (
                                                <div key={groupTask.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {titleByTaskId.get(groupTask.task_id) || groupTask.task_id}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                Assigned to {groupTask.assigned_to.length} member(s)
                                                            </p>
                                                        </div>
                                                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                            {groupTask.progress.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Group Chat</h4>
                                    <div className="flex flex-col h-64 overflow-y-auto mb-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                                        {chatMessages.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center mt-auto mb-auto">No messages yet. Say hi!</p>
                                        ) : (
                                            chatMessages.map(msg => (
                                                <div key={msg.id} className={`flex flex-col ${msg.sender_id === user?.$id ? 'items-end' : 'items-start'}`}>
                                                    <span className="text-xs text-gray-500 mb-1">
                                                        {memberDirectory[msg.sender_id]?.display_name || msg.sender_id.substring(0, 8)}
                                                    </span>
                                                    <div className={`px-4 py-2 rounded-lg text-sm max-w-[80%] break-words ${msg.sender_id === user?.$id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-bl-none'}`}>
                                                        {msg.message}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Type a message..."
                                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!chatInput.trim()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No group selected</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">
                                    Create a group or select an existing one to manage members and tasks.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
