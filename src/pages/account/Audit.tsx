import { useState, useEffect } from 'react';
import { Eye, X, ChevronDown, Search, RefreshCw, Check, AlertCircle } from 'lucide-react';
import useHeaderStore from '../../store/headerStore';
import { toast } from 'react-hot-toast';

type FilterType = 'Store' | 'Repair' | 'Car-FMS' | 'Subscription' | 'Freight' | 'Sales' | 'Production' | 'Make Payment';

const storeData = [
    { id: '1', billStatus: 'Pending', indentNo: 'IND-2024-001', productName: 'Steel Sheets', billNo: 'BILL-001', qty: '100', partyName: 'Acme Corp', billAmt: '₹5,240.00' },
    { id: '2', billStatus: 'Received', indentNo: 'IND-2024-002', productName: 'Aluminum Bars', billNo: 'BILL-002', qty: '50', partyName: 'Global Industries', billAmt: '₹3,200.00' },
];

const repairData = [
    { id: '1', repairIndentNo: 'RN-REP-001', department: 'Maintenance', productName: 'Hydraulic Pump', vendorName: 'TechFix Services', totalBillAmount: '₹3,100.50' },
    { id: '2', repairIndentNo: 'RN-REP-002', department: 'Operations', productName: 'Motor Assembly', vendorName: 'Precision Repair', totalBillAmount: '₹2,500.00' },
];

const subscriptionData = [
    { id: '1', subscriptionNo: 'SUB-2024-001', subscriptionName: 'Premium Cloud', price: '₹1,200.00', frequency: 'Annual', endDate: '2025-01-14' },
];

const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'Store', label: 'Store' },
    { value: 'Repair', label: 'Repair' },
    { value: 'Car-FMS', label: 'Car-FMS' },
    { value: 'Subscription', label: 'Subscription' },
    { value: 'Freight', label: 'Freight' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Production', label: 'Production' },
    { value: 'Make Payment', label: 'Make Payment' },
];

const Audit = () => {
    const { setTitle } = useHeaderStore();
    useEffect(() => { setTitle('Audit Stage'); }, [setTitle]);

    const [selectedFilter, setSelectedFilter] = useState<FilterType>('Store');
    const [showDropdown, setShowDropdown] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [remarks, setRemarks] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const getData = (filterType: FilterType) => {
        const dataMap: Record<FilterType, any[]> = { 'Store': storeData, 'Repair': repairData, 'Car-FMS': [], 'Subscription': subscriptionData, 'Freight': [], 'Sales': [], 'Production': [], 'Make Payment': [] };
        return dataMap[filterType];
    };

    const handleProcess = (entry: any) => { setSelectedEntry(entry); setIsModalOpen(true); };

    const handleSubmit = (status: string) => {
        toast.success(`Entry ${status.toLowerCase()} successfully!`);
        setIsModalOpen(false);
        setSelectedEntry(null);
        setRemarks('');
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = { Pending: 'bg-yellow-100 text-yellow-700', Received: 'bg-blue-100 text-blue-700', Approved: 'bg-green-100 text-green-700' };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    const currentData = getData(selectedFilter);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div><h1 className="text-2xl font-bold text-gray-900">Audit Stage</h1><p className="text-sm text-gray-500 mt-1">Review and approve or reject entries</p></div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-48">
                        <button onClick={() => setShowDropdown(!showDropdown)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between hover:border-indigo-300">
                            <span className="text-gray-700 font-medium">{filterOptions.find(opt => opt.value === selectedFilter)?.label}</span>
                            <ChevronDown size={18} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showDropdown && (
                            <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                {filterOptions.map((option) => (
                                    <button key={option.value} onClick={() => { setSelectedFilter(option.value); setShowDropdown(false); }}
                                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${selectedFilter === option.value ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-700'}`}>
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="relative flex-1 sm:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-indigo-100 outline-none" /></div>
                </div>
                <button onClick={() => setLoading(!loading)} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100"><RefreshCw className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} /></button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50"><tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                            {selectedFilter === 'Store' && <><th className="p-4">Status</th><th className="p-4">Indent No</th><th className="p-4">Product</th><th className="p-4">Bill No</th><th className="p-4">Party</th><th className="p-4">Amount</th><th className="p-4">Action</th></>}
                            {selectedFilter === 'Repair' && <><th className="p-4">Repair No</th><th className="p-4">Department</th><th className="p-4">Product</th><th className="p-4">Vendor</th><th className="p-4">Amount</th><th className="p-4">Action</th></>}
                            {selectedFilter === 'Subscription' && <><th className="p-4">Sub No</th><th className="p-4">Name</th><th className="p-4">Price</th><th className="p-4">Frequency</th><th className="p-4">End Date</th><th className="p-4">Action</th></>}
                        </tr></thead>
                        <tbody className="divide-y divide-gray-50">
                            {selectedFilter === 'Store' && currentData.map((row: any) => (<tr key={row.id} className="hover:bg-gray-50/50"><td className="p-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusBadge(row.billStatus)}`}>{row.billStatus}</span></td><td className="p-4 font-bold text-gray-900">{row.indentNo}</td><td className="p-4 text-gray-600">{row.productName}</td><td className="p-4 text-gray-600">{row.billNo}</td><td className="p-4 text-gray-600">{row.partyName}</td><td className="p-4 font-bold text-gray-900">{row.billAmt}</td><td className="p-4"><button onClick={() => handleProcess(row)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Eye size={16} />Process</button></td></tr>))}
                            {selectedFilter === 'Repair' && currentData.map((row: any) => (<tr key={row.id} className="hover:bg-gray-50/50"><td className="p-4 font-bold text-gray-900">{row.repairIndentNo}</td><td className="p-4 text-gray-600">{row.department}</td><td className="p-4 text-gray-600">{row.productName}</td><td className="p-4 text-gray-600">{row.vendorName}</td><td className="p-4 font-bold text-gray-900">{row.totalBillAmount}</td><td className="p-4"><button onClick={() => handleProcess(row)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Eye size={16} />Process</button></td></tr>))}
                            {selectedFilter === 'Subscription' && currentData.map((row: any) => (<tr key={row.id} className="hover:bg-gray-50/50"><td className="p-4 font-bold text-gray-900">{row.subscriptionNo}</td><td className="p-4 text-gray-600">{row.subscriptionName}</td><td className="p-4 font-bold text-gray-900">{row.price}</td><td className="p-4 text-gray-600">{row.frequency}</td><td className="p-4 text-gray-600">{row.endDate}</td><td className="p-4"><button onClick={() => handleProcess(row)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Eye size={16} />Process</button></td></tr>))}
                            {currentData.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-gray-500">No entries found for this category.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Process Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">Audit Entry</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                                {selectedEntry && Object.entries(selectedEntry).filter(([key]) => key !== 'id').slice(0, 4).map(([key, value]) => (
                                    <div key={key} className="flex justify-between"><span className="text-gray-500 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span><span className="text-gray-900 font-medium text-sm">{String(value)}</span></div>
                                ))}
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label><textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" placeholder="Add remarks..."></textarea></div>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button onClick={() => handleSubmit('Approved')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"><Check size={18} />Approve</button>
                            <button onClick={() => handleSubmit('Rejected')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"><AlertCircle size={18} />Reject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Audit;
