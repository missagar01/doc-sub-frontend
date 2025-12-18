import { useState, useEffect } from 'react';
import { Search, Clock, X, FileCheck } from 'lucide-react';
import useDataStore, { LoanItem } from '../../store/dataStore';
import useHeaderStore from '../../store/headerStore';
import { toast } from 'react-hot-toast';

const LoanNOC = () => {
    const { setTitle } = useHeaderStore();
    const { loans, updateLoan } = useDataStore();

    useEffect(() => {
        setTitle('Collect NOC');
    }, [setTitle]);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<LoanItem | null>(null);
    const [collectNoc, setCollectNoc] = useState('Yes');

    // Pending: Documents Collected ('Yes') but NOC not yet set
    const pendingLoans = loans.filter(loan => 
        loan.documentStatus === 'Yes' && 
        !loan.collectNocStatus &&
        (
            loan.bankName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            loan.loanName.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // History: NOC Status is set
    const historyLoans = loans.filter(loan => 
        loan.collectNocStatus &&
        (
            loan.bankName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            loan.loanName.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const handleActionClick = (loan: LoanItem) => {
        setSelectedLoan(loan);
        setCollectNoc(loan.collectNocStatus || 'Yes');
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedLoan) {
            updateLoan(selectedLoan.id, {
                collectNocStatus: collectNoc as 'Yes' | 'No'
            });
            toast.success('NOC status updated successfully');
            setIsModalOpen(false);
            setSelectedLoan(null);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Unified Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Collect NOC</h1>
                    <p className="text-gray-500 text-sm mt-1">Track NOC collection status</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search loans..."
                            className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                activeTab === 'pending'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                activeTab === 'history'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            History
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'pending' ? (
                <>
                {/* Desktop Table - Pending */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Serial No.</th>
                                    <th className="p-4">Loan Name</th>
                                    <th className="p-4">Bank Name</th>
                                    <th className="p-4">Loan Start Date</th>
                                    <th className="p-4">Loan End Date</th>
                                    <th className="p-4">Closer Request Date</th>
                                    <th className="p-4">Document Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-50">
                                {pendingLoans.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleActionClick(item)}
                                                className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                                            >
                                                Action
                                            </button>
                                        </td>
                                        <td className="p-4 font-medium text-gray-900">{item.sn}</td>
                                        <td className="p-4 font-medium text-gray-900">{item.loanName}</td>
                                        <td className="p-4 text-gray-600">{item.bankName}</td>
                                        <td className="p-4 text-gray-600">{item.startDate}</td>
                                        <td className="p-4 text-gray-600">{item.endDate}</td>
                                        <td className="p-4 text-gray-600">{item.requestDate}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                item.documentStatus === 'Yes' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                                {item.documentStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {pendingLoans.length === 0 && (
                                     <tr>
                                        <td colSpan={8} className="p-8 text-center text-gray-500">No pending NOC collections</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                 {/* Mobile Cards - Pending */}
                 <div className="md:hidden grid grid-cols-1 gap-4">
                    {pendingLoans.map((item) => (
                        <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                             <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <FileCheck size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{item.loanName}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">{item.bankName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleActionClick(item)}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                                >
                                    Action
                                </button>
                            </div>
                             <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Loan Start Date:</span>
                                    <span className="font-medium text-gray-900">{item.startDate}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Loan End Date:</span>
                                    <span className="font-medium text-gray-900">{item.endDate}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Closer Request Date:</span>
                                    <span className="font-medium text-gray-900">{item.requestDate}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Document Status:</span>
                                    <span className={`font-medium ${
                                        item.documentStatus === 'Yes' ? 'text-green-600' : 'text-red-600'
                                    }`}>{item.documentStatus}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
                </>
            ) : (
                <>
                {/* Desktop Table - History */}
                 <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="p-4">Serial No.</th>
                                    <th className="p-4">Loan Name</th>
                                    <th className="p-4">Bank Name</th>
                                    <th className="p-4">Loan Start Date</th>
                                    <th className="p-4">Loan End Date</th>
                                    <th className="p-4">Closer Request Date</th>
                                    <th className="p-4">Collect NOC</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-50">
                                {historyLoans.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="p-4 font-medium text-gray-900">{item.sn}</td>
                                        <td className="p-4 font-medium text-gray-900">{item.loanName}</td>
                                        <td className="p-4 text-gray-600">{item.bankName}</td>
                                        <td className="p-4 text-gray-600">{item.startDate}</td>
                                        <td className="p-4 text-gray-600">{item.endDate}</td>
                                        <td className="p-4 text-gray-600">{item.requestDate}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                item.collectNocStatus === 'Yes' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                                {item.collectNocStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                 {historyLoans.length === 0 && (
                                     <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500">No NOC history found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                 {/* Mobile Cards - History */}
                 <div className="md:hidden grid grid-cols-1 gap-4">
                    {historyLoans.map((item) => (
                        <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                             <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gray-50 text-gray-600 rounded-xl">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{item.loanName}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">{item.bankName}</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                    item.collectNocStatus === 'Yes' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                    NOC: {item.collectNocStatus}
                                </span>
                            </div>
                             <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Loan Start Date:</span>
                                    <span className="font-medium text-gray-900">{item.startDate}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Loan End Date:</span>
                                    <span className="font-medium text-gray-900">{item.endDate}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Closer Request Date:</span>
                                    <span className="font-medium text-gray-900">{item.requestDate}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
                </>
            )}

            {/* Action Modal */}
            {isModalOpen && selectedLoan && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">Collect NOC</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {/* Read Only Fields */}
                             <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-gray-500">Serial No.</span>
                                    <span className="font-medium text-gray-900">{selectedLoan.sn}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Loan Name</span>
                                    <span className="font-medium text-gray-900">{selectedLoan.loanName}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Bank Name</span>
                                    <span className="font-medium text-gray-900">{selectedLoan.bankName}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Loan Start Date</span>
                                    <span className="font-medium text-gray-900">{selectedLoan.startDate}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Loan End Date</span>
                                    <span className="font-medium text-gray-900">{selectedLoan.endDate}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Closer Request Date</span>
                                    <span className="font-medium text-gray-900">{selectedLoan.requestDate}</span>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Collect NOC</label>
                                <select 
                                    className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    value={collectNoc}
                                    onChange={e => setCollectNoc(e.target.value)}
                                >
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-md"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoanNOC;
