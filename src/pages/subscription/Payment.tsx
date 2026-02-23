import React, { useState, useMemo, useEffect, useCallback } from 'react';
import useAuthStore from '../../store/authStore';
import useHeaderStore from '../../store/headerStore';
import { CreditCard, FileText, X, Save, Upload, Download, Search, RefreshCw, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateFormatter';
import {
    fetchPendingPayments,
    fetchPaymentHistory,
    submitPayment,
    PendingPaymentItem,
    PaymentHistoryItem
} from '../../utils/subscriptionApi';

// Frontend display types
interface PendingPaymentDisplay {
    id: string;
    sn: string;
    companyName: string;
    subscriberName: string;
    subscriptionName: string;
    price: string;
    frequency: string;
    purpose: string;
    approvalDate: string;
}

interface PaymentHistoryDisplay {
    id: string;
    subscriptionNo: string;
    paymentMode: string;
    transactionId: string;
    startDate: string;
    insuranceDocument: string | null;
    createdAt: string;
}

const SubscriptionPayment = () => {
    const { setTitle } = useHeaderStore();
    const { currentUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingList, setPendingList] = useState<PendingPaymentDisplay[]>([]);
    const [historyList, setHistoryList] = useState<PaymentHistoryDisplay[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('Subscription Payment');
    }, [setTitle]);

    // Inline Editing State
    const [editingSubId, setEditingSubId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState({
        companyName: '',
        subscriberName: '',
        subscriptionName: '',
        price: '',
        frequency: '',
        startDate: '',
        endDate: '',
        paymentMethod: 'Credit Card',
        transactionId: '',
        reason: '',
        fileName: '',
        fileContent: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load data from backend
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [pending, history] = await Promise.all([
                fetchPendingPayments(),
                fetchPaymentHistory()
            ]);

            // Map pending payments
            setPendingList(pending.map((item: PendingPaymentItem) => ({
                id: String(item.id),
                sn: item.subscription_no,
                companyName: item.company_name || '',
                subscriberName: item.subscriber_name || '',
                subscriptionName: item.subscription_name || '',
                price: item.price || '',
                frequency: item.frequency || '',
                purpose: item.purpose || '',
                approvalDate: item.planned_3 ? new Date(item.planned_3).toLocaleDateString('en-GB') : ''
            })));

            // Map history
            setHistoryList(history.map((item: PaymentHistoryItem) => ({
                id: String(item.id),
                subscriptionNo: item.subscription_no,
                paymentMode: item.payment_mode || '',
                transactionId: item.transaction_id || '',
                startDate: item.start_date || '',
                insuranceDocument: item.insurance_document,
                createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB') : '',
                subscriberName: (item as any).subscriber_name || ''
            })));

        } catch (err) {
            console.error('Failed to load payment data:', err);
            toast.error('Failed to load payment data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-fill End Date based on Frequency
    useEffect(() => {
        if (editFormData.startDate && editingSubId && editFormData.frequency) {
            const start = new Date(editFormData.startDate);
            const end = new Date(start);
            const freq = editFormData.frequency.toLowerCase();

            if (freq.includes('month')) {
                const months = freq.includes('6') ? 6 : 1;
                end.setMonth(end.getMonth() + months);
            } else if (freq.includes('quarter')) {
                end.setMonth(end.getMonth() + 3);
            } else if (freq.includes('year') || freq === 'annual') {
                end.setFullYear(end.getFullYear() + 1);
            }

            // Adjust to end of period (minus 1 day)
            end.setDate(end.getDate() - 1);

            if (!isNaN(end.getTime())) {
                setEditFormData(prev => ({...prev, endDate: end.toISOString().split('T')[0]}));
            }
        }
    }, [editFormData.startDate, editingSubId, editFormData.frequency]);

    // Filters
    const filteredPending = useMemo(() => {
        let data = pendingList;

        // Role Filter: If not admin, show only own data
        if (currentUser?.role !== 'admin') {
            data = data.filter(item => item.subscriberName === currentUser?.name);
        }

        return data.filter(s =>
            s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.subscriptionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.sn.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [pendingList, searchTerm, currentUser]);

    const filteredHistory = useMemo(() => {
        let data = historyList;

        // Role Filter
        if (currentUser?.role !== 'admin') {
            data = data.filter(item => (item as any).subscriberName === currentUser?.name);
        }

        return data.filter(s =>
            s.subscriptionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [historyList, searchTerm, currentUser]);


    const handlePayClick = (sub: PendingPaymentDisplay) => {
        setEditingSubId(sub.id);
        setEditFormData({
            companyName: sub.companyName,
            subscriberName: sub.subscriberName,
            subscriptionName: sub.subscriptionName,
            price: sub.price || '',
            frequency: sub.frequency || '',
            startDate: '',
            endDate: '',
            paymentMethod: 'Credit Card',
            transactionId: '',
            reason: '',
            fileName: '',
            fileContent: ''
        });
    };

    const handleCancelEdit = () => {
        setEditingSubId(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditFormData(prev => ({...prev, fileName: file.name, fileContent: reader.result as string}));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveInline = async (sub: PendingPaymentDisplay) => {
        if (!editFormData.startDate || !editFormData.endDate || isSubmitting) {
            toast.error("Please select Start and End dates");
            return;
        }

        setIsSubmitting(true);
        try {
            await submitPayment({
                subscriptionNo: sub.sn,
                paymentMethod: editFormData.paymentMethod,
                transactionId: editFormData.transactionId || `TXN-${Date.now()}`,
                price: editFormData.price,
                startDate: editFormData.startDate,
                endDate: editFormData.endDate,
                planned_1: editFormData.endDate,
                insuranceDocument: editFormData.fileContent || undefined,
                reason: editFormData.reason,
                companyName: editFormData.companyName,
                subscriberName: editFormData.subscriberName,
                subscriptionName: editFormData.subscriptionName,
                frequency: editFormData.frequency,
                purpose: sub.purpose
            });

            toast.success("Payment recorded successfully");
            handleCancelEdit();
            loadData(); // Refresh data
        } catch (err) {
            console.error('Failed to submit payment:', err);
            toast.error('Failed to submit payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownload = (content: string | undefined, name: string | undefined) => {
        if (!content) return;
        const link = document.createElement('a');
        link.href = content;
        link.download = name || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Unified Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Subscription Payment</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and track subscription payments</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2.5 rounded-lg transition-all"
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'pending'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'history'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            History
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                    <span className="ml-3 text-gray-600">Loading...</span>
                </div>
            )}

            {/* Content - Pending Tab */}
            {!loading && activeTab === 'pending' && (
                <div className="hidden md:flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-260px)]">
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold whitespace-nowrap">
                                <tr>
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Subscription No</th>
                                    <th className="p-4">Company</th>
                                    <th className="p-4">Subscriber</th>
                                    <th className="p-4">Subscription</th>
                                    <th className="p-4">Price</th>
                                    <th className="p-4">Frequency</th>
                                    <th className="p-4">Approved On</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {filteredPending.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-3">
                                            {editingSubId === item.id ? (
                                                <div className="flex flex-col gap-2">
                                                    <button disabled={isSubmitting} onClick={() => handleSaveInline(item)} className="p-1.5 w-full flex items-center justify-center bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors font-semibold shadow-sm" title="Save Payment">
                                                        <Save size={16} />
                                                    </button>
                                                    <button disabled={isSubmitting} onClick={handleCancelEdit} className="p-1.5 w-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-semibold shadow-sm" title="Cancel">
                                                        <X size={16} />
                                                    </button>
                                                    <div className="relative mt-2">
                                                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                                                        <button className="p-1.5 w-full flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100" title="Upload Receipt">
                                                            <Upload size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handlePayClick(item)}
                                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 w-full border border-indigo-100"
                                                >
                                                    <Edit2 size={14} />
                                                    Edit / Pay
                                                </button>
                                            )}
                                        </td>
                                        <td className="p-3 font-mono text-xs font-bold text-gray-700 shrink-0">{item.sn}</td>
                                        <td className="p-3">
                                            {editingSubId === item.id ? (
                                                <input type="text" className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900 font-medium" value={editFormData.companyName} onChange={e => setEditFormData({...editFormData, companyName: e.target.value})} />
                                            ) : (
                                                <span className="font-medium text-gray-900">{item.companyName}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {editingSubId === item.id ? (
                                                <input type="text" className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900" value={editFormData.subscriberName} onChange={e => setEditFormData({...editFormData, subscriberName: e.target.value})} />
                                            ) : (
                                                <span className="text-gray-700">{item.subscriberName}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {editingSubId === item.id ? (
                                                <input type="text" className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-indigo-600 font-medium" value={editFormData.subscriptionName} onChange={e => setEditFormData({...editFormData, subscriptionName: e.target.value})} />
                                            ) : (
                                                <span className="text-indigo-600 font-medium">{item.subscriptionName}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {editingSubId === item.id ? (
                                                <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                    <input type="text" className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-bold" value={editFormData.price} placeholder="Price" onChange={e => setEditFormData({...editFormData, price: e.target.value})} />
                                                    <select className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-medium" value={editFormData.paymentMethod} onChange={e => setEditFormData({...editFormData, paymentMethod: e.target.value})}>
                                                        <option value="Credit Card">Credit Card</option><option value="Bank Transfer">Bank Transfer</option><option value="UPI">UPI</option>
                                                    </select>
                                                    <input type="text" className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="TXN ID" value={editFormData.transactionId} onChange={e => setEditFormData({...editFormData, transactionId: e.target.value})} />
                                                </div>
                                            ) : (
                                                <span className="font-medium text-gray-900">{item.price}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {editingSubId === item.id ? (
                                                <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                    <select className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900 bg-white" value={editFormData.frequency} onChange={e => setEditFormData({...editFormData, frequency: e.target.value})}>
                                                        <option value="" disabled>Select Frequency</option>
                                                        <option value="Monthly">Monthly</option>
                                                        <option value="Quarterly">Quarterly</option>
                                                        <option value="Half-Yearly">Half-Yearly</option>
                                                        <option value="Yearly">Yearly</option>
                                                    </select>
                                                    <input type="text" className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-gray-700" placeholder="Reason (opt)" value={editFormData.reason} onChange={e => setEditFormData({...editFormData, reason: e.target.value})} />
                                                    {editFormData.fileName && <span className="text-[10px] text-green-600 truncate bg-green-50 p-1 rounded border border-green-100">{editFormData.fileName}</span>}
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">{item.frequency}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {editingSubId === item.id ? (
                                                <div className="flex flex-col gap-1.5 min-w-[130px]">
                                                    <div className="relative">
                                                        <span className="text-[10px] text-gray-400 absolute -top-4 left-0">Start Date *</span>
                                                        <input type="date" className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer" value={editFormData.startDate} onChange={e => setEditFormData({...editFormData, startDate: e.target.value})} />
                                                    </div>
                                                    <div className="relative mt-3">
                                                        <span className="text-[10px] text-gray-400 absolute -top-4 left-0">End Date *</span>
                                                        <input type="date" className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer" value={editFormData.endDate} onChange={e => setEditFormData({...editFormData, endDate: e.target.value})} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 whitespace-nowrap">{formatDate(item.approvalDate)}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredPending.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-gray-500">
                                            No pending payments found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Content - History Tab */}
            {!loading && activeTab === 'history' && (
                <div className="hidden md:flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-260px)]">
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold whitespace-nowrap">
                                <tr>
                                    <th className="p-4">Subscription No</th>
                                    <th className="p-4">Payment Mode</th>
                                    <th className="p-4">Transaction ID</th>
                                    <th className="p-4">Start Date</th>
                                    <th className="p-4">Payment Date</th>
                                    <th className="p-4">Document</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {filteredHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 font-mono text-sm font-bold text-gray-700">{item.subscriptionNo}</td>
                                        <td className="p-4 text-gray-700">{item.paymentMode}</td>
                                        <td className="p-4 font-mono text-gray-600">{item.transactionId}</td>
                                        <td className="p-4 text-gray-500 whitespace-nowrap">{formatDate(item.startDate)}</td>
                                        <td className="p-4 text-gray-500 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                                        <td className="p-4">
                                            {item.insuranceDocument ? (
                                                <button
                                                    onClick={() => handleDownload(item.insuranceDocument!, 'document')}
                                                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                                >
                                                    <FileText size={14} /> View
                                                </button>
                                            ) : <span className="text-gray-400">-</span>}
                                        </td>
                                    </tr>
                                ))}
                                {filteredHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-500">
                                            No payment history found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Mobile Cards - Pending */}
            {!loading && activeTab === 'pending' && (
                <div className="md:hidden flex flex-col gap-4">
                    {filteredPending.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3 items-start">
                                    <div className="h-10 w-10 flex items-center justify-center bg-green-50 text-green-600 rounded-lg shrink-0 mt-0.5">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{item.sn}</span>
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-900 leading-tight">{item.subscriptionName}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5 font-medium">{item.companyName}</p>
                                    </div>
                                </div>
                                {editingSubId === item.id ? (
                                    <div className="flex gap-2">
                                        <button disabled={isSubmitting} onClick={() => handleSaveInline(item)} className="p-1.5 text-green-600 bg-green-50 rounded-lg">
                                            <Save size={16} />
                                        </button>
                                        <button disabled={isSubmitting} onClick={handleCancelEdit} className="p-1.5 text-gray-500 bg-gray-100 rounded-lg">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handlePayClick(item)}
                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1"
                                    >
                                        <Edit2 size={14} /> Edit & Pay
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs pt-3 border-t border-dashed border-gray-100">
                                <div className="col-span-2">
                                    <span className="block text-gray-400 mb-0.5 text-[10px] uppercase font-semibold">Company / Subscription</span>
                                    {editingSubId === item.id ? (
                                        <div className="flex flex-col gap-1 mt-1">
                                            <input type="text" className="w-full p-1 border border-gray-300 rounded text-xs outline-none" value={editFormData.companyName} onChange={e => setEditFormData({...editFormData, companyName: e.target.value})} />
                                            <input type="text" className="w-full p-1 border border-gray-300 rounded text-xs outline-none text-indigo-600 font-medium" value={editFormData.subscriptionName} onChange={e => setEditFormData({...editFormData, subscriptionName: e.target.value})} />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-0.5 mt-1">
                                            <span className="font-semibold text-gray-700">{item.companyName}</span>
                                            <span className="text-indigo-600 font-medium">{item.subscriptionName}</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span className="block text-gray-400 mb-0.5 text-[10px] uppercase font-semibold">Subscriber</span>
                                    {editingSubId === item.id ? (
                                        <input type="text" className="w-full p-1 border border-gray-300 rounded text-xs outline-none" value={editFormData.subscriberName} onChange={e => setEditFormData({...editFormData, subscriberName: e.target.value})} />
                                    ) : (
                                        <span className="font-semibold text-gray-700">{item.subscriberName}</span>
                                    )}
                                </div>
                                <div>
                                    <span className="block text-gray-400 mb-0.5 text-[10px] uppercase font-semibold">Frequency</span>
                                    {editingSubId === item.id ? (
                                        <select className="w-full p-1 border border-gray-300 rounded text-xs outline-none bg-white" value={editFormData.frequency} onChange={e => setEditFormData({...editFormData, frequency: e.target.value})}>
                                            <option value="" disabled>Select Frequency</option>
                                            <option value="Monthly">Monthly</option>
                                            <option value="Quarterly">Quarterly</option>
                                            <option value="Half-Yearly">Half-Yearly</option>
                                            <option value="Yearly">Yearly</option>
                                        </select>
                                    ) : (
                                        <span className="font-semibold text-gray-700">{item.frequency}</span>
                                    )}
                                </div>
                                
                                {editingSubId === item.id ? (
                                    <>
                                        <div className="col-span-2">
                                            <span className="block text-gray-400 mb-0.5 text-[10px] uppercase font-semibold">Payment Details</span>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <input type="text" className="w-full p-1 border border-gray-300 rounded text-xs outline-none font-bold" value={editFormData.price} placeholder="Price" onChange={e => setEditFormData({...editFormData, price: e.target.value})} />
                                                <select className="w-full p-1 border border-gray-300 rounded text-xs outline-none" value={editFormData.paymentMethod} onChange={e => setEditFormData({...editFormData, paymentMethod: e.target.value})}>
                                                    <option value="Credit Card">Credit Card</option><option value="Bank Transfer">Bank Transfer</option><option value="UPI">UPI</option>
                                                </select>
                                                <input type="text" className="w-full p-1 border border-gray-300 rounded text-xs outline-none" placeholder="Transaction ID" value={editFormData.transactionId} onChange={e => setEditFormData({...editFormData, transactionId: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="block text-gray-400 mb-0.5 text-[10px] uppercase font-semibold">Dates & Documents</span>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <input type="date" className="w-full p-1 border border-gray-300 rounded text-xs outline-none" value={editFormData.startDate} onChange={e => setEditFormData({...editFormData, startDate: e.target.value})} />
                                                <input type="date" className="w-full p-1 border border-gray-300 rounded text-xs outline-none" value={editFormData.endDate} onChange={e => setEditFormData({...editFormData, endDate: e.target.value})} />
                                                <div className="relative mt-1">
                                                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                                                    <div className="w-full p-1.5 border border-indigo-200 border-dashed rounded text-xs text-indigo-600 flex items-center justify-center gap-2 bg-indigo-50">
                                                        <Upload size={14} /> {editFormData.fileName ? editFormData.fileName.slice(0, 15) + '...' : 'Upload Receipt'}
                                                    </div>
                                                </div>
                                                <input type="text" className="w-full p-1 mt-1 border border-gray-300 rounded text-xs outline-none" placeholder="Reason (opt)" value={editFormData.reason} onChange={e => setEditFormData({...editFormData, reason: e.target.value})} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="col-span-2 pt-2 border-t border-gray-50 flex justify-between">
                                        <div>
                                            <span className="block text-gray-400 mb-0.5 text-[10px] uppercase font-semibold">Price</span>
                                            <span className="font-bold text-gray-900">{item.price}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-gray-400 mb-0.5 text-[10px] uppercase font-semibold">Approved On</span>
                                            <span className="text-gray-500 font-mono">{formatDate(item.approvalDate)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {filteredPending.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                            <CreditCard size={32} className="mb-2 opacity-50" />
                            <p className="text-sm font-medium">No pending payments</p>
                        </div>
                    )}
                </div>
            )}

            {/* Mobile Cards - History */}
            {!loading && activeTab === 'history' && (
                <div className="md:hidden flex flex-col gap-4">
                    {filteredHistory.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3 items-start">
                                    <div className="h-10 w-10 flex items-center justify-center bg-green-50 text-green-600 rounded-lg shrink-0 mt-0.5">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{item.subscriptionNo}</span>
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border bg-green-50 text-green-700 border-green-100">
                                                Paid
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-900 leading-tight">{item.paymentMode}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5 font-medium">{item.transactionId}</p>
                                    </div>
                                </div>
                                {item.insuranceDocument && (
                                    <button
                                        onClick={() => handleDownload(item.insuranceDocument!, 'document')}
                                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"
                                    >
                                        <Download size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-[10px] border border-gray-100">
                                <div>
                                    <span className="block text-gray-400 mb-0.5 uppercase tracking-wider font-semibold">Start Date</span>
                                    <span className="font-mono text-gray-600 font-bold">{formatDate(item.startDate)}</span>
                                </div>
                                <div className="text-right pl-2 border-l border-gray-200">
                                    <span className="block text-gray-400 mb-0.5 uppercase tracking-wider font-semibold">Payment Date</span>
                                    <span className="font-mono text-green-600 font-bold">{formatDate(item.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredHistory.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                            <CreditCard size={32} className="mb-2 opacity-50" />
                            <p className="text-sm font-medium">No payment history</p>
                        </div>
                    )}
                </div>
            )}


        </div>
    );
};

export default SubscriptionPayment;
