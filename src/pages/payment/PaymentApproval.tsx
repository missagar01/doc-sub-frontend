import { useState, useEffect } from 'react';
import { Search, RefreshCw, X, Check } from 'lucide-react';
import useHeaderStore from '../../store/headerStore';
import { toast } from 'react-hot-toast';
import { getApprovalPending, getApprovalHistory, processApproval, transformPaymentFms } from '../../utils/paymentFmsApi';

interface ApprovalRequest {
    id: string;
    status: string;
    uniqueNo: string;
    fmsName: string;
    payTo: string;
    amount: number;
    remarks: string;
    stageRemarks?: string;
}

const PaymentApproval = () => {
    const { setTitle } = useHeaderStore();

    useEffect(() => {
        setTitle('Payment Approval');
    }, [setTitle]);

    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState<'Approved' | 'Rejected'>('Approved');
    const [approvalRemarks, setApprovalRemarks] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);
    const [historyRequests, setHistoryRequests] = useState<ApprovalRequest[]>([]);

    // Fetch pending requests
    const fetchPending = async () => {
        try {
            const data = await getApprovalPending();
            const transformed = data.map(transformPaymentFms);
            setPendingRequests(transformed);
        } catch (error) {
            console.error('Error fetching pending:', error);
            toast.error('Failed to fetch pending requests');
        }
    };

    // Fetch history requests
    const fetchHistory = async () => {
        try {
            const data = await getApprovalHistory();
            const transformed = data.map(transformPaymentFms);
            setHistoryRequests(transformed);
        } catch (error) {
            console.error('Error fetching history:', error);
            toast.error('Failed to fetch history');
        }
    };

    // Fetch all data
    const fetchAll = async () => {
        setLoading(true);
        await Promise.all([fetchPending(), fetchHistory()]);
        setLoading(false);
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleProcess = (request: ApprovalRequest) => {
        setSelectedRequest(request);
        setShowModal(true);
    };

    const handleSubmitApproval = async () => {
        if (!selectedRequest) return;

        setSubmitting(true);
        try {
            await processApproval(selectedRequest.id, approvalStatus, approvalRemarks);

            // Refresh data
            await fetchAll();

            setShowModal(false);
            setSelectedRequest(null);
            setApprovalRemarks('');
            setApprovalStatus('Approved');
            toast.success(`Request ${approvalStatus.toLowerCase()} successfully!`);
        } catch (error) {
            console.error('Error processing approval:', error);
            toast.error('Failed to process approval');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            Approved: 'bg-green-100 text-green-700 border-green-200',
            Rejected: 'bg-red-100 text-red-700 border-red-200',
        };
        return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const currentRequests = activeTab === 'pending' ? pendingRequests : historyRequests;
    const filteredRequests = currentRequests.filter(
        (req) =>
            req.uniqueNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.fmsName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.payTo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payment Approval</h1>
                    <p className="text-sm text-gray-500 mt-1">Review and approve payment requests</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'pending'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Pending ({pendingRequests.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'history'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        History ({historyRequests.length})
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-72 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search requests..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => fetchAll()}
                        disabled={loading}
                        className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50">
                            <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                <th className="p-4">Status</th>
                                <th className="p-4">Unique No</th>
                                <th className="p-4">FMS Name</th>
                                <th className="p-4">Pay To</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Remarks</th>
                                {activeTab === 'pending' && <th className="p-4 text-right">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <span
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(
                                                req.status
                                            )}`}
                                        >
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-gray-900">{req.uniqueNo}</td>
                                    <td className="p-4 text-gray-600">{req.fmsName}</td>
                                    <td className="p-4 text-gray-600">{req.payTo}</td>
                                    <td className="p-4 font-bold text-gray-900">₹{req.amount.toLocaleString()}</td>
                                    <td className="p-4 text-gray-500">{req.remarks || '-'}</td>
                                    {activeTab === 'pending' && (
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleProcess(req)}
                                                className="px-4 py-2 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold transition-colors"
                                            >
                                                Process
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filteredRequests.length === 0 && (
                                <tr>
                                    <td colSpan={activeTab === 'pending' ? 7 : 6} className="p-12 text-center text-gray-500">
                                        No requests found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {filteredRequests.map((req) => (
                        <div key={req.id} className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900">{req.uniqueNo}</span>
                                <span
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(
                                        req.status
                                    )}`}
                                >
                                    {req.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">
                                <p>FMS: {req.fmsName}</p>
                                <p>Pay To: {req.payTo}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-lg text-gray-900">₹{req.amount.toLocaleString()}</span>
                                {activeTab === 'pending' && (
                                    <button
                                        onClick={() => handleProcess(req)}
                                        className="px-4 py-2 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 text-sm font-bold"
                                    >
                                        Process
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Approval Modal */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100 transition-all">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800">
                                Process Approval - {selectedRequest.uniqueNo}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                    Status
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setApprovalStatus('Approved')}
                                        className={`flex items-center justify-center gap-2 p-3 border rounded-xl font-bold text-sm transition-all ${approvalStatus === 'Approved'
                                            ? 'bg-green-50 border-green-200 text-green-700'
                                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Check size={18} />
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setApprovalStatus('Rejected')}
                                        className={`flex items-center justify-center gap-2 p-3 border rounded-xl font-bold text-sm transition-all ${approvalStatus === 'Rejected'
                                            ? 'bg-red-50 border-red-200 text-red-700'
                                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <X size={18} />
                                        Reject
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                    Approved Amount
                                </label>
                                <div className="p-3 bg-gray-100 rounded-xl text-gray-600 font-medium">
                                    ₹{selectedRequest.amount.toLocaleString()}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                    Remarks
                                </label>
                                <textarea
                                    value={approvalRemarks}
                                    onChange={(e) => setApprovalRemarks(e.target.value)}
                                    placeholder="Enter approval remarks"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitApproval}
                                    disabled={submitting}
                                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentApproval;
