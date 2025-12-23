import { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import useHeaderStore from '../../store/headerStore';
import { toast } from 'react-hot-toast';
import { getTallyEntryPending, getTallyEntryHistory, processTallyEntry, transformPaymentFms } from '../../utils/paymentFmsApi';

interface TallyEntryRecord {
    id: string;
    status: string;
    uniqueNo: string;
    payTo: string;
    amount: number;
    paymentType: string;
    remarks: string;
}

const TallyEntry = () => {
    const { setTitle } = useHeaderStore();
    useEffect(() => { setTitle('Tally Entry'); }, [setTitle]);

    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [pendingEntries, setPendingEntries] = useState<TallyEntryRecord[]>([]);
    const [historyEntries, setHistoryEntries] = useState<TallyEntryRecord[]>([]);

    // Fetch pending entries
    const fetchPending = async () => {
        try {
            const data = await getTallyEntryPending();
            const transformed = data.map(transformPaymentFms);
            setPendingEntries(transformed);
        } catch (error) {
            console.error('Error fetching pending:', error);
            toast.error('Failed to fetch pending entries');
        }
    };

    // Fetch history entries
    const fetchHistory = async () => {
        try {
            const data = await getTallyEntryHistory();
            const transformed = data.map(transformPaymentFms);
            setHistoryEntries(transformed);
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

    const handleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? pendingEntries.map((e) => e.id) : []);
    };

    const handleSelectEntry = (id: string, checked: boolean) => {
        setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter((sid) => sid !== id));
    };

    const handleSubmitEntries = async () => {
        if (selectedIds.length === 0) {
            toast.error('Please select at least one entry');
            return;
        }

        setSubmitting(true);
        try {
            await processTallyEntry(selectedIds);

            // Refresh data
            await fetchAll();

            setSelectedIds([]);
            toast.success(`${selectedIds.length} entries processed successfully!`);
        } catch (error) {
            console.error('Error processing entries:', error);
            toast.error('Failed to process entries');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            Paid: 'bg-blue-100 text-blue-700 border-blue-200',
            Processed: 'bg-green-100 text-green-700 border-green-200',
        };
        return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const currentEntries = activeTab === 'pending' ? pendingEntries : historyEntries;
    const filteredEntries = currentEntries.filter(
        (e) =>
            e.uniqueNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.payTo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tally Entry</h1>
                    <p className="text-sm text-gray-500 mt-1">Process tally entries for paid payments</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'pending' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        Pending ({pendingEntries.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        History ({historyEntries.length})
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-72 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search entries..."
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
                {activeTab === 'pending' && selectedIds.length > 0 && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setSelectedIds([])}
                            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-bold hover:bg-gray-50"
                        >
                            Clear
                        </button>
                        <button
                            onClick={handleSubmitEntries}
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50"
                        >
                            {submitting ? 'Processing...' : `Submit (${selectedIds.length})`}
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                {activeTab === 'pending' && (
                                    <th className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === pendingEntries.length && pendingEntries.length > 0}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </th>
                                )}
                                <th className="p-4">Status</th>
                                <th className="p-4">Unique No</th>
                                <th className="p-4">Pay To</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Payment Type</th>
                                <th className="p-4">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredEntries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50/50">
                                    {activeTab === 'pending' && (
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(entry.id)}
                                                onChange={(e) => handleSelectEntry(entry.id, e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </td>
                                    )}
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(entry.status)}`}>
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-gray-900">{entry.uniqueNo}</td>
                                    <td className="p-4 text-gray-600">{entry.payTo}</td>
                                    <td className="p-4 font-bold text-gray-900">₹{entry.amount.toLocaleString()}</td>
                                    <td className="p-4 text-gray-600">{entry.paymentType || '-'}</td>
                                    <td className="p-4 text-gray-500">{entry.remarks || '-'}</td>
                                </tr>
                            ))}
                            {filteredEntries.length === 0 && (
                                <tr>
                                    <td colSpan={activeTab === 'pending' ? 7 : 6} className="p-12 text-center text-gray-500">
                                        No entries found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {filteredEntries.map((entry) => (
                        <div key={entry.id} className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {activeTab === 'pending' && (
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(entry.id)}
                                            onChange={(e) => handleSelectEntry(entry.id, e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                                        />
                                    )}
                                    <span className="font-bold text-gray-900">{entry.uniqueNo}</span>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(entry.status)}`}>
                                    {entry.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">
                                <p>Pay To: {entry.payTo}</p>
                                <p>Type: {entry.paymentType || '-'}</p>
                            </div>
                            <div className="font-bold text-lg text-gray-900">₹{entry.amount.toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TallyEntry;
