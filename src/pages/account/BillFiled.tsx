import { useState, useEffect } from 'react';
import { Search, RefreshCw, FileText, Download, Eye } from 'lucide-react';
import useHeaderStore from '../../store/headerStore';

const billedData = [
    { id: '1', billNo: 'BILL-2024-001', partyName: 'Acme Corp', billAmount: '₹5,240.00', billDate: '2024-01-15', category: 'Store', status: 'Filed' },
    { id: '2', billNo: 'BILL-2024-002', partyName: 'Global Industries', billAmount: '₹3,200.00', billDate: '2024-01-16', category: 'Repair', status: 'Filed' },
    { id: '3', billNo: 'BILL-2024-003', partyName: 'TechFix Services', billAmount: '₹3,100.50', billDate: '2024-01-17', category: 'Repair', status: 'Filed' },
    { id: '4', billNo: 'BILL-2024-004', partyName: 'Express Logistics', billAmount: '₹2,500.00', billDate: '2024-01-18', category: 'Freight', status: 'Filed' },
    { id: '5', billNo: 'BILL-2024-005', partyName: 'Quick Transport', billAmount: '₹1,800.00', billDate: '2024-01-19', category: 'Freight', status: 'Filed' },
];

const BillFiled = () => {
    const { setTitle } = useHeaderStore();
    useEffect(() => { setTitle('Bill Filed'); }, [setTitle]);

    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('all');

    const categories = ['all', 'Store', 'Repair', 'Freight', 'Sales', 'Production'];

    const filteredData = billedData.filter(bill => {
        const matchesSearch = bill.billNo.toLowerCase().includes(searchTerm.toLowerCase()) || bill.partyName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || bill.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div><h1 className="text-2xl font-bold text-gray-900">Bill Filed</h1><p className="text-sm text-gray-500 mt-1">View all completed and filed bills</p></div>
                <div className="flex items-center gap-2">
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold text-sm">{billedData.length} Bills Filed</span>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {categories.map((cat) => (
                            <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${categoryFilter === cat ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                {cat === 'all' ? 'All' : cat}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Search bills..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-indigo-100 outline-none" /></div>
                    <button onClick={() => setLoading(!loading)} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100"><RefreshCw className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} /></button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50"><tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                            <th className="p-4">Bill No</th><th className="p-4">Party Name</th><th className="p-4">Amount</th><th className="p-4">Bill Date</th><th className="p-4">Category</th><th className="p-4">Status</th><th className="p-4">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredData.map((bill) => (
                                <tr key={bill.id} className="hover:bg-gray-50/50">
                                    <td className="p-4"><div className="flex items-center gap-2"><FileText size={16} className="text-indigo-500" /><span className="font-bold text-gray-900">{bill.billNo}</span></div></td>
                                    <td className="p-4 text-gray-600">{bill.partyName}</td>
                                    <td className="p-4 font-bold text-gray-900">{bill.billAmount}</td>
                                    <td className="p-4 text-gray-600">{bill.billDate}</td>
                                    <td className="p-4"><span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">{bill.category}</span></td>
                                    <td className="p-4"><span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">{bill.status}</span></td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100"><Eye size={16} className="text-gray-500" /></button>
                                            <button className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100"><Download size={16} className="text-gray-500" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-gray-500">No bills found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BillFiled;
