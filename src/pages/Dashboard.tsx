import { useEffect, useState, useCallback } from 'react';
import {
    FileText,
    CreditCard,
    Banknote,
    CheckCircle,
    FileCheck,
    RotateCcw,
    X,
    Wallet,
    BarChart3,
    Clock,
    TrendingUp
} from 'lucide-react';
import useHeaderStore from '../store/headerStore';
import { useNavigate } from 'react-router-dom';
import {
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import { formatDate } from '../utils/dateFormatter';
import { fetchAllSubscriptions, SubscriptionResponse } from '../utils/subscriptionApi';
import { fetchAllDocuments, BackendDocument } from '../utils/documentApi';
import { fetchAllLoans, fetchNOCHistory, Loan, NOCRecord } from '../utils/loanApi';
import { getAllPaymentFms, getApprovalPending, getMakePaymentPending, getTallyEntryPending, transformPaymentFms } from '../utils/paymentFmsApi';

// Dashboard subscription interface
interface DashboardSubscription {
    id: string;
    sn: string;
    companyName: string;
    subscriberName: string;
    subscriptionName: string;
    price: string;
    frequency: string;
    purpose: string;
    startDate: string;
    endDate: string;
    status: string;
    requestedDate: string;
}

// Dashboard document interface
interface DashboardDocument {
    id: string;
    documentName: string;
    category: string;
    needsRenewal: boolean;
    renewalDate?: string;
    date?: string;
}

// Dashboard loan interface
interface DashboardLoan {
    id: number;
    loanName: string;
    bankName: string;
    startDate?: string;
    collectNocStatus?: string;
    foreclosureStatus?: string;
    finalSettlementStatus?: string;
}

const StatCard = ({ title, value, icon: Icon, color, subtext, onClick, bgColor = "bg-white" }: any) => (
    <div
        onClick={onClick}
        className={`${bgColor} p-5 sm:p-6 rounded-2xl shadow-input hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden`}
    >
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p className="text-gray-500 text-sm font-semibold tracking-wide uppercase">{title}</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-2 tracking-tight group-hover:text-indigo-600 transition-colors">{value}</h3>
                {subtext && <p className="text-xs text-gray-400 mt-2 font-medium">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const { setTitle } = useHeaderStore();
    const navigate = useNavigate();
    const [selectedStat, setSelectedStat] = useState<{ type: string, title: string, data: { label: string, count: number }[], link: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'payment' | 'account'>('overview');

    // State for all data
    const [subscriptions, setSubscriptions] = useState<DashboardSubscription[]>([]);
    const [documents, setDocuments] = useState<DashboardDocument[]>([]);
    const [loans, setLoans] = useState<DashboardLoan[]>([]);
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

    // Payment FMS state
    const [paymentStats, setPaymentStats] = useState({
        totalRequests: 0,
        pendingApprovals: 0,
        paymentsMade: 0,
        tallyPending: 0,
        totalAmount: 0,
        approvedAmount: 0,
        paidAmount: 0,
        pendingAmount: 0
    });
    const [paymentStatusData, setPaymentStatusData] = useState<{ name: string; value: number; fill: string }[]>([]);
    const [recentPayments, setRecentPayments] = useState<any[]>([]);

    useEffect(() => {
        const titles = { overview: 'Overview', payment: 'Payment Dashboard', account: 'Account FMS Dashboard' };
        setTitle(titles[activeTab]);
    }, [setTitle, activeTab]);

    // Fetch subscriptions from backend
    const loadSubscriptions = useCallback(async () => {
        setLoadingSubscriptions(true);
        try {
            const data = await fetchAllSubscriptions();
            setSubscriptions(data.map((item: SubscriptionResponse) => ({
                id: String(item.id),
                sn: item.subscription_no,
                companyName: item.company_name || '',
                subscriberName: item.subscriber_name || '',
                subscriptionName: item.subscription_name || '',
                price: item.price || '',
                frequency: item.frequency || '',
                purpose: item.purpose || '',
                startDate: item.start_date || '',
                endDate: item.end_date || '',
                status: item.actual_3 ? 'Paid' : (item.actual_2 ? 'Approved' : 'Pending'),
                requestedDate: item.timestamp || ''
            })));
        } catch (err) {
            console.error('Failed to load subscriptions:', err);
        } finally {
            setLoadingSubscriptions(false);
        }
    }, []);

    // Fetch documents from backend
    const loadDocuments = useCallback(async () => {
        try {
            const data = await fetchAllDocuments();
            setDocuments(data.map((doc: BackendDocument) => ({
                id: String(doc.document_id),
                documentName: doc.document_name,
                category: doc.category || 'Uncategorized',
                needsRenewal: doc.need_renewal === 'yes',
                renewalDate: doc.renewal_date?.split('T')[0] || undefined,
                date: doc.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
            })));
        } catch (err) {
            console.error('Failed to load documents:', err);
        }
    }, []);

    // Fetch loans from backend
    const loadLoans = useCallback(async () => {
        try {
            const [loansData, nocData] = await Promise.all([
                fetchAllLoans(),
                fetchNOCHistory()
            ]);

            // Create a map of serial_no to NOC status
            const nocMap = new Map<string, boolean>();
            nocData.forEach((noc: NOCRecord) => {
                nocMap.set(noc.serial_no, noc.collect_noc);
            });

            setLoans(loansData.map((loan: Loan) => ({
                id: loan.id,
                loanName: loan.loan_name,
                bankName: loan.bank_name,
                startDate: loan.loan_start_date?.split('T')[0] || undefined,
                collectNocStatus: nocMap.get(`SN-${String(loan.id).padStart(3, '0')}`) ? 'Yes' : undefined,
                foreclosureStatus: undefined,
                finalSettlementStatus: undefined
            })));
        } catch (err) {
            console.error('Failed to load loans:', err);
        }
    }, []);

    // Fetch payment FMS data
    const loadPaymentData = useCallback(async () => {
        try {
            const [allPayments, approvalPending, paymentPending, tallyPending] = await Promise.all([
                getAllPaymentFms(),
                getApprovalPending(),
                getMakePaymentPending(),
                getTallyEntryPending()
            ]);

            const transformed = allPayments.map(transformPaymentFms);

            // Calculate stats
            const totalAmount = transformed.reduce((acc, p) => acc + (p.amount || 0), 0);
            const approved = transformed.filter(p => p.status === 'Approved');
            const approvedAmount = approved.reduce((acc, p) => acc + (p.amount || 0), 0);
            const paid = transformed.filter(p => p.actual2); // Has actual2 = paid
            const paidAmount = paid.reduce((acc, p) => acc + (p.amount || 0), 0);
            const pending = transformed.filter(p => !p.actual1); // No actual1 = pending approval
            const pendingAmount = pending.reduce((acc, p) => acc + (p.amount || 0), 0);

            setPaymentStats({
                totalRequests: transformed.length,
                pendingApprovals: approvalPending.length,
                paymentsMade: paid.length,
                tallyPending: tallyPending.length,
                totalAmount,
                approvedAmount,
                paidAmount,
                pendingAmount
            });

            // Status distribution for pie chart
            const statusCounts = {
                Approved: transformed.filter(p => p.status === 'Approved' && !p.actual2).length,
                Pending: transformed.filter(p => !p.actual1).length,
                Paid: paid.length,
                Rejected: transformed.filter(p => p.status === 'Rejected').length
            };

            setPaymentStatusData([
                { name: 'Approved', value: statusCounts.Approved, fill: '#10b981' },
                { name: 'Pending', value: statusCounts.Pending, fill: '#f59e0b' },
                { name: 'Paid', value: statusCounts.Paid, fill: '#3b82f6' },
                { name: 'Rejected', value: statusCounts.Rejected, fill: '#ef4444' }
            ].filter(d => d.value > 0));

            // Recent payments (latest 5)
            setRecentPayments(transformed.slice(0, 5).map(p => ({
                id: p.id,
                desc: `Payment request - ${p.uniqueNo || 'N/A'}`,
                payTo: p.payTo,
                amount: `₹${(p.amount || 0).toLocaleString()}`,
                time: p.createdAt ? formatDate(p.createdAt) : 'Recently',
                status: p.actual2 ? 'paid' : (p.actual1 ? 'approved' : 'pending')
            })));

        } catch (err) {
            console.error('Failed to load payment data:', err);
        }
    }, []);

    useEffect(() => {
        loadSubscriptions();
        loadDocuments();
        loadLoans();
        loadPaymentData();
    }, [loadSubscriptions, loadDocuments, loadLoans, loadPaymentData]);


    // --- Metrics Calculation ---
    const totalDocuments = documents.length;
    const totalSubscriptions = subscriptions.length;
    const totalLoans = loans.length;

    const totalRenewals = documents.filter(doc => doc.needsRenewal).length;
    const pendingApprovals = subscriptions.filter(sub => !sub.status || sub.status === 'Pending').length;
    const nocCompleted = loans.filter(loan => loan.collectNocStatus === 'Yes').length;

    const monthlySubscriptionCost = subscriptions.reduce((acc, sub) => {
        let price = parseFloat(sub.price.replace(/[^\d.]/g, '')) || 0;
        if (sub.frequency === 'Yearly') price = price / 12;
        if (sub.frequency === 'Quarterly') price = price / 3;
        if (sub.frequency === 'Half-Yearly' || sub.frequency === '6 Months') price = price / 6;
        return acc + price;
    }, 0);

    // --- Aggregation Logic ---
    const getDocumentStats = () => {
        const counts: Record<string, number> = {};
        documents.forEach(doc => {
            const key = doc.category || 'Uncategorized';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    };

    const getSubscriptionStats = () => {
        const counts: Record<string, number> = {};
        subscriptions.forEach(sub => {
            const key = sub.frequency || 'Unknown';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    };

    const getLoanStats = () => {
        const counts: Record<string, number> = {};
        loans.forEach(loan => {
            const key = loan.bankName || 'Unknown Bank';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    };

    const getRenewalStats = () => {
        const counts: Record<string, number> = {};
        documents.filter(d => d.needsRenewal).forEach(doc => {
            const key = doc.category || 'Uncategorized';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    };

    const getApprovalStats = () => {
        const counts: Record<string, number> = {};
        subscriptions.filter(s => !s.status || s.status === 'Pending').forEach(sub => {
            const key = sub.frequency || 'Unknown';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    };

    const getNocStats = () => {
        const counts: Record<string, number> = {};
        loans.filter(l => l.collectNocStatus === 'Yes').forEach(loan => {
            const key = loan.bankName || 'Unknown Bank';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    };

    const handleStatClick = (type: string) => {
        if (type === 'documents') {
            setSelectedStat({ type: 'documents', title: 'Documents by Category', data: getDocumentStats(), link: '/document/all' });
        } else if (type === 'subscriptions') {
            setSelectedStat({ type: 'subscriptions', title: 'Subscriptions by Frequency', data: getSubscriptionStats(), link: '/subscription/all' });
        } else if (type === 'loans') {
            setSelectedStat({ type: 'loans', title: 'Loans by Bank', data: getLoanStats(), link: '/loan/all' });
        } else if (type === 'renewals') {
            setSelectedStat({ type: 'renewals', title: 'Pending Renewals by Category', data: getRenewalStats(), link: '/document/renewal' });
        } else if (type === 'approvals') {
            setSelectedStat({ type: 'approvals', title: 'Pending Approvals by Frequency', data: getApprovalStats(), link: '/subscription/approval' });
        } else if (type === 'noc') {
            setSelectedStat({ type: 'noc', title: 'NOC Completed by Bank', data: getNocStats(), link: '/loan/noc' });
        }
    };

    // --- Data for Charts ---

    // 1. Subscription Status Breakdown
    const subStatusCounts = {
        Active: subscriptions.filter(s => s.status === 'Paid').length,
        Pending: subscriptions.filter(s => !s.status || s.status === 'Pending').length,
        Approved: subscriptions.filter(s => s.status === 'Approved').length,
        Rejected: subscriptions.filter(s => s.status === 'Rejected').length,
    };

    const subscriptionStatusData = [
        { name: 'Active', value: subStatusCounts.Active, color: '#10B981' }, // Emerald
        { name: 'Pending', value: subStatusCounts.Pending, color: '#F59E0B' }, // Amber
        { name: 'Approved', value: subStatusCounts.Approved, color: '#3B82F6' }, // Blue
        { name: 'Rejected', value: subStatusCounts.Rejected, color: '#EF4444' }, // Red
    ].filter(d => d.value > 0);

    // 2. Document Status Breakdown
    const docStatusCounts = {
        Active: 0,
        Expiring: 0,
        Expired: 0
    };
    const today = new Date();
    documents.forEach(doc => {
        if (!doc.renewalDate) {
            docStatusCounts.Active++;
            return;
        }
        const renewalDate = new Date(doc.renewalDate);
        const diffTime = renewalDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            docStatusCounts.Expired++;
        } else if (diffDays <= 30) {
            docStatusCounts.Expiring++;
        } else {
            docStatusCounts.Active++;
        }
    });

    const documentStatusData = [
        { name: 'Active', value: docStatusCounts.Active, color: '#3B82F6' }, // Blue
        { name: 'Expiring', value: docStatusCounts.Expiring, color: '#F97316' }, // Orange
        { name: 'Expired', value: docStatusCounts.Expired, color: '#EF4444' }, // Red
    ].filter(d => d.value > 0);

    // 3. Loan Status Breakdown
    const loanStatusCounts = {
        Active: 0,
        Foreclosure: 0,
        Closed: 0
    };
    loans.forEach(loan => {
        if (loan.finalSettlementStatus === 'Yes') {
            loanStatusCounts.Closed++;
        } else if (loan.foreclosureStatus === 'Approved') {
            loanStatusCounts.Foreclosure++;
        } else {
            loanStatusCounts.Active++;
        }
    });

    const loanStatusData = [
        { name: 'Active', value: loanStatusCounts.Active, color: '#8B5CF6' }, // Violet
        { name: 'Foreclosure', value: loanStatusCounts.Foreclosure, color: '#EC4899' }, // Pink
        { name: 'Closed', value: loanStatusCounts.Closed, color: '#6B7280' }, // Gray
    ].filter(d => d.value > 0);




    return (
        <div className="space-y-8 pb-10 relative">

            {/* Tab Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {activeTab === 'overview' ? 'Overview of all resources' : activeTab === 'payment' ? 'Payment workflow overview' : 'Account FMS overview'}
                    </p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <FileText size={16} />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('payment')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'payment' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Wallet size={16} />
                        Payment
                    </button>
                    {/* <button
                        onClick={() => setActiveTab('account')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'account' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Banknote size={16} />
                        Account
                    </button> */}
                </div>
            </div>

            {/* Modal Overlay */}
            {selectedStat && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animation-fade-in" onClick={() => setSelectedStat(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animation-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">{selectedStat.title}</h3>
                            <button onClick={() => setSelectedStat(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-0 max-h-[60vh] overflow-y-auto">
                            {selectedStat.data.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {selectedStat.data.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                                            <span className="font-medium text-gray-700">{item.label}</span>
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-400">No data available</div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => navigate(selectedStat.link)}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                View Full List
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
                <>
                    {/* Primary Stats: Totals */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Resource Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                title="Total Documents"
                                value={totalDocuments}
                                icon={FileText}
                                color="bg-blue-500 text-blue-600"
                                subtext="All stored records"
                                onClick={() => handleStatClick('documents')}
                            />
                            <StatCard
                                title="Total Subscriptions"
                                value={totalSubscriptions}
                                icon={CreditCard}
                                color="bg-purple-500 text-purple-600"
                                subtext={`₹${monthlySubscriptionCost.toFixed(0)} / mo estimated`}
                                onClick={() => handleStatClick('subscriptions')}
                            />
                            <StatCard
                                title="Total Loans"
                                value={totalLoans}
                                icon={Banknote}
                                color="bg-emerald-500 text-emerald-600"
                                subtext="Active financial records"
                                onClick={() => handleStatClick('loans')}
                            />
                        </div>
                    </div>

                    {/* Secondary Stats: Action Items */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Action Items & Status</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                title="Renewals Pending"
                                value={totalRenewals}
                                icon={RotateCcw}
                                color="bg-orange-500 text-orange-600"
                                subtext="Documents expiring soon"
                                onClick={() => handleStatClick('renewals')}
                            />
                            <StatCard
                                title="Pending Approvals"
                                value={pendingApprovals}
                                icon={CheckCircle}
                                color="bg-indigo-500 text-indigo-600"
                                subtext="Subscriptions waiting approval"
                                onClick={() => handleStatClick('approvals')}
                            />
                            <StatCard
                                title="NOC Completed"
                                value={nocCompleted}
                                icon={FileCheck}
                                color="bg-teal-500 text-teal-600"
                                subtext="Loans with NOC collected"
                                onClick={() => handleStatClick('noc')}
                            />
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* 1. Subscription Breakdown Chart */}
                        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-input flex flex-col items-center">
                            <h3 className="font-bold text-base text-gray-800 mb-2 w-full text-left">Subscriptions</h3>
                            <p className="text-xs text-gray-500 mb-4 w-full text-left">By status</p>
                            <div className="h-[200px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={subscriptionStatusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {subscriptionStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px' }} itemStyle={{ color: '#374151', fontSize: '12px', fontWeight: 600 }} />
                                        <Legend verticalAlign="bottom" iconSize={8} formatter={(val) => <span className="text-xs text-gray-600">{val}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                                    <span className="text-2xl font-bold text-gray-700">{totalSubscriptions}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Document Status Chart */}
                        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-input flex flex-col items-center">
                            <h3 className="font-bold text-base text-gray-800 mb-2 w-full text-left">Documents</h3>
                            <p className="text-xs text-gray-500 mb-4 w-full text-left">By renewal status</p>
                            <div className="h-[200px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={documentStatusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {documentStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px' }} itemStyle={{ color: '#374151', fontSize: '12px', fontWeight: 600 }} />
                                        <Legend verticalAlign="bottom" iconSize={8} formatter={(val) => <span className="text-xs text-gray-600">{val}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                                    <span className="text-2xl font-bold text-gray-700">{totalDocuments}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Loan Status Chart */}
                        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-input flex flex-col items-center">
                            <h3 className="font-bold text-base text-gray-800 mb-2 w-full text-left">Loans</h3>
                            <p className="text-xs text-gray-500 mb-4 w-full text-left">By active status</p>
                            <div className="h-[200px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={loanStatusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {loanStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px' }} itemStyle={{ color: '#374151', fontSize: '12px', fontWeight: 600 }} />
                                        <Legend verticalAlign="bottom" iconSize={8} formatter={(val) => <span className="text-xs text-gray-600">{val}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                                    <span className="text-2xl font-bold text-gray-700">{totalLoans}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white p-6 rounded-2xl shadow-input">
                        <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
                            <CheckCircle size={20} className="text-blue-600" />
                            Recent Activity
                        </h3>
                        <div className="space-y-8 pl-4 border-l-2 border-gray-100 ml-2">
                            {[
                                {
                                    id: 'login', type: 'login', title: 'User Login', desc: 'Admin logged into the system',
                                    time: 'Just now', rawDate: new Date().toISOString(),
                                    icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100'
                                },
                                ...documents.map(doc => ({
                                    id: doc.id,
                                    type: 'document',
                                    title: 'Document Added',
                                    desc: `New document '${doc.documentName}' added to ${doc.category}`,
                                    time: doc.date,
                                    rawDate: doc.date,
                                    icon: FileText,
                                    color: 'text-blue-500',
                                    bg: 'bg-blue-100'
                                })),
                                ...subscriptions.map(sub => ({
                                    id: sub.id,
                                    type: 'subscription',
                                    title: 'Subscription Update',
                                    desc: `Subscription for '${sub.companyName}' (${sub.frequency}) was updated`,
                                    time: sub.requestedDate,
                                    rawDate: sub.requestedDate,
                                    icon: CreditCard,
                                    color: 'text-purple-500',
                                    bg: 'bg-purple-100'
                                })),
                                ...loans.map(loan => ({
                                    id: loan.id,
                                    type: 'loan',
                                    title: 'Loan Entry',
                                    desc: `New loan record for '${loan.loanName}' at ${loan.bankName}`,
                                    time: loan.startDate,
                                    rawDate: loan.startDate,
                                    icon: Banknote,
                                    color: 'text-pink-500',
                                    bg: 'bg-pink-100'
                                }))
                            ]
                                .sort((a, b) => {
                                    if (a.time === 'Just now') return -1;
                                    if (b.time === 'Just now') return 1;
                                    // Parse dates YYYY-MM-DD or use fallback
                                    const dateA = new Date(a.rawDate || 0);
                                    const dateB = new Date(b.rawDate || 0);
                                    return dateB.getTime() - dateA.getTime();
                                })
                                .slice(0, 8)
                                .map((activity, index) => (
                                    <div key={index} className="relative group">
                                        <div className={`absolute -left-[29px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${activity.bg.replace('bg-', 'bg-')} ${activity.color.replace('text-', 'bg-')}`}></div>

                                        <div className="flex items-start gap-4">
                                            <div className={`p-2 rounded-lg ${activity.bg} shrink-0`}>
                                                <activity.icon size={18} className={activity.color} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-gray-800">{activity.title}</h4>
                                                <p className="text-sm text-gray-600 mt-0.5">{activity.desc}</p>
                                                <span className="text-xs text-gray-400 mt-2 block font-medium">
                                                    {activity.time === 'Just now' ? 'Just now' : formatDate(activity.time)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </>
            )}

            {/* Payment Tab Content */}
            {activeTab === 'payment' && (
                <>
                    {/* Payment Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Requests" value={paymentStats.totalRequests} icon={BarChart3} color="bg-blue-500 text-blue-600" subtext={`₹${(paymentStats.totalAmount / 1000).toFixed(1)}K total`} onClick={() => navigate('/payment/request-form')} />
                        <StatCard title="Pending Approvals" value={paymentStats.pendingApprovals} icon={Clock} color="bg-yellow-500 text-yellow-600" subtext="Awaiting review" onClick={() => navigate('/payment/approval')} />
                        <StatCard title="Payments Made" value={paymentStats.paymentsMade} icon={CheckCircle} color="bg-green-500 text-green-600" subtext={`₹${(paymentStats.paidAmount / 1000).toFixed(1)}K paid`} onClick={() => navigate('/payment/make-payment')} />
                        <StatCard title="Tally Pending" value={paymentStats.tallyPending} icon={TrendingUp} color="bg-purple-500 text-purple-600" subtext="Awaiting tally entry" onClick={() => navigate('/payment/tally-entry')} />
                    </div>

                    {/* Payment Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Payment Status Pie */}
                        <div className="bg-white p-6 rounded-2xl shadow-input">
                            <h3 className="font-bold text-base text-gray-800 mb-2">Payment Status</h3>
                            <p className="text-xs text-gray-500 mb-4">Distribution by status</p>
                            <div className="h-[280px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={paymentStatusData.length > 0 ? paymentStatusData : [{ name: 'No Data', value: 1, fill: '#e5e7eb' }]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {paymentStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" iconSize={8} formatter={(val) => <span className="text-xs text-gray-600">{val}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                                    <span className="text-2xl font-bold text-gray-700">{paymentStats.totalRequests}</span>
                                </div>
                            </div>
                        </div>

                        {/* Amount Summary */}
                        <div className="bg-white p-6 rounded-2xl shadow-input">
                            <h3 className="font-bold text-base text-gray-800 mb-2">Amount Summary</h3>
                            <p className="text-xs text-gray-500 mb-4">Financial overview</p>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <span className="text-sm font-medium text-gray-700">Total Requested</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">₹{paymentStats.totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <span className="text-sm font-medium text-gray-700">Approved</span>
                                    </div>
                                    <span className="text-lg font-bold text-green-600">₹{paymentStats.approvedAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                        <span className="text-sm font-medium text-gray-700">Paid</span>
                                    </div>
                                    <span className="text-lg font-bold text-emerald-600">₹{paymentStats.paidAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <span className="text-sm font-medium text-gray-700">Pending</span>
                                    </div>
                                    <span className="text-lg font-bold text-yellow-600">₹{paymentStats.pendingAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Payment Activity */}
                    <div className="bg-white p-6 rounded-2xl shadow-input">
                        <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
                            <CheckCircle size={20} className="text-blue-600" />
                            Recent Payment Activity
                        </h3>
                        <div className="space-y-4">
                            {recentPayments.length > 0 ? recentPayments.map((activity) => (
                                <div key={activity.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800">{activity.desc}</p>
                                        <p className="text-xs text-gray-400 mt-1">Pay To: {activity.payTo} • {activity.time}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-bold text-gray-900">{activity.amount}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${activity.status === 'paid' ? 'bg-green-100 text-green-700' :
                                            activity.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>{activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-gray-400 py-8">No payment activity yet</div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Account FMS Tab Content */}
            {activeTab === 'account' && (
                <>
                    {/* Account Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <StatCard title="Total Entries" value="1,240" icon={TrendingUp} color="bg-blue-500 text-blue-600" subtext="+12% from last month" onClick={() => navigate('/account/tally-data')} />
                        <StatCard title="Approved" value="829" icon={CheckCircle} color="bg-green-500 text-green-600" subtext="+8% this month" onClick={() => navigate('/account/audit')} />
                        <StatCard title="Pending Audit" value="148" icon={Clock} color="bg-yellow-500 text-yellow-600" subtext="Awaiting review" onClick={() => navigate('/account/audit')} />
                        <StatCard title="Pending Rectify" value="186" icon={BarChart3} color="bg-orange-500 text-orange-600" subtext="+3% increase" onClick={() => navigate('/account/rectify')} />
                        <StatCard title="Pending Re-Audit" value="124" icon={RotateCcw} color="bg-cyan-500 text-cyan-600" subtext="-2% decrease" onClick={() => navigate('/account/audit')} />
                        <StatCard title="Total Billed" value="123" icon={FileCheck} color="bg-purple-500 text-purple-600" subtext="Bills filed" onClick={() => navigate('/account/bill-filed')} />
                    </div>

                    {/* Account Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Status Distribution Pie */}
                        <div className="bg-white p-6 rounded-2xl shadow-input">
                            <h3 className="font-bold text-base text-gray-800 mb-2">Status Distribution</h3>
                            <p className="text-xs text-gray-500 mb-4">Current entries by status</p>
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={[
                                            { name: 'Approved', value: 45, fill: '#22c55e' },
                                            { name: 'Pending Audit', value: 12, fill: '#eab308' },
                                            { name: 'Rejected', value: 8, fill: '#ef4444' },
                                            { name: 'Rectify', value: 15, fill: '#f97316' },
                                            { name: 'Re-Audit', value: 10, fill: '#0ea5e9' },
                                            { name: 'Tally Pending', value: 10, fill: '#a855f7' },
                                        ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine>
                                            {[{ fill: '#22c55e' }, { fill: '#eab308' }, { fill: '#ef4444' }, { fill: '#f97316' }, { fill: '#0ea5e9' }, { fill: '#a855f7' }].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Monthly Entry Bar Chart */}
                        <div className="bg-white p-6 rounded-2xl shadow-input">
                            <h3 className="font-bold text-base text-gray-800 mb-2">Monthly Entry Count</h3>
                            <p className="text-xs text-gray-500 mb-4">Entries vs Approved</p>
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { month: 'Jan', entries: 120, approved: 95 },
                                        { month: 'Feb', entries: 145, approved: 115 },
                                        { month: 'Mar', entries: 165, approved: 132 },
                                        { month: 'Apr', entries: 178, approved: 145 },
                                        { month: 'May', entries: 192, approved: 160 },
                                        { month: 'Jun', entries: 210, approved: 182 },
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                                        <Tooltip contentStyle={{ borderRadius: '12px' }} />
                                        <Legend />
                                        <Bar dataKey="entries" fill="#0d6b7a" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="approved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Recent Account Activity */}
                    <div className="bg-white p-6 rounded-2xl shadow-input">
                        <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
                            <CheckCircle size={20} className="text-blue-600" />
                            Recent Account Activity
                        </h3>
                        <div className="space-y-4">
                            {[
                                { id: 1, action: 'Entry approved', vendor: 'Acme Corp', amount: '₹5,240', time: '2 hours ago', status: 'approved' },
                                { id: 2, action: 'Entry rejected', vendor: 'Global Industries', amount: '₹3,100', time: '4 hours ago', status: 'rejected' },
                                { id: 3, action: 'Re-audit completed', vendor: 'Tech Solutions', amount: '₹8,500', time: '1 day ago', status: 'reaudit' },
                                { id: 4, action: 'Tally entry submitted', vendor: 'Finance Ltd', amount: '₹12,300', time: '2 days ago', status: 'pending' },
                                { id: 5, action: 'Bill filed', vendor: 'Express Logistics', amount: '₹2,500', time: '2 days ago', status: 'filed' },
                            ].map((activity) => (
                                <div key={activity.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                                        <p className="text-xs text-gray-400 mt-1">{activity.vendor} • {activity.time}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-bold text-gray-900">{activity.amount}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${activity.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            activity.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                activity.status === 'reaudit' ? 'bg-cyan-100 text-cyan-700' :
                                                    activity.status === 'filed' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                            }`}>{activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
export default Dashboard;

