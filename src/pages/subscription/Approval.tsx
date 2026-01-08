import { useState, useMemo, useEffect, useCallback } from 'react';
import useAuthStore from '../../store/authStore';
import useHeaderStore from '../../store/headerStore';
import { CheckCircle, FileText, X, Save, Search, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateFormatter';
import {
    fetchPendingApprovals,
    fetchApprovalHistory,
    submitApproval,
    ApprovalItem,
    ApprovalHistoryItem
} from '../../utils/subscriptionApi';

// Frontend display types
interface PendingDisplay {
    id: string;
    sn: string;
    companyName: string;
    subscriberName: string;
    subscriptionName: string;
    price: string;
    frequency: string;
    purpose: string;
    requestedDate: string;
}

interface HistoryDisplay {
    id: string;
    approvalNo: string;
    subscriptionNo: string;
    approval: string;
    note: string;
    approvedBy: string;
    requestedOn: string;
    approvalDate: string;
    subscriberName: string;
}

const SubscriptionApproval = () => {
    const { setTitle } = useHeaderStore();
    const { currentUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [pendingList, setPendingList] = useState<PendingDisplay[]>([]);
    const [historyList, setHistoryList] = useState<HistoryDisplay[]>([]);
    const [loading, setLoading] = useState(true);

    // Update Header
    useEffect(() => {
        setTitle('Subscription Approval');
    }, [setTitle]);

    // Modal State
    const [selectedSub, setSelectedSub] = useState<PendingDisplay | null>(null);
    const [approvalStatus, setApprovalStatus] = useState<'Approve' | 'Reject'>('Approve');
    const [remarks, setRemarks] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load data from backend
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [pending, history] = await Promise.all([
                fetchPendingApprovals(),
                fetchApprovalHistory()
            ]);

            // Map pending approvals
            setPendingList(pending.map((item: ApprovalItem) => ({
                id: String(item.id),
                sn: item.subscription_no,
                companyName: item.company_name || '',
                subscriberName: item.subscriber_name || '',
                subscriptionName: item.subscription_name || '',
                price: item.price || '',
                frequency: item.frequency || '',
                purpose: item.purpose || '',
                requestedDate: item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-GB') : ''
            })));

            // Map history
            setHistoryList(history.map((item: ApprovalHistoryItem, index: number) => ({
                id: String(item.id || index),
                approvalNo: `AP-${String(index + 1).padStart(3, '0')}`,
                subscriptionNo: item.subscription_no,
                approval: item.approval,
                note: item.note || '',
                approvedBy: item.approved_by || '',
                requestedOn: item.requested_on || '',
                approvalDate: item.requested_on ? new Date(item.requested_on).toLocaleDateString('en-GB') : '',
                subscriberName: (item as any).subscriber_name || ''
            })));

        } catch (err) {
            console.error('Failed to load approval data:', err);
            toast.error('Failed to load approval data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filter by search AND Role
    const filteredPending = useMemo(() => {
        let data = pendingList;

        // Role Filter
        if (currentUser?.role !== 'admin') {
            data = data.filter(s => s.subscriberName === currentUser?.name);
        }

        return data.filter(s =>
            s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.subscriptionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.sn.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [pendingList, searchTerm, currentUser]);

    const filteredHistory = useMemo(() => {
        let data = historyList;

        // Role Filter
        if (currentUser?.role !== 'admin') {
            data = data.filter(s => s.subscriberName === currentUser?.name);
        }

        return data.filter(s =>
            s.subscriptionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.approvedBy.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [historyList, searchTerm, currentUser]);

    const handleActionClick = (sub: PendingDisplay) => {
        setSelectedSub(sub);
        setApprovalStatus('Approve');
        setRemarks('');
    };

    const handleCloseModal = () => {
        setSelectedSub(null);
    };

    const handleSave = async () => {
        if (!selectedSub || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await submitApproval({
                subscriptionNo: selectedSub.sn,
                approval: approvalStatus === 'Approve' ? 'Approved' : 'Rejected',
                note: remarks,
                approvedBy: 'Admin', // TODO: get from auth context
                requestedOn: selectedSub.requestedDate
            });

            toast.success(`Subscription ${approvalStatus === 'Approve' ? 'Approved' : 'Rejected'}`);
            handleCloseModal();
            loadData(); // Refresh data
        } catch (err) {
            console.error('Failed to submit approval:', err);
            toast.error('Failed to submit approval');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Unified Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Subscription Approval</h1>
                    <p className="text-sm text-gray-500 mt-1">Review and approve pending subscription requests</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2.5 rounded-lg transition-all"
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'pending'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'history'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            History
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                    <span className="ml-3 text-gray-600">Loading...</span>
                </div>
            )}

            {/* Content - Pending Tab */}
            {!loading && activeTab === 'pending' && (
                <div className="hidden md:flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-210px)]">
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold whitespace-nowrap">
                                <tr>
                                    <th className="p-3">Action</th>
                                    <th className="p-3">Serial No</th>
                                    <th className="p-3">Company</th>
                                    <th className="p-3">Subscriber</th>
                                    <th className="p-3">Subscription</th>
                                    <th className="p-3">Price</th>
                                    <th className="p-3">Frequency</th>
                                    <th className="p-3">Requested On</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {filteredPending.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleActionClick(item)}
                                                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors"
                                            >
                                                Approve
                                            </button>
                                        </td>
                                        <td className="p-3 font-mono text-sm font-bold text-gray-700">{item.sn}</td>
                                        <td className="p-3 font-medium text-gray-900">{item.companyName}</td>
                                        <td className="p-3 text-gray-700">{item.subscriberName}</td>
                                        <td className="p-3 text-indigo-600 font-medium">{item.subscriptionName}</td>
                                        <td className="p-3 font-medium text-gray-900">{item.price}</td>
                                        <td className="p-3 text-gray-500">{item.frequency}</td>
                                        <td className="p-3 text-gray-500 whitespace-nowrap">{formatDate(item.requestedDate)}</td>
                                    </tr>
                                ))}
                                {filteredPending.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-gray-500">
                                            No pending subscriptions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Content - History Tab */}
            {!loading && activeTab === 'history' && (
                <div className="hidden md:flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-210px)]">
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold whitespace-nowrap">
                                <tr>
                                    <th className="p-3">Approval No</th>
                                    <th className="p-3">Subscription No</th>
                                    <th className="p-3">Approved By</th>
                                    <th className="p-3">Approval Date</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {filteredHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-3 font-mono font-bold text-gray-700 text-xs">{item.approvalNo}</td>
                                        <td className="p-3 font-mono text-sm font-bold text-gray-700">{item.subscriptionNo}</td>
                                        <td className="p-3 text-gray-700">{item.approvedBy}</td>
                                        <td className="p-3 text-gray-500 whitespace-nowrap">{formatDate(item.approvalDate)}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-sm font-bold uppercase ${item.approval === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {item.approval}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-500 max-w-xs truncate" title={item.note}>{item.note || '-'}</td>
                                    </tr>
                                ))}
                                {filteredHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-500">
                                            No approval history found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Mobile Cards - Pending */}
            {!loading && activeTab === 'pending' && (
                <div className="md:hidden flex flex-col gap-4">
                    {filteredPending.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3 items-start">
                                    <div className="h-10 w-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{item.sn}</span>
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-900 leading-tight">{item.subscriptionName}</h3>
                                        <p className="text-sm text-gray-500 mt-0.5 font-medium">{item.companyName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleActionClick(item)}
                                    className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"
                                >
                                    <CheckCircle size={18} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs pt-3 border-t border-dashed border-gray-100">
                                <div>
                                    <span className="block text-gray-400 mb-0.5 text-[10px] uppercase font-semibold">Subscriber</span>
                                    <span className="font-semibold text-gray-700">{item.subscriberName}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-400 mb-0.5 text-[10px] uppercase font-semibold">Price / Freq</span>
                                    <span className="font-bold text-gray-900">{item.price} <span className="text-gray-400 font-normal text-[10px]">/ {item.frequency}</span></span>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3 text-[10px] border border-gray-100">
                                <div>
                                    <span className="block text-gray-400 mb-0.5 uppercase tracking-wider font-semibold">Req. Date</span>
                                    <span className="font-mono text-gray-600 font-bold">{formatDate(item.requestedDate)}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredPending.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                            <FileText size={32} className="mb-2 opacity-50" />
                            <p className="text-sm font-medium">No pending subscriptions</p>
                        </div>
                    )}
                </div>
            )}

            {/* Mobile Cards - History */}
            {!loading && activeTab === 'history' && (
                <div className="md:hidden flex flex-col gap-4">
                    {filteredHistory.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3 items-start">
                                    <div className="h-10 w-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{item.subscriptionNo}</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${item.approval === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                {item.approval}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-900 leading-tight">{item.approvalNo}</h3>
                                        <p className="text-sm text-gray-500 mt-0.5 font-medium">{item.approvedBy}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3 text-[10px] border border-gray-100">
                                <div>
                                    <span className="block text-gray-400 mb-0.5 uppercase tracking-wider font-semibold">Approval Date</span>
                                    <span className="font-mono text-gray-600 font-bold">{formatDate(item.approvalDate)}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredHistory.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                            <FileText size={32} className="mb-2 opacity-50" />
                            <p className="text-sm font-medium">No approval history</p>
                        </div>
                    )}
                </div>
            )}

            {/* Approval Modal */}
            {selectedSub && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-800">Subscription Action</h3>
                            <button onClick={handleCloseModal} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Read-only details grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase font-semibold">Serial No</span>
                                    <span className="font-mono text-gray-700">{selectedSub.sn}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase font-semibold">Requested On</span>
                                    <span className="text-gray-700">{formatDate(selectedSub.requestedDate)}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase font-semibold">Company</span>
                                    <span className="font-medium text-gray-900">{selectedSub.companyName}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase font-semibold">Subscriber</span>
                                    <span className="text-gray-900">{selectedSub.subscriberName}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="block text-xs text-gray-500 uppercase font-semibold">Subscription</span>
                                    <span className="font-medium text-indigo-600">{selectedSub.subscriptionName}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase font-semibold">Price</span>
                                    <span className="font-medium text-gray-900">{selectedSub.price}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase font-semibold">Frequency</span>
                                    <span className="text-gray-700">{selectedSub.frequency}</span>
                                </div>
                            </div>

                            {/* Action Form */}
                            <div className="space-y-3 pt-2">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Action Status</label>
                                    <select
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                                        value={approvalStatus}
                                        onChange={(e) => setApprovalStatus(e.target.value as 'Approve' | 'Reject')}
                                    >
                                        <option value="Approve">Approve</option>
                                        <option value="Reject">Reject</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Remarks</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
                                        placeholder="Enter remarks..."
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-white transition-all shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSubmitting}
                                className={`flex-1 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${approvalStatus === 'Approve'
                                    ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                                    : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                                    }`}
                            >
                                <Save size={18} />
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionApproval;
