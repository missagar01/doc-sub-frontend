import { useState, useEffect } from 'react';
import { Eye, ChevronDown, Search, RefreshCw } from 'lucide-react';
import useHeaderStore from '../../store/headerStore';

type FilterType = 'store' | 'repair' | 'car-fms' | 'subscription' | 'freight' | 'sales' | 'production' | 'make-payment';

const storeData = [
    { id: '1', billStatus: 'Pending', indentNo: 'IND-2024-001', productName: 'Steel Sheets', billNo: 'BILL-001', qty: '100', partyName: 'Acme Corp', billAmt: '₹5,240.00' },
    { id: '2', billStatus: 'Received', indentNo: 'IND-2024-002', productName: 'Aluminum Bars', billNo: 'BILL-002', qty: '50', partyName: 'Global Industries', billAmt: '₹3,200.00' },
];

const repairData = [
    { id: '1', repairIndentNo: 'RN-REP-001', department: 'Maintenance', productName: 'Hydraulic Pump', vendorName: 'TechFix Services', totalBillAmount: '₹3,100.50' },
    { id: '2', repairIndentNo: 'RN-REP-002', department: 'Operations', productName: 'Motor Assembly', vendorName: 'Precision Repair', totalBillAmount: '₹2,500.00' },
];

const carFmsData = [
    { id: '1', repairNo: 'REP-2024-001', garageName: 'Central Garage', vehicleName: 'Vehicle-001', serviceAmount: '₹1,500.00', mgmtApproval: 'Approved' },
    { id: '2', repairNo: 'REP-2024-002', garageName: 'North Service', vehicleName: 'Vehicle-002', serviceAmount: '₹1,200.00', mgmtApproval: 'Pending' },
];

const subscriptionData = [
    { id: '1', subscriptionNo: 'SUB-2024-001', subscriptionName: 'Premium Cloud', price: '₹1,200.00', frequency: 'Annual', endDate: '2025-01-14' },
    { id: '2', subscriptionNo: 'SUB-2024-002', subscriptionName: 'Standard Plan', price: '₹600.00', frequency: 'Monthly', endDate: '2024-02-13' },
];

const freightData = [
    { id: '1', fpnNumber: 'FPN-2024-001', transporterName: 'Express Logistics', from: 'Mumbai', to: 'Delhi', amount: '₹2,500.00', status: 'Completed' },
    { id: '2', fpnNumber: 'FPN-2024-002', transporterName: 'Quick Transport', from: 'Chennai', to: 'Bangalore', amount: '₹1,800.00', status: 'In Transit' },
];

const salesData = [
    { id: '1', orderNo: 'ORD-2024-001', partyName: 'Global Industries', productName: 'Steel Coils', billAmount: '₹8,900.25', totalFreight: '₹1,200.00' },
    { id: '2', orderNo: 'ORD-2024-002', partyName: 'Tech Solutions Ltd', productName: 'Iron Rods', billAmount: '₹5,600.75', totalFreight: '₹800.00' },
];

const productionData = [
    { id: '1', jobCardNo: 'JC-2024-001', partyName: 'ABC Manufacturing', fgName: 'Finished Steel', fgQty: '500 KG', totalRawMaterialUsed: '485 KG' },
    { id: '2', jobCardNo: 'JC-2024-002', partyName: 'XYZ Industries', fgName: 'Aluminum Sheets', fgQty: '300 KG', totalRawMaterialUsed: '345 KG' },
];

const makePaymentData = [
    { id: '1', apPaymentNumber: 'AP-2024-001', payTo: 'Acme Corp', amountToBePaid: '₹5,240.00', status: 'Completed', remarks: 'Material supply' },
    { id: '2', apPaymentNumber: 'AP-2024-002', payTo: 'Global Industries', amountToBePaid: '₹3,100.50', status: 'Pending', remarks: 'Repair service' },
];

const filterOptions = [
    { value: 'store', label: 'Store' },
    { value: 'repair', label: 'Repair' },
    { value: 'car-fms', label: 'Car-FMS' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'freight', label: 'Freight' },
    { value: 'sales', label: 'Sales' },
    { value: 'production', label: 'Production' },
    { value: 'make-payment', label: 'Make Payment' },
];

const TallyData = () => {
    const { setTitle } = useHeaderStore();
    useEffect(() => { setTitle('Tally Data'); }, [setTitle]);

    const [filter, setFilter] = useState<FilterType>('store');
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const getData = (filterType: FilterType) => {
        const dataMap: Record<FilterType, any[]> = { store: storeData, repair: repairData, 'car-fms': carFmsData, subscription: subscriptionData, freight: freightData, sales: salesData, production: productionData, 'make-payment': makePaymentData };
        return dataMap[filterType];
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = { Completed: 'bg-green-100 text-green-700', Pending: 'bg-yellow-100 text-yellow-700', Received: 'bg-blue-100 text-blue-700', Approved: 'bg-green-100 text-green-700', 'In Transit': 'bg-orange-100 text-orange-700' };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    const currentData = getData(filter);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div><h1 className="text-2xl font-bold text-gray-900">Tally Data</h1><p className="text-sm text-gray-500 mt-1">View and manage all tally entries</p></div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-48">
                        <button onClick={() => setShowDropdown(!showDropdown)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between hover:border-indigo-300">
                            <span className="text-gray-700 font-medium">{filterOptions.find(opt => opt.value === filter)?.label}</span>
                            <ChevronDown size={18} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showDropdown && (
                            <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                {filterOptions.map((option) => (
                                    <button key={option.value} onClick={() => { setFilter(option.value as FilterType); setShowDropdown(false); }}
                                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${filter === option.value ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-700'}`}>
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
                            {filter === 'store' && <><th className="p-4">Status</th><th className="p-4">Indent No</th><th className="p-4">Product</th><th className="p-4">Bill No</th><th className="p-4">Qty</th><th className="p-4">Party</th><th className="p-4">Amount</th><th className="p-4">Action</th></>}
                            {filter === 'repair' && <><th className="p-4">Repair No</th><th className="p-4">Department</th><th className="p-4">Product</th><th className="p-4">Vendor</th><th className="p-4">Amount</th><th className="p-4">Action</th></>}
                            {filter === 'car-fms' && <><th className="p-4">Repair No</th><th className="p-4">Garage</th><th className="p-4">Vehicle</th><th className="p-4">Amount</th><th className="p-4">Approval</th><th className="p-4">Action</th></>}
                            {filter === 'subscription' && <><th className="p-4">Sub No</th><th className="p-4">Name</th><th className="p-4">Price</th><th className="p-4">Frequency</th><th className="p-4">End Date</th><th className="p-4">Action</th></>}
                            {filter === 'freight' && <><th className="p-4">FPN No</th><th className="p-4">Transporter</th><th className="p-4">From</th><th className="p-4">To</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Action</th></>}
                            {filter === 'sales' && <><th className="p-4">Order No</th><th className="p-4">Party</th><th className="p-4">Product</th><th className="p-4">Bill Amt</th><th className="p-4">Freight</th><th className="p-4">Action</th></>}
                            {filter === 'production' && <><th className="p-4">Job Card</th><th className="p-4">Party</th><th className="p-4">FG Name</th><th className="p-4">FG Qty</th><th className="p-4">Raw Material</th><th className="p-4">Action</th></>}
                            {filter === 'make-payment' && <><th className="p-4">Payment No</th><th className="p-4">Pay To</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Remarks</th><th className="p-4">Action</th></>}
                        </tr></thead>
                        <tbody className="divide-y divide-gray-50">
                            {filter === 'store' && currentData.map((row: any) => (<tr key={row.id} className="hover:bg-gray-50/50"><td className="p-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusBadge(row.billStatus)}`}>{row.billStatus}</span></td><td className="p-4 font-bold text-gray-900">{row.indentNo}</td><td className="p-4 text-gray-600">{row.productName}</td><td className="p-4 text-gray-600">{row.billNo}</td><td className="p-4 text-gray-600">{row.qty}</td><td className="p-4 text-gray-600">{row.partyName}</td><td className="p-4 font-bold text-gray-900">{row.billAmt}</td><td className="p-4"><button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Eye size={16} />View</button></td></tr>))}
                            {filter === 'repair' && currentData.map((row: any) => (<tr key={row.id} className="hover:bg-gray-50/50"><td className="p-4 font-bold text-gray-900">{row.repairIndentNo}</td><td className="p-4 text-gray-600">{row.department}</td><td className="p-4 text-gray-600">{row.productName}</td><td className="p-4 text-gray-600">{row.vendorName}</td><td className="p-4 font-bold text-gray-900">{row.totalBillAmount}</td><td className="p-4"><button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Eye size={16} />View</button></td></tr>))}
                            {filter === 'car-fms' && currentData.map((row: any) => (<tr key={row.id} className="hover:bg-gray-50/50"><td className="p-4 font-bold text-gray-900">{row.repairNo}</td><td className="p-4 text-gray-600">{row.garageName}</td><td className="p-4 text-gray-600">{row.vehicleName}</td><td className="p-4 font-bold text-gray-900">{row.serviceAmount}</td><td className="p-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusBadge(row.mgmtApproval)}`}>{row.mgmtApproval}</span></td><td className="p-4"><button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Eye size={16} />View</button></td></tr>))}
                            {filter === 'subscription' && currentData.map((row: any) => (<tr key={row.id} className="hover:bg-gray-50/50"><td className="p-4 font-bold text-gray-900">{row.subscriptionNo}</td><td className="p-4 text-gray-600">{row.subscriptionName}</td><td className="p-4 font-bold text-gray-900">{row.price}</td><td className="p-4 text-gray-600">{row.frequency}</td><td className="p-4 text-gray-600">{row.endDate}</td><td className="p-4"><button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Eye size={16} />View</button></td></tr>))}
                            {filter === 'freight' && currentData.map((row: any) => (<tr key={row.id} className="hover:bg-gray-50/50"><td className="p-4 font-bold text-gray-900">{row.fpnNumber}</td><td className="p-4 text-gray-600">{row.transporterName}</td><td className="p-4 text-gray-600">{row.from}</td><td className="p-4 text-gray-600">{row.to}</td><td className="p-4 font-bold text-gray-900">{row.amount}</td><td className="p-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusBadge(row.status)}`}>{row.status}</span></td><td className="p-4"><button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Eye size={16} />View</button></td></tr>))}
                            {filter === 'sales' && currentData.map((row: any) => (<tr key={row.id} className="hover:bg-gray-50/50"><td className="p-4 font-bold text-gray-900">{row.orderNo}</td><td className="p-4 text-gray-600">{row.partyName}</td><td className="p-4 text-gray-600">{row.productName}</td><td className="p-4 font-bold text-gray-900">{row.billAmount}</td><td className="p-4 text-gray-900">{row.totalFreight}</td><td className="p-4"><button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Eye size={16} />View</button></td></tr>))}
                            {filter === 'production' && currentData.map((row: any) => (<tr key={row.id} className="hover:bg-gray-50/50"><td className="p-4 font-bold text-gray-900">{row.jobCardNo}</td><td className="p-4 text-gray-600">{row.partyName}</td><td className="p-4 text-gray-600">{row.fgName}</td><td className="p-4 text-gray-900">{row.fgQty}</td><td className="p-4 text-gray-600">{row.totalRawMaterialUsed}</td><td className="p-4"><button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Eye size={16} />View</button></td></tr>))}
                            {filter === 'make-payment' && currentData.map((row: any) => (<tr key={row.id} className="hover:bg-gray-50/50"><td className="p-4 font-bold text-gray-900">{row.apPaymentNumber}</td><td className="p-4 text-gray-600">{row.payTo}</td><td className="p-4 font-bold text-gray-900">{row.amountToBePaid}</td><td className="p-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusBadge(row.status)}`}>{row.status}</span></td><td className="p-4 text-gray-600">{row.remarks}</td><td className="p-4"><button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"><Eye size={16} />View</button></td></tr>))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TallyData;
