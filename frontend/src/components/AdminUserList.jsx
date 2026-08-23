import React from "react";
import { useQuery, gql } from "@apollo/client";

export const GET_ALL_USERS = gql`
  query GetAllUsers {
    getAllUsers {
      id
      name
      email
      role
      avatar
      createdAt
      updatedAt
    }
  }
`;

const AdminUserList = ({ onSelectUser }) => {
  const { loading, error, data } = useQuery(GET_ALL_USERS);

  if (loading) return <div className="p-6 text-gray-500">Loading organization users...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading users: {error.message}</div>;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mt-6">
      <h3 className="text-xl font-black text-gray-800 mb-2">Organization Users</h3>
      <p className="text-xs text-gray-500 mb-4">Click any user row to view details, profile data, or update account information.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {data?.getAllUsers?.map((u) => (
              <tr 
                key={u.id} 
                onClick={() => onSelectUser && onSelectUser(u)}
                className="hover:bg-purple-50/50 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-4 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center font-bold text-gray-600 border border-gray-300 group-hover:border-purple-300 transition-colors">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      u.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="font-semibold text-gray-800 group-hover:text-purple-900 transition-colors">{u.name}</span>
                </td>
                <td className="py-3 px-4 text-gray-600">{u.email}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      u.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUserList;