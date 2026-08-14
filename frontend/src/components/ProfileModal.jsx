import React, { useState } from "react";
import { X, User, Mail, Shield, Calendar, Edit2, Check, Camera, Trash2 } from "lucide-react";

const ProfileModal = ({ user, onClose, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "User",
    avatar: user?.avatar || "", // Base64 string or image URL
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle local image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, avatar: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile(formData);
    }
    setIsEditing(false);
  };

  const currentAvatar = isEditing ? formData.avatar : user?.avatar;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative overflow-hidden">
        {/* Header Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </button>

        {/* Modal Header & Photo Preview */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative group mb-3">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt={formData.name || "Profile"}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-50 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-3xl uppercase shadow-inner border-4 border-blue-50">
                {user?.name ? user.name.charAt(0) : "U"}
              </div>
            )}

            {/* Photo Action Overlay in Edit Mode */}
            {isEditing && (
              <label
                htmlFor="photo-upload"
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white cursor-pointer opacity-90 hover:opacity-100 transition"
              >
                <Camera size={24} />
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Edit Mode Photo Options */}
          {isEditing && formData.avatar && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 mb-2"
            >
              <Trash2 size={12} /> Remove photo
            </button>
          )}

          <h3 className="text-xl font-bold text-gray-800">
            {isEditing ? "Edit Profile" : user?.name || "User Profile"}
          </h3>
          <p className="text-sm text-gray-500">
            {isEditing ? "Update your personal details" : user?.email || "Account details"}
          </p>
        </div>

        {/* Content Section */}
        {isEditing ? (
          /* EDIT MODE FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Avatar URL (Optional)
              </label>
              <input
                type="text"
                name="avatar"
                placeholder="https://example.com/avatar.jpg"
                value={formData.avatar}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: user?.name || "",
                    email: user?.email || "",
                    role: user?.role || "User",
                    avatar: user?.avatar || "",
                  });
                  setIsEditing(false);
                }}
                className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 font-semibold rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-sm text-white bg-blue-600 font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Check size={16} /> Save Changes
              </button>
            </div>
          </form>
        ) : (
          /* VIEW MODE */
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100">
              <div className="flex items-center gap-3 text-sm">
                <User size={18} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase">Name</p>
                  <p className="font-medium text-gray-800">{user?.name || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Mail size={18} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase">Email</p>
                  <p className="font-medium text-gray-800">{user?.email || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Shield size={18} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase">Role</p>
                  <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-md capitalize">
                    {user?.role || "User"}
                  </span>
                </div>
              </div>

              {user?.createdAt && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={18} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase">Joined</p>
                    <p className="font-medium text-gray-800">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 font-semibold rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2"
              >
                <Edit2 size={16} /> Edit Profile
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-sm text-gray-700 bg-gray-100 font-semibold rounded-lg hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;