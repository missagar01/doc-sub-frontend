import { useState, useEffect, useCallback } from 'react';
import { User, Bell, Shield, X, Check, Search, RefreshCw } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useHeaderStore from '../store/headerStore';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';

// Backend user interface
interface BackendUser {
    id: number;
    user_name: string;
    email_id?: string;
    role?: string;
    department?: string;
    password?: string;
    systemAccess: string[];
    pageAccess: string[];
    status?: string;
}

// Form data interface
interface FormData {
    username: string;
    password: string;
    role: string;
    email: string;
    department: string;
    systemAccess: string[];
    pageAccess: string[];
}

const Settings = () => {
    const { setTitle } = useHeaderStore();
    const { currentUser } = useAuthStore();

    useEffect(() => {
        setTitle('Settings');
    }, [setTitle]);

    const [activeTab, setActiveTab] = useState<'profile' | 'users'>('profile');
    const [users, setUsers] = useState<BackendUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<BackendUser | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState<FormData>({
        username: '',
        password: '',
        role: 'employee',
        email: '',
        department: '',
        systemAccess: ['subscription', 'document'],
        pageAccess: []
    });

    const availableSystems = ['subscription', 'document', 'loan'];

    // Define which pages belong to which system
    const systemPagesMap: Record<string, string[]> = {
        'subscription': [
            'Subscription/Approval',
            'Subscription/Payment',
            'Subscription/Renewal',
            'Subscription/All'
        ],
        'document': [
            'Document/All',
            'Document/Renewal',
            'Document/Shared',
            'Resource Manager'
        ],
        'loan': [
            'Loan/All',
            'Loan/Foreclosure',
            'Loan/NOC'
        ]
    };

    // Get available pages based on selected systems
    const getAvailablePages = (): string[] => {
        const pages: string[] = ['Dashboard']; // Dashboard is always available

        formData.systemAccess?.forEach(system => {
            const systemPages = systemPagesMap[system] || [];
            pages.push(...systemPages);
        });

        // Add common pages for admin
        if (formData.role === 'admin') {
            pages.push('Master', 'Settings');
        }

        return Array.from(new Set(pages));
    };

    // Fetch users from backend
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/settings/users`);
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data.users || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab, fetchUsers]);

    const filteredUsers = users.filter(user =>
        user.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openEditUserModal = (user: BackendUser) => {
        setEditingUser(user);
        setFormData({
            username: user.user_name,
            password: user.password || '',
            role: user.role || 'employee',
            email: user.email_id || '',
            department: user.department || '',
            systemAccess: user.systemAccess || [],
            pageAccess: user.pageAccess || []
        });
        setIsModalOpen(true);
    };

    const handleSystemToggle = (system: string) => {
        setFormData(prev => {
            const current = prev.systemAccess || [];
            if (current.includes(system)) {
                return { ...prev, systemAccess: current.filter(s => s !== system) };
            } else {
                return { ...prev, systemAccess: [...current, system] };
            }
        });
    };

    const handlePageToggle = (page: string) => {
        setFormData(prev => {
            const current = prev.pageAccess || [];
            if (current.includes(page)) {
                return { ...prev, pageAccess: current.filter(p => p !== page) };
            } else {
                return { ...prev, pageAccess: [...current, page] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingUser) {
            toast.error('Only editing existing users is supported via this interface');
            return;
        }

        try {
            // Update user access
            const res = await fetch(`${API_BASE_URL}/settings/users/${editingUser.id}/access`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systems: formData.systemAccess,
                    pages: formData.pageAccess
                })
            });

            if (!res.ok) throw new Error('Failed to update user');

            toast.success('User access updated successfully');
            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            console.error('Failed to update user:', err);
            toast.error('Failed to update user');
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
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'profile'
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
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'users'
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
                                        {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <h2 className="text-2xl font-bold text-gray-900">{currentUser?.username || currentUser?.name}</h2>
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-2 ${currentUser?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
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
                                                {currentUser?.username}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Role</label>
                                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-700 font-medium capitalize">
                                                {currentUser?.role}
                                            </div>
                                        </div>
                                        {currentUser?.email && (
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-700 font-medium">
                                                    {currentUser.email}
                                                </div>
                                            </div>
                                        )}
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
                            <div className="relative w-full sm:w-72 flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={fetchUsers}
                                    disabled={loading}
                                    className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <RefreshCw className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="flex items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
                                <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                                <span className="ml-3 text-gray-600">Loading users...</span>
                            </div>
                        )}

                        {/* Users Table */}
                        {!loading && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50/50">
                                            <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                                <th className="p-5">User</th>
                                                <th className="p-5">Department</th>
                                                <th className="p-5">System Access</th>
                                                <th className="p-5">Page Access</th>
                                                <th className="p-5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredUsers.map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-100">
                                                                {user.user_name?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900">{user.user_name}</p>
                                                                <p className="text-xs text-gray-500">{user.email_id}</p>
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-0.5 ${user.role === 'admin'
                                                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                                    }`}>
                                                                    {user.role}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-gray-600">{user.department || '-'}</td>
                                                    <td className="p-5">
                                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                                            {user.systemAccess?.map((sys: string) => (
                                                                <span key={sys} className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                                    {sys}
                                                                </span>
                                                            ))}
                                                            {(!user.systemAccess || user.systemAccess.length === 0) && (
                                                                <span className="text-xs text-gray-400 italic">None</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                                            {user.pageAccess?.slice(0, 3).map((page: string) => (
                                                                <span key={page} className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                                                    {page}
                                                                </span>
                                                            ))}
                                                            {(user.pageAccess?.length || 0) > 3 && (
                                                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-50 text-gray-400 border border-gray-200">
                                                                    +{(user.pageAccess?.length || 0) - 3}
                                                                </span>
                                                            )}
                                                            {(!user.pageAccess || user.pageAccess.length === 0) && (
                                                                <span className="text-xs text-gray-400 italic">None</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-right">
                                                        <button
                                                            onClick={() => openEditUserModal(user)}
                                                            className="px-4 py-2 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold transition-colors"
                                                        >
                                                            Edit Access
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredUsers.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-12 text-center text-gray-500">
                                                        No users found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden divide-y divide-gray-100">
                                    {filteredUsers.map((user) => (
                                        <div key={user.id} className="p-5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-100">
                                                        {user.user_name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-base">{user.user_name}</p>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">System Access</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {user.systemAccess?.map((sys: string) => (
                                                        <span key={sys} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                            {sys}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-3 pt-2 border-t border-gray-50">
                                                <button
                                                    onClick={() => openEditUserModal(user)}
                                                    className="flex-1 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm font-bold"
                                                >
                                                    Edit Access
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100 transition-all max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingUser ? 'Edit User Access' : 'Create New User'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-4">
                                {/* Read-only user info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Username</label>
                                        <div className="p-3 bg-gray-100 rounded-xl text-gray-600 font-medium">
                                            {formData.username}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Role</label>
                                        <div className="p-3 bg-gray-100 rounded-xl text-gray-600 font-medium capitalize">
                                            {formData.role}
                                        </div>
                                    </div>
                                </div>

                                {formData.email && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Email</label>
                                        <div className="p-3 bg-gray-100 rounded-xl text-gray-600 font-medium">
                                            {formData.email}
                                        </div>
                                    </div>
                                )}

                                {/* System Access */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">System Access</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {availableSystems.map(system => (
                                            <label key={system} className={`
                                                flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all
                                                ${formData.systemAccess?.includes(system)
                                                    ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                                                    : 'border-gray-100 hover:bg-gray-50'}
                                            `}>
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${formData.systemAccess?.includes(system)
                                                    ? 'bg-emerald-600 border-emerald-600'
                                                    : 'border-gray-300 bg-white'
                                                    }`}>
                                                    {formData.systemAccess?.includes(system) && <Check size={14} className="text-white" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={formData.systemAccess?.includes(system)}
                                                    onChange={() => handleSystemToggle(system)}
                                                />
                                                <span className={`text-sm font-medium capitalize ${formData.systemAccess?.includes(system) ? 'text-emerald-900' : 'text-gray-600'}`}>
                                                    {system}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Page Access */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                                        Page Access <span className="text-gray-400 text-[10px] font-normal">(based on systems selected above)</span>
                                    </label>
                                    {formData.systemAccess?.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            Select a system above to see available pages
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto">
                                            {getAvailablePages().map(page => (
                                                <label key={page} className={`
                                                    flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all
                                                    ${formData.pageAccess?.includes(page)
                                                        ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                                        : 'border-gray-100 hover:bg-gray-50'}
                                                `}>
                                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${formData.pageAccess?.includes(page)
                                                        ? 'bg-indigo-600 border-indigo-600'
                                                        : 'border-gray-300 bg-white'
                                                        }`}>
                                                        {formData.pageAccess?.includes(page) && <Check size={14} className="text-white" />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={formData.pageAccess?.includes(page)}
                                                        onChange={() => handlePageToggle(page)}
                                                    />
                                                    <span className={`text-sm font-medium ${formData.pageAccess?.includes(page) ? 'text-indigo-900' : 'text-gray-600'}`}>
                                                        {page}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
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
                                    Save Changes
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
