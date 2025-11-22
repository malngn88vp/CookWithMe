import { useState, useEffect } from 'react';
import { Lock, Unlock, Search } from 'lucide-react';
import { userAPI } from '../../services/api'; // API bạn cần tạo cho user management

export const AdminUser = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userAPI.getWarnedUsers(); // trả về user có warning_count > 0
      setUsers(data);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async (userId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn khóa tài khoản này?')) return;
    try {
      await userAPI.lockUser(userId);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi khóa tài khoản');
    }
  };

  const handleUnlock = async (userId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn mở khóa tài khoản này?')) return;
    try {
      await userAPI.unlockUser(userId);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi mở khóa tài khoản');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Topbar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users with Warnings</h1>
          <p className="text-gray-600 mt-1">
            {users.length} user(s) flagged for inappropriate comments
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-6 flex items-center space-x-2 bg-gray-100 rounded-lg px-4 py-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-900"
          />
        </div>

        {/* Table of users */}
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.user_id}
                    className={user.warning_count >= 2 ? 'bg-red-50' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">{user.user_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.warning_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_locked ? 'Locked' : 'Active'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                      {user.is_locked ? (
                        <button
                          onClick={() => handleUnlock(user.user_id)}
                          className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                        >
                          <Unlock className="h-4 w-4 mr-1" />
                          Unlock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLock(user.user_id)}
                          className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          <Lock className="h-4 w-4 mr-1" />
                          Lock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No users with warnings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
