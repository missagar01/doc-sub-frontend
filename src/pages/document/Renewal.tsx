import { useState, useEffect, useCallback } from 'react';
import useDataStore, { RenewalItem } from '../../store/dataStore';
import useAuthStore from '../../store/authStore';
import useHeaderStore from '../../store/headerStore';
import { Search, FileText, X, Check, Clock, AlertTriangle, Calendar, ExternalLink, Upload, Download, RotateCcw, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/dateFormatter';
import { fetchDocumentsNeedingRenewal, mapBackendToFrontend, BackendDocument } from '../../utils/documentApi';

// Frontend Document interface for this page
interface DocumentItem {
    id: string;
    sn: string;
    documentName: string;
    companyName: string;
    documentType: string;
    category: string;
    needsRenewal: boolean;
    renewalDate?: string;
    file: string | null;
    fileContent?: string;
    date: string;
    status: string;
}

const DocumentRenewal = () => {
    const { setTitle } = useHeaderStore();
    const { currentUser } = useAuthStore();
    const { renewalHistory, addRenewalHistory } = useDataStore();

    // State for documents from backend
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('Document Renewal');
    }, [setTitle]);

    // Fetch documents needing renewal from backend
    const loadRenewalDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchDocumentsNeedingRenewal();
            setDocuments(data.map((doc: BackendDocument) => mapBackendToFrontend(doc)));
        } catch (err) {
            console.error('Failed to load renewal documents:', err);
            toast.error('Failed to load renewal documents');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRenewalDocuments();
    }, [loadRenewalDocuments]);

    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

    // Form State
    const [againRenewal, setAgainRenewal] = useState(true);
    const [nextRenewalDate, setNextRenewalDate] = useState('');
    const [newFileName, setNewFileName] = useState('');
    const [newFileContent, setNewFileContent] = useState<string>('');

    // Filter Pending Documents by search term and Role
    const pendingDocuments = documents.filter(doc => {
        // Role check
        if (currentUser?.role !== 'admin' && doc.companyName !== currentUser?.name) {
            return false;
        }
        // Search check
        return (
            doc.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.sn.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const filteredHistory = renewalHistory.filter(item => {
        // Role check
        if (currentUser?.role !== 'admin' && item.companyName !== currentUser?.name) {
            return false;
        }
        // Search check
        return (
            item.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sn.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const handleOpenRenewal = (doc: DocumentItem) => {
        setSelectedDoc(doc);
        setAgainRenewal(true);
        setNextRenewalDate('');
        setNewFileName('');
        setNewFileContent('');
        setIsRenewalModalOpen(true);
    };

    const handleCloseRenewal = () => {
        setIsRenewalModalOpen(false);
        setSelectedDoc(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewFileContent(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDownload = (fileContent: string | undefined, fileName: string | null) => {
        if (!fileContent) {
            alert("File content not available for download.");
            return;
        }

        // If it's an S3 URL (starts with http), open in new tab
        if (fileContent.startsWith('http://') || fileContent.startsWith('https://')) {
            window.open(fileContent, '_blank');
            return;
        }

        // For base64 data, download as file
        const link = document.createElement('a');
        link.href = fileContent;
        link.download = fileName || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSaveRenewal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoc) return;

        if (againRenewal && !nextRenewalDate) {
            toast.error("Please select Next Renewal Date");
            return;
        }

        try {
            // Import updateDocument from documentApi
            const { updateDocument } = await import('../../utils/documentApi');

            // 1. Create History Record (local for now)
            const historyItem: RenewalItem = {
                id: Math.random().toString(36).substr(2, 9),
                documentId: selectedDoc.id,
                sn: selectedDoc.sn,
                documentName: selectedDoc.documentName,
                documentType: selectedDoc.documentType,
                category: selectedDoc.category,
                companyName: selectedDoc.companyName,
                entryDate: selectedDoc.date, // Original Entry Date
                oldRenewalDate: selectedDoc.renewalDate || '-',
                oldFile: selectedDoc.file,
                oldFileContent: selectedDoc.fileContent,
                renewalStatus: againRenewal ? 'Yes' : 'No',
                nextRenewalDate: againRenewal ? nextRenewalDate : null,
                newFile: newFileName || null,
                newFileContent: newFileContent || undefined
            };

            addRenewalHistory(historyItem);

            // 2. Update Document in backend
            const updates: { need_renewal?: 'yes' | 'no'; renewal_date?: string; image?: string } = {};
            if (againRenewal) {
                updates.renewal_date = nextRenewalDate;
                if (newFileContent) {
                    updates.image = newFileContent;
                }
            } else {
                updates.need_renewal = 'no';
                updates.renewal_date = undefined;
            }

            await updateDocument(parseInt(selectedDoc.id), updates);

            // 3. Reload data
            loadRenewalDocuments();

            toast.success("Renewal processed successfully");
            handleCloseRenewal();
        } catch (err) {
            console.error('Failed to process renewal:', err);
            toast.error("Failed to process renewal");
        }
    };

    return (
        <div className="space-y-6 p-6">
            {/* Unified Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Document Renewals</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage pending and history of document renewals</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

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

            {/* Content By Tab */}
            {/* Desktop Table View */}
            <div className="hidden md:flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-350px)]">
                {activeTab === 'pending' ? (
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-20 bg-gray-50 shadow-sm">
                                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="p-3 text-center bg-gray-50">Action</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Serial No</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Document Name</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Document Type</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Category</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Name</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Entry Date</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Renewal</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Document File</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {pendingDocuments.length > 0 ? pendingDocuments.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => handleOpenRenewal(doc)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                                            >
                                                <RotateCcw size={14} />
                                                Renewal
                                            </button>
                                        </td>
                                        <td className="p-3 font-bold font-mono text-xs text-gray-700">{doc.sn}</td>
                                        <td className="p-3 font-medium text-gray-900">{doc.documentName}</td>
                                        <td className="p-3 text-gray-600">{doc.documentType}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                                                {doc.category}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-900">{doc.companyName}</td>
                                        <td className="p-3 text-gray-500 font-mono text-xs">{formatDate(doc.date)}</td>
                                        <td className="p-3 text-center">
                                            <span className="inline-flex items-center justify-center px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded text-xs font-medium">
                                                {doc.renewalDate ? formatDate(doc.renewalDate) : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {doc.file ? (
                                                <div
                                                    onClick={() => handleDownload(doc.fileContent, doc.file)}
                                                    className="flex items-center gap-2 text-indigo-600 text-xs cursor-pointer hover:underline"
                                                >
                                                    <Download size={14} />
                                                    <span className="truncate max-w-[100px]">View</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={9} className="p-12 text-center">
                                            <div className="flex flex-col items-center justify-center p-8 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                                                <div className="h-16 w-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
                                                    <Check size={32} />
                                                </div>
                                                <h3 className="text-gray-900 font-bold text-lg">All Caught Up!</h3>
                                                <p className="text-gray-500 text-sm mt-1">No documents require renewal at this time.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-20 bg-gray-50 shadow-sm">
                                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Serial No</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Document Name</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Document Type</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Category</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Name</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Entry Date</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Renewal</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Document File</th>
                                    <th className="p-3 whitespace-nowrap text-center bg-gray-50">Renewal Status</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">Next Renewal Date</th>
                                    <th className="p-3 whitespace-nowrap bg-gray-50">New Document File</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {filteredHistory.length > 0 ? filteredHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="p-3 font-bold font-mono text-xs text-gray-700">{item.sn}</td>
                                        <td className="p-3 font-medium text-gray-900">{item.documentName}</td>
                                        <td className="p-3 text-gray-600">{item.documentType}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-900">{item.companyName}</td>
                                        <td className="p-3 text-gray-500 font-mono text-xs">{formatDate(item.entryDate)}</td>
                                        <td className="p-3 text-gray-500 font-mono text-xs line-through decoration-red-400">
                                            {formatDate(item.oldRenewalDate)}
                                        </td>
                                        <td className="p-3 text-gray-500">
                                            {item.oldFile ? (
                                                <div
                                                    onClick={() => handleDownload(item.oldFileContent, item.oldFile)}
                                                    className="flex items-center gap-1 text-gray-600 text-xs cursor-pointer hover:text-indigo-600 hover:underline"
                                                >
                                                    <Download size={12} />
                                                    <span className="truncate max-w-[100px]">View</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="p-3 text-center">
                                            {item.renewalStatus === 'Yes' ? (
                                                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-green-100">
                                                    <Check size={12} /> Yes
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-gray-100">
                                                    <X size={12} /> No
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 font-medium text-indigo-600 font-mono text-xs">
                                            {formatDate(item.nextRenewalDate)}
                                        </td>
                                        <td className="p-3">
                                            {item.newFile ? (
                                                <span
                                                    onClick={() => handleDownload(item.newFileContent, item.newFile)}
                                                    className="text-indigo-600 font-medium flex items-center gap-1 cursor-pointer hover:underline text-xs"
                                                >
                                                    <Download size={12} /> View
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={11} className="p-12 text-center text-gray-500">
                                            <p>No renewal history available</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4">
                {activeTab === 'pending' ? (
                    pendingDocuments.length > 0 ? pendingDocuments.map((doc) => (
                        <div key={doc.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-mono font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded">{doc.sn}</span>
                                    <h3 className="font-semibold text-gray-900 mt-1">{doc.companyName}</h3>
                                    <p className="text-xs text-gray-500">{doc.documentType}</p>
                                </div>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                                    {doc.category}
                                </span>
                            </div>

                            <div className="pt-2 border-t border-gray-50">
                                <p className="text-sm font-medium text-gray-700 mb-2">{doc.documentName}</p>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>Entry: {doc.date}</span>
                                    <span className="flex items-center gap-1 font-medium text-amber-600 bg-amber-50 px-1.5 rounded">
                                        Renewal: {doc.renewalDate || 'Pending'}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-3 flex items-center justify-between gap-3">
                                {doc.file ? (
                                    <button
                                        onClick={() => handleDownload(doc.fileContent, doc.file)}
                                        className="flex items-center gap-1.5 text-indigo-600 text-xs font-medium bg-indigo-50 px-2 py-1.5 rounded-lg"
                                    >
                                        <Download size={14} />
                                        View File
                                    </button>
                                ) : (
                                    <span className="text-gray-400 text-xs italic">No file</span>
                                )}
                                <button
                                    onClick={() => handleOpenRenewal(doc)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-sm"
                                >
                                    <RotateCcw size={14} />
                                    Renewal
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="bg-white p-8 rounded-xl text-center text-gray-500">
                            <p>No documents pending renewal</p>
                        </div>
                    )
                ) : (
                    filteredHistory.length > 0 ? filteredHistory.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-mono font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded">{item.sn}</span>
                                    <h3 className="font-semibold text-gray-900 mt-1">{item.companyName}</h3>
                                </div>
                                <div className="text-right">
                                    {item.renewalStatus === 'Yes' ? (
                                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                                            <Check size={10} /> Yes
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                                            <X size={10} /> No
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-50">
                                <p className="text-sm font-medium text-gray-700 mb-1">{item.documentName}</p>
                                <div className="text-xs text-gray-500 grid grid-cols-2 gap-2 mt-2">
                                    <div>
                                        <span className="block text-gray-400 text-[10px] uppercase">Old Renewal</span>
                                        <span className="line-through decoration-red-300">{item.oldRenewalDate}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-400 text-[10px] uppercase">Next Renewal</span>
                                        <span className="font-medium text-indigo-600">{item.nextRenewalDate || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 flex items-center justify-between gap-3 border-t border-gray-50 mt-1">
                                <div className="flex gap-3">
                                    {item.oldFile && (
                                        <button
                                            onClick={() => handleDownload(item.oldFileContent, item.oldFile)}
                                            className="flex items-center gap-1 text-gray-500 text-xs hover:text-indigo-600"
                                        >
                                            <Download size={14} />
                                            Old File
                                        </button>
                                    )}
                                    {item.newFile && (
                                        <button
                                            onClick={() => handleDownload(item.newFileContent, item.newFile)}
                                            className="flex items-center gap-1 text-indigo-600 text-xs font-medium"
                                        >
                                            <Download size={14} />
                                            New File
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="bg-white p-8 rounded-xl text-center text-gray-500">
                            <p>No renewal history available</p>
                        </div>
                    )
                )}
            </div>

            {/* Renewal Modal */}
            {isRenewalModalOpen && selectedDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-base font-bold text-gray-800">Process Renewal</h3>
                                <p className="text-[10px] text-gray-500 mt-0.5">Update renewal status for this document</p>
                            </div>
                            <button onClick={handleCloseRenewal} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveRenewal} className="p-4 space-y-4">
                            {/* Pre-filled Info Grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                                <div className="col-span-2">
                                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Document</label>
                                    <div className="font-medium text-gray-900">{selectedDoc.documentName}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Serial No</label>
                                    <div className="font-mono text-gray-700">{selectedDoc.sn}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Name</label>
                                    <div className="text-gray-700">{selectedDoc.companyName}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Category</label>
                                    <div className="text-gray-700">{selectedDoc.category}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Current Renewal</label>
                                    <div className="text-amber-600 font-medium">{selectedDoc.renewalDate || 'N/A'}</div>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Current File</label>
                                    <div className="text-gray-600 truncate">{selectedDoc.file || 'No file attached'}</div>
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-2.5 border border-gray-200 rounded-xl hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => setAgainRenewal(!againRenewal)}>
                                    <span className="font-medium text-sm text-gray-700">Again Renewal?</span>
                                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${againRenewal ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${againRenewal ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                </div>

                                {againRenewal && (
                                    <div className="space-y-3 animate-fade-in-up">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Next Renewal Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                                <input
                                                    type="date"
                                                    required
                                                    className="w-full pl-9 p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    value={nextRenewalDate}
                                                    onChange={e => setNextRenewalDate(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">New Document File</label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id="renewal-file"
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                />
                                                <label
                                                    htmlFor="renewal-file"
                                                    className="flex items-center justify-center gap-2 w-full p-2.5 border border-dashed border-gray-300 rounded-xl text-gray-600 cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                                                >
                                                    <Upload size={16} />
                                                    <span className="text-xs font-medium truncate max-w-[180px]">{newFileName || "Upload New Version"}</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleCloseRenewal}
                                    className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
                                >
                                    Save Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentRenewal;
