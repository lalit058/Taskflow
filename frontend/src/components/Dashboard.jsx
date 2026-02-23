import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useQuery, useMutation } from '@apollo/client';
import { io } from 'socket.io-client';
import { Plus, LogOut, CheckCircle, Clock, List, AlertCircle, Search, ShieldCheck } from 'lucide-react';
import { Get_Tasks, Create_Task, Update_Task, Delete_Task } from '../graphql/queries';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';

// Inititalize socket 
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

const toastStyle = {
    all: 'unset',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    top: '5px',
    color: '#000000',
    fontWeight: '700',
    padding: '16px',
    // --- ADD THE LINE BELOW ---
    pointerEvents: 'auto',
};

const Dashboard = ({ user, token, onLogout }) => {
    // Queries and Mutations
    const { loading, error, data, refetch } = useQuery(Get_Tasks);
    const [createTask, { loading: creating }] = useMutation(Create_Task);
    const [updateTask, { loading: updating }] = useMutation(Update_Task);
    const [deleteTask, { loading: deleting }] = useMutation(Delete_Task);

    // Local State
    const [searchTerm, setSearchTerm] = useState("");
    const [editingTask, setEditingTask] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [showForm, setShowForm] = useState(false);
    const [stats, setStats] = useState({ total: 0, pending: 0, 'in-progress': 0, completed: 0 });

    const tasks = data?.getTasks || [];

    useEffect(() => {
        if (user?.id) {
            // Join private room for user-specific notifications
            socket.emit('join', { userId: user.id, role: user.role });

            // Listen for updates from the server
            socket.on('taskUpdate', (data) => {
                // Show notification
                toast.success(data.message, { icon: '🔔' });
                refetch();
            });
        }

        return () => {
            socket.off('taskUpdate');
        };
    }, [user, refetch]);

    // Filter Logic
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || task.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    //Sorting Logic
    const displayTasks = [...filteredTasks].sort((a, b) => {
        const getSortTime = (dateInput) => {
            if (!dateInput) return Infinity;

            // Extract value 
            let val = dateInput?.$date ? dateInput.$date : dateInput;

            // Handle strings that are actually numeric timestamps 
            if (typeof val === 'string' && !isNaN(val)) {
                val = parseInt(val);
            }

            const d = new Date(val);

            // If it's still invalid, push to bottom
            return isNaN(d.getTime()) ? Infinity : d.getTime();
        };

        const timeA = getSortTime(a.dueDate);
        const timeB = getSortTime(b.dueDate);

        // Ascending Sort
        if (timeA < timeB) return -1;
        if (timeA > timeB) return 1;
        return 0;
    });

    const handleToggleComplete = async (task) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';

        const togglePromise = updateTask({
            variables: {
                id: task.id || task._id,
                status: newStatus
            }
        });

        toast.promise(togglePromise, {
            loading: 'Updating status...',
            success: <b>Task marked as {newStatus}.</b>,
            error: <b>Update failed.</b>,
        });

        try {
            await togglePromise;
            refetch();
        } catch (err) {
            console.error(err);
        }
    };

    // Stats Calculation
    useEffect(() => {
        if (tasks) {
            const newStats = tasks.reduce((acc, task) => {
                acc.total++;
                if (task.status === 'pending') acc.pending++;
                if (task.status === 'in-progress') acc['in-progress']++;
                if (task.status === 'completed') acc.completed++;
                return acc;
            }, { total: 0, pending: 0, 'in-progress': 0, completed: 0 });
            setStats(newStats);
        }
    }, [tasks]);

    // Handle Save 
    const handleSave = async (formData) => {
        const variables = {
            title: formData.title,
            description: formData.description || "",
            status: formData.status || "pending",
            priority: formData.priority || "medium",
            dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
        };

        // Prepare the promise for the toast
        const savePromise = editingTask
            ? updateTask({ variables: { id: editingTask.id || editingTask._id, ...variables } })
            : createTask({ variables: variables });

        // Trigger Toast Feedback
        toast.promise(savePromise, {
            loading: editingTask ? 'Updating task...' : 'Creating task...',
            success: <b>Task saved successfully!</b>,
            error: (err) => <b>Save failed: {err.message}</b>,
        });

        try {
            await savePromise; // Execute the mutation
            setShowForm(false);
            setEditingTask(null);
            refetch();
        } catch (err) {
            console.error("Save error:", err);
        }
    };

    // Handle Delete
    const handleDelete = (id) => {
        if (!id) return;

        toast((t) => (
            /* We wrap the content in a div that explicitly allows clicks */
            <div style={{ pointerEvents: 'auto', backgroundColor:'#7f7f7f', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid #7f7f7f' }}>
                <span style={{ display: 'block' }}>Are you sure you want to delete this task?</span>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toast.dismiss(t.id);
                        }}
                        style={{ cursor: 'pointer', padding: '4px 8px', background: '#e5e7eb', borderRadius: '4px' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toast.dismiss(t.id);
                            executeDelete(id);
                        }}
                        style={{ cursor: 'pointer', padding: '4px 8px', background: '#ef4444', color: 'white', borderRadius: '4px' }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            position: 'top-center',
        });
    };

    // Actual deletion logic
    const executeDelete = async (id) => {
        const deletePromise = deleteTask({
            variables: { id },
            update: (cache) => {
                cache.modify({
                    fields: {
                        getTasks(existingTasks = [], { readField }) {
                            return existingTasks.filter(
                                taskRef => readField('id', taskRef) !== id
                            );
                        }
                    }
                });
            }
        });

        toast.promise(deletePromise, {
            loading: 'Deleting...',
            success: 'Task removed successfully!',
            error: 'Could not delete task',
        });
    };

    if (error) return <div className="p-10 text-center text-red-500">Error: {error.message}</div>;
    if (loading && tasks.length === 0) return <div className="p-10 text-center">Loading Data...</div>;

    return (
        <div className="min-h-screen">
            {/* Toaster component */}
            <Toaster reverseOrder={false}
                toastOptions={{
                    style: { ...toastStyle },
                    success: {
                        iconTheme: { primary: '#04a640', secondary: '#fff' }
                    },
                    error: {
                        iconTheme: { primary: '#ef4444', secondary: '#fff' },
                    }
                }} />

            {/* Top nav-bar */}
            <header className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black text-blue-600">TASKFLOW</h1>
                    {user?.role === 'admin' && (
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck size={12} /> Admin Mode
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-bold text-gray-800">{user?.name}</p>
                        <p className="text-[10px] text-blue-500 font-bold uppercase">{user?.role}</p>
                    </div>
                    <button onClick={onLogout} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition border border-transparent hover:border-red-100">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total', val: stats.total, color: 'text-gray-500', icon: <List size={16} /> },
                        { label: 'Pending', val: stats.pending, color: 'text-yellow-600', icon: <AlertCircle size={16} /> },
                        { label: 'In Progress', val: stats['in-progress'], color: 'text-blue-600', icon: <Clock size={16} /> },
                        { label: 'Completed', val: stats.completed, color: 'text-green-600', icon: <CheckCircle size={16} /> }
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className={`flex items-center justify-between ${s.color} mb-2`}>
                                <span className="text-xs font-bold uppercase">{s.label}</span>
                                {s.icon}
                            </div>
                            <div className="text-2xl font-bold text-gray-800">{s.val}</div>
                        </div>
                    ))}
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-4 mb-7 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={user?.role === 'admin' ? "Search all users' tasks..." : "Search your tasks..."}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="p-2 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                {/* Dashboard Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">
                            {user?.role === 'admin' ? "System Overview" : "Your Tasks"}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {user?.role === 'admin' ? "Viewing all tasks across organization" : "Manage your daily productivity"}
                        </p>
                    </div>
                    <button
                        onClick={() => { setEditingTask(null); setShowForm(true); }}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:shadow-lg transition active:scale-95"
                    >
                        <Plus size={20} /> Add New
                    </button>
                </div>

                {showForm && (
                    <TaskForm
                        task={editingTask}
                        // Pass loading states to disable buttons in the form
                        isSubmitting={creating || updating}
                        onCancel={() => { setShowForm(false); setEditingTask(null); }}
                        onSubmit={handleSave}
                    />
                )}

                {/* Tasks Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayTasks.length > 0 ? (
                        displayTasks.map(t => (
                            <div key={t.id || t._id} className="relative group">
                                {user?.role === 'admin' && (
                                    <div className="absolute -top-3 left-4 bg-purple-600 text-white text-[9px] px-2 py-0.5 rounded font-bold z-10 shadow-sm flex items-center gap-1">
                                        OWNER: {t.user?.name || 'Unknown'}
                                    </div>
                                )}
                                <TaskCard
                                    task={t}
                                    onDelete={handleDelete}
                                    onEdit={(task) => { setEditingTask(task); setShowForm(true); }}
                                    onToggleComplete={handleToggleComplete}
                                    isDeleting={deleting}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                            <div className="text-gray-400 text-lg font-medium">
                                {tasks.length === 0 ? "No tasks found." : "No matches for your search."}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;