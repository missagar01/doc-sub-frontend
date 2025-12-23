import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, RefreshCw } from 'lucide-react';
import useHeaderStore from '../../store/headerStore';
import { toast } from 'react-hot-toast';
import { createPaymentFms, getAllPaymentFms, deletePaymentFms, PaymentFmsRequest } from '../../utils/paymentFmsApi';

interface PaymentRequest {
    id: string;
    status: string;
    uniqueNo: string;
    fmsName: string;
    payTo: string;
    amount: number;
    remarks: string;
    attachment?: string;
    createdAt: string;
}

const RequestForm = () => {
    const { setTitle } = useHeaderStore();

    useEffect(() => {
        setTitle('Payment Request Form');
    }, [setTitle]);

    const [fmsName, setFmsName] = useState('');
    const [payTo, setPayTo] = useState('');
    const [amount, setAmount] = useState('');
    const [remarks, setRemarks] = useState('');
    const [fileName, setFileName] = useState('');
    const [uniqueNo, setUniqueNo] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [requests, setRequests] = useState<PaymentRequest[]>([]);

    // Fetch all requests on component mount
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await getAllPaymentFms();
            // Transform the API response to match our interface
            const transformed = data.map((item: PaymentFmsRequest) => ({
                id: item.id || '',
                status: item.status || 'Pending',
                uniqueNo: item.uniqueNo || (item as any).unique_no || '',
                fmsName: item.fmsName || (item as any).fms_name || '',
                payTo: item.payTo || (item as any).pay_to || '',
                amount: Number(item.amount) || 0,
                remarks: item.remarks || '',
                attachment: item.attachment || '',
                createdAt: item.createdAt || (item as any).created_at || new Date().toISOString(),
            }));
            setRequests(transformed);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const filteredRequests = requests.filter(
        (req) =>
            req.uniqueNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.fmsName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.payTo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fmsName || !payTo || !amount || !uniqueNo) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            await createPaymentFms({
                uniqueNo,
                fmsName,
                payTo,
                amount: Number.parseFloat(amount),
                remarks,
                attachment: fileName || undefined,
            });

            // Reset form
            setFmsName('');
            setPayTo('');
            setAmount('');
            setRemarks('');
            setFileName('');

            // Refresh the list
            await fetchRequests();

            toast.success('Request submitted successfully!');
        } catch (error) {
            console.error('Error submitting request:', error);
            toast.error('Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deletePaymentFms(id);
            setRequests(requests.filter((req) => req.id !== id));
            toast.success('Request deleted');
        } catch (error) {
            console.error('Error deleting request:', error);
            toast.error('Failed to delete request');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            Approved: 'bg-green-100 text-green-700 border-green-200',
            Rejected: 'bg-red-100 text-red-700 border-red-200',
            Processing: 'bg-blue-100 text-blue-700 border-blue-200',
        };
        return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payment Request Form</h1>
                    <p className="text-sm text-gray-500 mt-1">Submit and manage payment requests</p>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                    <h2 className="text-lg font-bold text-gray-900">Submit New Request</h2>
                    <p className="text-sm text-gray-500 mt-1">Fill in the details to create a payment request</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                Unique No *
                            </label>
                            <input
                                type="text"
                                value={uniqueNo}
                                onChange={(e) => setUniqueNo(e.target.value)}
                                placeholder="Enter unique number"
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                FMS Name *
                            </label>
                            <input
                                type="text"
                                value={fmsName}
                                onChange={(e) => setFmsName(e.target.value)}
                                placeholder="Enter FMS Name"
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                Pay To *
                            </label>
                            <input
                                type="text"
                                value={payTo}
                                onChange={(e) => setPayTo(e.target.value)}
                                placeholder="Enter recipient name"
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                Amount to Be Paid *
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                Attachment
                            </label>
                            <input
                                type="file"
                                onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                Remarks
                            </label>
                            <input
                                type="text"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Enter additional remarks"
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <RefreshCw size={20} className="animate-spin" />
                        ) : (
                            <Plus size={20} />
                        )}
                        {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                </form>
            </div>

            {/* Submitted Requests */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900">Submitted Requests</h2>
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
                            onClick={() => fetchRequests()}
                            disabled={loading}
                            className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

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
                                    <th className="p-4">Attachment</th>
                                    <th className="p-4 text-right">Action</th>
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
                                        <td className="p-4 text-gray-500">{req.attachment || '-'}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(req.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredRequests.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-gray-500">
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
                                    <button
                                        onClick={() => handleDelete(req.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestForm;
