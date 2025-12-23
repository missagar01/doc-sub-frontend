import { useState, useEffect } from 'react';
import { Search, RefreshCw, X } from 'lucide-react';
import useHeaderStore from '../../store/headerStore';
import { toast } from 'react-hot-toast';
import { getMakePaymentPending, getMakePaymentHistory, processMakePayment, transformPaymentFms } from '../../utils/paymentFmsApi';

interface PaymentRecord {
    id: string;
    status: string;
    uniqueNo: string;
    fmsName: string;
    payTo: string;
    amount: number;
    remarks: string;
    paymentType?: string;
}

const MakePayment = () => {
    const { setTitle } = useHeaderStore();
    useEffect(() => { setTitle('Make Payment'); }, [setTitle]);

    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [paymentType, setPaymentType] = useState('Cash');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [pendingPayments, setPendingPayments] = useState<PaymentRecord[]>([]);
    const [historyPayments, setHistoryPayments] = useState<PaymentRecord[]>([]);

    // Fetch pending payments
    const fetchPending = async () => {
        try {
            const data = await getMakePaymentPending();
            const transformed = data.map(transformPaymentFms);
            setPendingPayments(transformed);
        } catch (error) {
            console.error('Error fetching pending:', error);
            toast.error('Failed to fetch pending payments');
        }
    };

    // Fetch history payments
    const fetchHistory = async () => {
        try {
            const data = await getMakePaymentHistory();
            const transformed = data.map(transformPaymentFms);
            setHistoryPayments(transformed);
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

    const handleProcess = (payment: PaymentRecord) => {
        setSelectedPayment(payment);
        setShowModal(true);
    };

    const handleSubmitPayment = async () => {
        if (!selectedPayment) return;

        setSubmitting(true);
        try {
            await processMakePayment(selectedPayment.id, paymentType);

            // Refresh data
            await fetchAll();

            setShowModal(false);
            setSelectedPayment(null);
            setPaymentType('Cash');
            toast.success('Payment processed successfully!');
        } catch (error) {
            console.error('Error processing payment:', error);
            toast.error('Failed to process payment');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            Approved: 'bg-green-100 text-green-700 border-green-200',
            Paid: 'bg-blue-100 text-blue-700 border-blue-200',
        };
        return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const paymentTypes = [
        { value: 'Cash', label: 'Cash' },
        { value: 'Bank Transfer', label: 'Bank Transfer' },
        { value: 'UPI', label: 'UPI' },
        { value: 'Other', label: 'Other' }
    ];

    const currentPayments = activeTab === 'pending' ? pendingPayments : historyPayments;
    const filteredPayments = currentPayments.filter(
        (p) =>
            p.uniqueNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.fmsName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.payTo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Make Payment</h1>
                    <p className="text-sm text-gray-500 mt-1">Process approved payments</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'pending' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        Pending ({pendingPayments.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        History ({historyPayments.length})
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative w-full sm:w-72 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-indigo-100 outline-none"
                        />
                    </div>
                    <button
                        onClick={() => fetchAll()}
                        disabled={loading}
                        className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                <th className="p-4">Status</th>
                                <th className="p-4">Unique No</th>
                                <th className="p-4">FMS Name</th>
                                <th className="p-4">Pay To</th>
                                <th className="p-4">Amount</th>
                                {activeTab === 'history' && <th className="p-4">Type</th>}
                                <th className="p-4">Remarks</th>
                                {activeTab === 'pending' && <th className="p-4 text-right">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredPayments.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50/50">
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(p.status)}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-gray-900">{p.uniqueNo}</td>
                                    <td className="p-4 text-gray-600">{p.fmsName}</td>
                                    <td className="p-4 text-gray-600">{p.payTo}</td>
                                    <td className="p-4 font-bold text-gray-900">₹{p.amount.toLocaleString()}</td>
                                    {activeTab === 'history' && <td className="p-4 text-gray-600">{p.paymentType || '-'}</td>}
                                    <td className="p-4 text-gray-500">{p.remarks || '-'}</td>
                                    {activeTab === 'pending' && (
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleProcess(p)}
                                                className="px-4 py-2 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold"
                                            >
                                                Process
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filteredPayments.length === 0 && (
                                <tr>
                                    <td colSpan={activeTab === 'pending' ? 7 : 7} className="p-12 text-center text-gray-500">
                                        No payments found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {filteredPayments.map((p) => (
                        <div key={p.id} className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900">{p.uniqueNo}</span>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(p.status)}`}>
                                    {p.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">
                                <p>FMS: {p.fmsName}</p>
                                <p>Pay To: {p.payTo}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-lg text-gray-900">₹{p.amount.toLocaleString()}</span>
                                {activeTab === 'pending' && (
                                    <button
                                        onClick={() => handleProcess(p)}
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

            {/* Payment Modal */}
            {showModal && selectedPayment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800">Process Payment - {selectedPayment.uniqueNo}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payment Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {paymentTypes.map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() => setPaymentType(type.value)}
                                            className={`p-3 border rounded-xl font-bold text-sm ${paymentType === type.value ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-200 text-gray-500'}`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Amount</label>
                                <div className="p-3 bg-gray-100 rounded-xl text-gray-600 font-medium">₹{selectedPayment.amount.toLocaleString()}</div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitPayment}
                                    disabled={submitting}
                                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50"
                                >
                                    {submitting ? 'Processing...' : 'Confirm Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MakePayment;
