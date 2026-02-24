import React, { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react'; 
import toast from 'react-hot-toast';

const TaskForm = ({ task, onSubmit, onCancel, isSubmitting }) => {
  const formatForInput = (dateInput) => {
    if (!dateInput) return '';

    let dateValue = dateInput?.$date ? dateInput.$date : dateInput;

    // If it's a timestamp string, turn it into a number
    if (typeof dateValue === 'string' && !isNaN(dateValue)) {
      dateValue = parseInt(dateValue);
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) return '';

    // Returns "yyyy-MM-dd"
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'pending',
    priority: task?.priority || 'medium',
    dueDate: formatForInput(task?.dueDate)
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required!"); 
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 mb-8 border border-gray-100 animate-in fade-in zoom-in duration-200">
      <h3 className="text-xl font-bold mb-5 text-gray-800">
        {task ? 'Edit Task' : 'New Task'}
      </h3>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Task Title</label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
              disabled={isSubmitting} 
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Description</label>
            <textarea
              placeholder="Add details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px] disabled:bg-gray-50 disabled:text-gray-400"
              disabled={isSubmitting}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-50"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer disabled:bg-gray-50"
              disabled={isSubmitting}
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer disabled:bg-gray-50"
              disabled={isSubmitting}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition active:scale-95 ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check size={20} /> {task ? 'Save Changes' : 'Create Task'}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-gray-200 transition active:scale-95 disabled:opacity-50"
          >
            <X size={20} /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
