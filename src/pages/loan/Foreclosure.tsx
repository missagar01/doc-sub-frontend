import { useState, useEffect } from 'react';
import { Search, Building, Calendar, User, Clock, X } from 'lucide-react';
import useDataStore, { LoanItem } from '../../store/dataStore';
import useHeaderStore from '../../store/headerStore';
import { toast } from 'react-hot-toast';

const Foreclosure = () => {
    const { setTitle } = useHeaderStore();
    const { loans, updateLoan } = useDataStore();

    useEffect(() => {
        setTitle('Requested Foreclosure');
    }, [setTitle]);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<LoanItem | null>(null);
    const [formData, setFormData] = useState({
        requestDate: new Date().toISOString().split('T')[0],
        requesterName: 'Admin' 
    });

    const pendingLoans = loans.filter(loan => !loan.foreclosureStatus && (
        loan.bankName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        loan.loanName.toLowerCase().includes(searchTerm.toLowerCase())
    ));

    const historyLoans = loans.filter(loan => loan.foreclosureStatus && (
        loan.bankName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        loan.loanName.toLowerCase().includes(searchTerm.toLowerCase())
    ));

    const handleActionClick = (loan: LoanItem) => {
        setSelectedLoan(loan);
        setFormData({
            requestDate: loan.requestDate || new Date().toISOString().split('T')[0],
            requesterName: loan.requesterName || 'Admin'
        });
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedLoan) {
            updateLoan(selectedLoan.id, {
                foreclosureStatus: 'Pending',
                requestDate: formData.requestDate,
                requesterName: formData.requesterName
            });
            toast.success('Foreclosure requested successfully');
            setIsModalOpen(false);
            setSelectedLoan(null);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Requested Foreclosure</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage foreclosure requests</p>
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
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">EMI</th>
                                    <th className="p-4">Loan Start Date</th>
                                    <th className="p-4">Loan End Date</th>
                                    <th className="p-4">Provided Document Name</th>
                                    <th className="p-4">Remarks</th>
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
                                        <td className="p-4 text-gray-900 font-medium">{item.amount}</td>
                                        <td className="p-4 text-gray-600">{item.emi}</td>
                                        <td className="p-4 text-gray-600">{item.startDate}</td>
                                        <td className="p-4 text-gray-600">{item.endDate}</td>
                                        <td className="p-4 text-gray-600">{item.providedDocument}</td>
                                        <td className="p-4 text-gray-500 italic">{item.remarks}</td>
                                    </tr>
                                ))}
                                {pendingLoans.length === 0 && (
                                     <tr>
                                        <td colSpan={10} className="p-8 text-center text-gray-500">No pending loans found</td>
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
                                        <Building size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{item.loanName}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">{item.bankName} • {item.sn}</p>
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
                                    <span>Amount:</span>
                                    <span className="font-medium text-gray-900">{item.amount}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>EMI:</span>
                                    <span className="font-medium text-gray-900">{item.emi}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Loan Start Date:</span>
                                    <span className="font-medium text-gray-900">{item.startDate}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Loan End Date:</span>
                                    <span className="font-medium text-gray-900">{item.endDate}</span>
                                </div>
                                 <div className="pt-2 border-t border-gray-100 flex flex-col gap-2 text-xs text-gray-500">
                                    <div className="flex justify-between">
                                         <span className="font-medium">Provided Document Name:</span>
                                         <span>{item.providedDocument}</span>
                                    </div>
                                     {item.remarks && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Remarks:</span>
                                            <span className="italic">{item.remarks}</span>
                                        </div>
                                     )}
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
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">EMI</th>
                                    <th className="p-4">Loan Start Date</th>
                                    <th className="p-4">Loan End Date</th>
                                    <th className="p-4">Request Date</th>
                                    <th className="p-4">Requester Name</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-50">
                                {historyLoans.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="p-4 font-medium text-gray-900">{item.sn}</td>
                                        <td className="p-4 font-medium text-gray-900">{item.loanName}</td>
                                        <td className="p-4 text-gray-600">{item.bankName}</td>
                                        <td className="p-4 text-gray-900 font-medium">{item.amount}</td>
                                        <td className="p-4 text-gray-600">{item.emi}</td>
                                        <td className="p-4 text-gray-600">{item.startDate}</td>
                                        <td className="p-4 text-gray-600">{item.endDate}</td>
                                        <td className="p-4 text-gray-600">
                                             <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-gray-400" />
                                                {item.requestDate}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600">
                                             <div className="flex items-center gap-1.5">
                                                <User size={14} className="text-gray-400" />
                                                {item.requesterName}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                 {historyLoans.length === 0 && (
                                     <tr>
                                        <td colSpan={9} className="p-8 text-center text-gray-500">No foreclosure history found</td>
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
                                        <p className="text-xs text-gray-500 mt-0.5">{item.bankName} • {item.sn}</p>
                                    </div>
                                </div>
                                 <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    Requested
                                </span>
                            </div>
                             <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Amount:</span>
                                    <span className="font-medium text-gray-900">{item.amount}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>EMI:</span>
                                    <span className="font-medium text-gray-900">{item.emi}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Loan Start Date:</span>
                                    <span className="font-medium text-gray-900">{item.startDate}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Loan End Date:</span>
                                    <span className="font-medium text-gray-900">{item.endDate}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Requester Name:</span>
                                    <span className="font-medium text-gray-900">{item.requesterName}</span>
                                </div>
                                 <div className="flex justify-between text-gray-600">
                                    <span>Request Date:</span>
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
                            <h2 className="text-lg font-bold text-gray-800">Request Foreclosure</h2>
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
                                    <span className="block text-gray-500">Amount</span>
                                    <span className="font-medium text-gray-900">{selectedLoan.amount}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">EMI</span>
                                    <span className="font-medium text-gray-900">{selectedLoan.emi}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Loan Start Date</span>
                                    <span className="font-medium text-gray-900">{selectedLoan.startDate}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Loan End Date</span>
                                    <span className="font-medium text-gray-900">{selectedLoan.endDate}</span>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Input Fields */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Request Date</label>
                                <input 
                                    type="date" 
                                    required
                                    className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.requestDate}
                                    onChange={e => setFormData({...formData, requestDate: e.target.value})}
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Requester Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.requesterName}
                                    onChange={e => setFormData({...formData, requesterName: e.target.value})}
                                />
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

export default Foreclosure;
