import { useState, useEffect } from 'react';
import { User, Bell, Shield, Plus, X, Check, Search } from 'lucide-react';
import useAuthStore, { User as UserType } from '../store/authStore';
import useHeaderStore from '../store/headerStore';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const { setTitle } = useHeaderStore();
  const { users, addUser, updateUser, deleteUser, currentUser } = useAuthStore();

  useEffect(() => {
    setTitle('Settings');
  }, [setTitle]);
  const [activeTab, setActiveTab] = useState<'profile' | 'users'>('profile');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<UserType>>({
    id: '',
    password: '',
    role: 'user',
    permissions: []
  });

  const availablePermissions = ['Dashboard', 'Document', 'Subscription', 'Loan', 'Calendar', 'Master', 'Settings'];



  const openAddUserModal = () => {
    setEditingUser(null);
    setFormData({
        id: '',
        password: '',
        role: 'user',
        permissions: ['Dashboard'] // Default permission
    });
    setIsModalOpen(true);
  };

  const openEditUserModal = (user: UserType) => {
    setEditingUser(user);
    setFormData({
        id: user.id,
        password: user.password,
        role: user.role,
        permissions: user.permissions
    });
    setIsModalOpen(true);
  };

  const handlePermissionToggle = (perm: string) => {
    setFormData(prev => {
        const currentPermissions = prev.permissions || [];
        if (currentPermissions.includes(perm)) {
            return { ...prev, permissions: currentPermissions.filter(p => p !== perm) };
        } else {
            return { ...prev, permissions: [...currentPermissions, perm] };
        }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id || !formData.password) {
        toast.error('Username and password are required');
        return;
    }

    if (editingUser) {
        // Update existing user
        updateUser(editingUser.id, formData);
        toast.success('User updated successfully');
    } else {
        // Add new user
        const success = addUser(formData as UserType);
        if (success) {
            toast.success('User added successfully');
        } else {
            toast.error('User already exists');
            return;
        }
    }
    setIsModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
      if (confirm('Are you sure you want to delete this user?')) {
          deleteUser(id);
          toast.success('User deleted');
      }
  };



  return (
    <div className="space-y-6 pb-20">
        {/* Unified Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage platform preferences and user access</p>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'profile'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <User size={16} />
                    Profile
                </button>
                {currentUser?.role === 'admin' && (
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-md transition-all ${
                            activeTab === 'users'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Shield size={16} />
                        User Management
                    </button>
                )}
            </div>
        </div>

        {/* Content Area */}
        <div className="animate-fade-in">
             {activeTab === 'profile' ? (
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/30">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-indigo-500 text-3xl font-bold shadow-md border-4 border-indigo-50">
                                    {currentUser?.id.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-center sm:text-left">
                                    <h2 className="text-2xl font-bold text-gray-900">{currentUser?.id}</h2>
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-2 ${
                                        currentUser?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        <Shield size={12} />
                                        {currentUser?.role}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <User size={18} className="text-indigo-500" />
                                    Account Details
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Username</label>
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-700 font-medium">
                                            {currentUser?.id}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Role</label>
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-700 font-medium capitalize">
                                            {currentUser?.role}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Bell size={18} className="text-indigo-500" />
                                    Notifications
                                </h3>
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                                        <span className="text-gray-700 font-medium group-hover:text-indigo-700">Email Notifications</span>
                                        <div className="w-11 h-6 bg-indigo-600 rounded-full relative transition-colors">
                                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                        </div>
                                    </label>
                                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all">
                                        <span className="text-gray-600 font-medium">Browser Alerts</span>
                                        <div className="w-11 h-6 bg-gray-200 rounded-full relative transition-colors">
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* User Management Actions */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="relative w-full sm:w-72">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                             <input type="text" placeholder="Search users..." className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
                        </div>
                         <button 
                            onClick={openAddUserModal}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-95"
                        >
                            <Plus size={20} />
                            Add User
                        </button>
                    </div>
                    
                    {/* Users Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/50">
                                    <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                        <th className="p-5">User</th>
                                        <th className="p-5">Permissions</th>
                                        <th className="p-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {users.map((user: UserType) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-100">
                                                        {user.id.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{user.id}</p>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                                                            user.role === 'admin' 
                                                                ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                        }`}>
                                                            {user.role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-wrap gap-2 max-w-lg">
                                                    {user.permissions?.slice(0, 5).map((perm: string) => (
                                                        <span key={perm} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                                            {perm}
                                                        </span>
                                                    ))}
                                                    {(user.permissions?.length || 0) > 5 && (
                                                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-50 text-gray-400 border border-gray-200">
                                                            +{(user.permissions?.length || 0) - 5} more
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => openEditUserModal(user)}
                                                        className="px-4 py-2 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    {user.id !== currentUser?.id && (
                                                        <button 
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="px-4 py-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 text-xs font-bold transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-100">
                             {users.map((user: UserType) => (
                                <div key={user.id} className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-100">
                                                {user.id.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-base">{user.id}</p>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    user.role === 'admin' 
                                                        ? 'bg-purple-100 text-purple-700' 
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Permissions</p>
                                        <div className="flex flex-wrap gap-2">
                                            {user.permissions?.map((perm: string) => (
                                                <span key={perm} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                                    {perm}
                                                </span>
                                            ))}
                                            {(user.permissions?.length || 0) === 0 && (
                                                <span className="text-xs text-gray-400 italic">No permissions assigned</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2 border-t border-gray-50">
                                        <button 
                                            onClick={() => openEditUserModal(user)}
                                            className="flex-1 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm font-bold"
                                        >
                                            Edit User
                                        </button>
                                        {user.id !== currentUser?.id && (
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="flex-1 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-bold"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                             ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

      {/* User Logic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100 transition-all">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800">
                        {editingUser ? 'Edit User Details' : 'Create New User'}
                    </h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Username</label>
                                <input 
                                    type="text" 
                                    required
                                    disabled={!!editingUser}
                                    className={`w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${editingUser ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white font-medium'}`}
                                    value={formData.id}
                                    onChange={e => setFormData({...formData, id: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Role</label>
                                <select 
                                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                                    value={formData.role}
                                    onChange={e => setFormData({...formData, role: e.target.value as 'admin' | 'user'})}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Password</label>
                            <input 
                                type="text" 
                                required
                                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Page Permissions</label>
                            <div className="grid grid-cols-2 gap-3">
                                {availablePermissions.map(perm => (
                                    <label key={perm} className={`
                                        flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all
                                        ${(formData.permissions || []).includes(perm) 
                                            ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                                            : 'border-gray-100 hover:bg-gray-50'}
                                    `}>
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                            (formData.permissions || []).includes(perm)
                                                ? 'bg-indigo-600 border-indigo-600'
                                                : 'border-gray-300 bg-white'
                                        }`}>
                                            {(formData.permissions || []).includes(perm) && <Check size={14} className="text-white" />}
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            className="hidden"
                                            checked={(formData.permissions || []).includes(perm)}
                                            onChange={() => handlePermissionToggle(perm)}
                                        />
                                        <span className={`text-sm font-medium ${(formData.permissions || []).includes(perm) ? 'text-indigo-900' : 'text-gray-600'}`}>
                                            {perm}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
                        >
                            {editingUser ? 'Save Changes' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
