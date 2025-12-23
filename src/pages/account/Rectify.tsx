import { useState, useEffect } from 'react';
import { Eye, X, ChevronDown, Search, RefreshCw, Send, Check, AlertCircle } from 'lucide-react';
import useHeaderStore from '../../store/headerStore';
import { toast } from 'react-hot-toast';

type FilterType = 'Store' | 'Repair' | 'Car-FMS' | 'Subscription' | 'Freight' | 'Sales' | 'Production' | 'Make Payment';

const storeData = [
    { id: '1', billStatus: 'Rectify', indentNo: 'IND-2024-003', productName: 'Copper Wire', billNo: 'BILL-003', qty: '200', partyName: 'Wire Corp', billAmt: '₹8,500.00', remarks: 'Amount mismatch' },
    { id: '2', billStatus: 'Rectify', indentNo: 'IND-2024-004', productName: 'PVC Pipes', billNo: 'BILL-004', qty: '150', partyName: 'Pipe Industries', billAmt: '₹4,200.00', remarks: 'Missing documentation' },
];

const repairData = [
    { id: '1', repairIndentNo: 'RN-REP-003', department: 'Production', productName: 'Conveyor Belt', vendorName: 'Belt Services', totalBillAmount: '₹6,500.00', remarks: 'Invoice unclear' },
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

const Rectify = () => {
    const { setTitle } = useHeaderStore();
    useEffect(() => { setTitle('Rectify Stage'); }, [setTitle]);

    const [selectedFilter, setSelectedFilter] = useState<FilterType>('Store');
    const [showDropdown, setShowDropdown] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [rectifyRemarks, setRectifyRemarks] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const getData = (filterType: FilterType) => {
        const dataMap: Record<FilterType, any[]> = { 'Store': storeData, 'Repair': repairData, 'Car-FMS': [], 'Subscription': [], 'Freight': [], 'Sales': [], 'Production': [], 'Make Payment': [] };
        return dataMap[filterType];
    };

    const handleProcess = (entry: any) => { setSelectedEntry(entry); setIsModalOpen(true); };

    const handleSubmit = () => {
        toast.success('Rectification submitted for re-audit!');
        setIsModalOpen(false);
        setSelectedEntry(null);
        setRectifyRemarks('');
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = { Rectify: 'bg-orange-100 text-orange-700', Pending: 'bg-yellow-100 text-yellow-700' };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    const currentData = getData(selectedFilter);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div><h1 className="text-2xl font-bold text-gray-900">Rectify Stage</h1><p className="text-sm text-gray-500 mt-1">Review and rectify rejected entries</p></div>
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
                            {selectedFilter === 'Store' && <><th className="p-4">Status</th><th className="p-4">Indent No</th><th className="p-4">Product</th><th className="p-4">Party</th><th className="p-4">Amount</th><th className="p-4">Remarks</th><th className="p-4">Action</th></>}
                            {selectedFilter === 'Repair' && <><th className="p-4">Repair No</th><th className="p-4">Department</th><th className="p-4">Product</th><th className="p-4">Vendor</th><th className="p-4">Amount</th><th className="p-4">Action</th></>}
                        </tr></thead>
                        <tbody className="divide-y divide-gray-50">
                            {selectedFilter === 'Store' && currentData.map((row: any) => (<tr key={row.id} className="hover:bg-gray-50/50"><td className="p-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusBadge(row.billStatus)}`}>{row.billStatus}</span></td><td className="p-4 font-bold text-gray-900">{row.indentNo}</td><td className="p-4 text-gray-600">{row.productName}</td><td className="p-4 text-gray-600">{row.partyName}</td><td className="p-4 font-bold text-gray-900">{row.billAmt}</td><td className="p-4 text-orange-600 text-sm">{row.remarks}</td><td className="p-4"><button onClick={() => handleProcess(row)} className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700"><Eye size={16} />Rectify</button></td></tr>))}
                            {selectedFilter === 'Repair' && currentData.map((row: any) => (<tr key={row.id} className="hover:bg-gray-50/50"><td className="p-4 font-bold text-gray-900">{row.repairIndentNo}</td><td className="p-4 text-gray-600">{row.department}</td><td className="p-4 text-gray-600">{row.productName}</td><td className="p-4 text-gray-600">{row.vendorName}</td><td className="p-4 font-bold text-gray-900">{row.totalBillAmount}</td><td className="p-4"><button onClick={() => handleProcess(row)} className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700"><Eye size={16} />Rectify</button></td></tr>))}
                            {currentData.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-gray-500">No entries found for rectification.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rectify Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-orange-50">
                            <h3 className="font-bold text-lg text-gray-800">Rectify Entry</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-orange-100 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                                {selectedEntry && Object.entries(selectedEntry).filter(([key]) => key !== 'id').slice(0, 5).map(([key, value]) => (
                                    <div key={key} className="flex justify-between"><span className="text-gray-500 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span><span className="text-gray-900 font-medium text-sm">{String(value)}</span></div>
                                ))}
                            </div>
                            <div className="p-3 bg-orange-50 rounded-xl border border-orange-200"><p className="text-sm text-orange-700"><strong>Original Remark:</strong> {selectedEntry?.remarks || 'No remarks'}</p></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Rectification Remarks</label><textarea value={rectifyRemarks} onChange={(e) => setRectifyRemarks(e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-400" placeholder="Explain the rectification..."></textarea></div>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <button onClick={handleSubmit} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700"><Send size={18} />Submit for Re-Audit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rectify;
