import React from 'react';
import { Trash2, Edit2, Calendar, Loader2, CheckCircle } from 'lucide-react';

const TaskCard = ({ task, onDelete, onEdit, onToggleComplete, isDeleting }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800'
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-orange-100 text-orange-800',
    high: 'bg-red-100 text-red-800'
  };

  // helper to format the date 
  const formatDate = (dateInput) => {
    if (!dateInput) return null;

    const dateValue = dateInput?.$date ? dateInput.$date : dateInput;

    const date = new Date(
      // If it's a string like number, convert to integer
      typeof dateValue === 'string' && !isNaN(dateValue)
        ? parseInt(dateValue)
        : dateValue
    );

    // Validation
    if (isNaN(date.getTime())) return null;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getUrgencyClass = (dateInput) => {
    if (!dateInput) return 'text-gray-500';

    const val = dateInput?.$date ? dateInput.$date : dateInput;
    const due = new Date(typeof val === 'string' && !isNaN(val) ? parseInt(val) : val);
    if (isNaN(due.getTime())) return 'text-gray-500';

    const now = new Date();
    const diffInMs = due - now;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    // Overdue: Red + Pulse
    if (diffInMs < 0) return 'text-red-600 font-black animate-pulse';

    // Due very soon (next 24 hours): Orange
    if (diffInHours <= 24) return 'text-orange-500 font-bold';

    // Due within 3 days: Blue
    if (diffInHours <= 72) return 'text-blue-600 font-semibold';
    return 'text-gray-500';
  };

  const taskId = task.id || task._id;
  const formattedDate = formatDate(task.dueDate);

  return (
    <div className={`bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition border-l-4 border-blue-500 relative overflow-hidden ${isDeleting ? 'opacity-50 grayscale' : ''}`}>

      {/* Loading Overlay for Deletion */}
      {isDeleting && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
          <Loader2 className="animate-spin text-blue-600" size={24} />
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <h3 className={`text-lg font-semibold truncate pr-4 ${task.status === 'completed' ? 'text-green-400' : 'text-gray-800'
          }`}>
          {task.title}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => onToggleComplete(task)}
            className={`p-1 rounded transition-colors ${task.status === 'completed'
              ? 'text-green-600 bg-green-50'
              : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
              }`}
            title={task.status === 'completed' ? "Mark Pending" : "Mark Completed"}
          >
            <CheckCircle size={18} />
          </button>
          <button
            onClick={() => onEdit(task)}
            disabled={isDeleting}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-30"
            title="Edit Task"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(taskId);
            }}
            disabled={isDeleting}
            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30"
            title="Delete Task"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
        {task.description || "No description provided."}
      </p>

      {/* Consistent Date Display */}
      <div className="mb-4">
        {formattedDate ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar size={14} className="text-blue-500" />
            <span className={`text-xs font-medium ${getUrgencyClass(task.dueDate)}`}>
              Due: {formattedDate}
            </span>
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">No due date set</div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[task.status] || 'bg-gray-100'}`}>
          {task.status}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priorityColors[task.priority] || 'bg-gray-100'}`}>
          {task.priority} Priority
        </span>
      </div>
    </div >
  );
};

export default TaskCard;
