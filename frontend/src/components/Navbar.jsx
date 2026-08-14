import React from "react";
import { LogOut, ShieldCheck } from "lucide-react";

const UserBadge = ({ user, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center space-x-3 text-left hover:bg-gray-50 p-1.5 rounded-xl transition cursor-pointer group"
    title="Click to view/edit profile"
  >
    {user?.avatar ? (
      <img
        src={user.avatar}
        alt={user.name || "User Avatar"}
        className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 shadow-sm group-hover:scale-105 transition-transform"
      />
    ) : (
      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm uppercase shadow-sm group-hover:scale-105 transition-transform">
        {user?.name ? user.name.charAt(0) : "U"}
      </div>
    )}
    <div className="hidden sm:block">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-bold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">
          {user?.name || "User"}
        </p>
      </div>
      <span className="text-[10px] text-purple-700 uppercase font-semibold">
        {user?.role || "user"}
      </span>
    </div>
  </button>
);

const Navbar = ({ user, onLogout, onOpenProfile }) => {
  return (
    <header className="w-full bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
      <div className="flex items-center space-x-2">
        <span className="text-xl font-black text-blue-600 tracking-tight">
          TASKFLOW
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <UserBadge user={user} onClick={onOpenProfile} />
        <button
          onClick={onLogout}
          className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors border border-transparent hover:border-red-100"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
