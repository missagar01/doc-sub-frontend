import { useState, useEffect, useCallback } from 'react';
import useDataStore, { RenewalItem } from '../../store/dataStore';
import useAuthStore from '../../store/authStore';
import useHeaderStore from '../../store/headerStore';
import { Search, X, Check, Upload, Download, Save, Edit2 } from 'lucide-react';
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

    // Inline Editing State
    const [editingDocId, setEditingDocId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<{
        documentName: string;
        documentType: string;
        category: string;
        companyName: string;
        date: string;
        nextRenewalDate: string;
        newFileName: string;
        newFileContent: string;
        againRenewal: boolean;
    }>({
        nextRenewalDate: '',
        newFileName: '',
        newFileContent: '',
        againRenewal: true,
        documentName: '',
        documentType: '',
        category: '',
        companyName: '',
        date: ''
    });

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

    const handleEditRenewal = (doc: DocumentItem) => {
        setEditingDocId(doc.id);
        setEditFormData({
            documentName: doc.documentName,
            documentType: doc.documentType,
            category: doc.category,
            companyName: doc.companyName,
            date: doc.date,
            nextRenewalDate: '',
            newFileName: '',
            newFileContent: '',
            againRenewal: true
        });
    };

    const handleCancelEdit = () => {
        setEditingDocId(null);
        setEditFormData({
            documentName: '',
            documentType: '',
            category: '',
            companyName: '',
            date: '',
            nextRenewalDate: '',
            newFileName: '',
            newFileContent: '',
            againRenewal: true
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const fileName = file.name;
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditFormData(prev => ({
                    ...prev,
                    newFileName: fileName,
                    newFileContent: reader.result as string
                }));
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

    const handleSaveRenewalInline = async (doc: DocumentItem) => {
        if (editFormData.againRenewal && !editFormData.nextRenewalDate) {
            toast.error("Please select Next Renewal Date");
            return;
        }

        try {
            // Import updateDocument from documentApi
            const { updateDocument } = await import('../../utils/documentApi');

            // 1. Create History Record (local for now)
            const historyItem: RenewalItem = {
                id: Math.random().toString(36).substr(2, 9),
                documentId: doc.id,
                sn: doc.sn,
                documentName: doc.documentName,
                documentType: doc.documentType,
                category: doc.category,
                companyName: doc.companyName,
                entryDate: doc.date, // Original Entry Date
                oldRenewalDate: doc.renewalDate || '-',
                oldFile: doc.file,
                oldFileContent: doc.fileContent,
                renewalStatus: editFormData.againRenewal ? 'Yes' : 'No',
                nextRenewalDate: editFormData.againRenewal ? editFormData.nextRenewalDate : null,
                newFile: editFormData.newFileName || null,
                newFileContent: editFormData.newFileContent || undefined
            };

            addRenewalHistory(historyItem);

            // 2. Update Document in backend
            const updates: { 
                need_renewal?: 'yes' | 'no'; 
                renewal_date?: string; 
                image?: string;
                document_name?: string;
                document_type?: string;
                category?: string;
                company_name?: string;
                date?: string;
            } = {
                document_name: editFormData.documentName,
                document_type: editFormData.documentType,
                category: editFormData.category,
                company_name: editFormData.companyName,
                date: editFormData.date,
            };
            
            if (editFormData.againRenewal) {
                updates.renewal_date = editFormData.nextRenewalDate;
                if (editFormData.newFileContent) {
                    updates.image = editFormData.newFileContent;
                }
            } else {
                updates.need_renewal = 'no';
                updates.renewal_date = undefined;
            }

            await updateDocument(parseInt(doc.id), updates);

            // 3. Reload data
            loadRenewalDocuments();

            toast.success("Renewal processed successfully");
            handleCancelEdit();
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
                                        <td className="p-3 text-center flex justify-center items-center gap-2">
                                            {editingDocId === doc.id ? (
                                                <>
                                                    <button onClick={() => handleSaveRenewalInline(doc)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Save">
                                                        <Save size={16} />
                                                    </button>
                                                    <button onClick={handleCancelEdit} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Cancel">
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleEditRenewal(doc)}
                                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 w-full"
                                                    title="Edit Renewal"
                                                >
                                                    <Edit2 size={14} />
                                                    Edit / Renew
                                                </button>
                                            )}
                                        </td>
                                        <td className="p-3 font-bold font-mono text-xs text-gray-700">{doc.sn}</td>
                                        <td className="p-3">
                                            {editingDocId === doc.id ? (
                                                <input 
                                                    type="text" 
                                                    className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-gray-900" 
                                                    value={editFormData.documentName} 
                                                    onChange={e => setEditFormData({...editFormData, documentName: e.target.value})} 
                                                />
                                            ) : (
                                                <span className="font-medium text-gray-900">{doc.documentName}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {editingDocId === doc.id ? (
                                                <input 
                                                    type="text" 
                                                    className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-gray-600" 
                                                    value={editFormData.documentType} 
                                                    onChange={e => setEditFormData({...editFormData, documentType: e.target.value})} 
                                                />
                                            ) : (
                                                <span className="text-gray-600">{doc.documentType}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {editingDocId === doc.id ? (
                                                <input 
                                                    type="text" 
                                                    className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-indigo-700 bg-indigo-50 font-medium" 
                                                    value={editFormData.category} 
                                                    onChange={e => setEditFormData({...editFormData, category: e.target.value})} 
                                                />
                                            ) : (
                                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                                                    {doc.category}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {editingDocId === doc.id ? (
                                                <input 
                                                    type="text" 
                                                    className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900" 
                                                    value={editFormData.companyName} 
                                                    onChange={e => setEditFormData({...editFormData, companyName: e.target.value})} 
                                                />
                                            ) : (
                                                <span className="text-gray-900">{doc.companyName}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {editingDocId === doc.id ? (
                                                <input 
                                                    type="date" 
                                                    className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-gray-500 font-mono" 
                                                    value={editFormData.date} 
                                                    onChange={e => setEditFormData({...editFormData, date: e.target.value})} 
                                                />
                                            ) : (
                                                <span className="text-gray-500 font-mono text-xs">{formatDate(doc.date)}</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            {editingDocId === doc.id ? (
                                                <div className="flex flex-col gap-1">
                                                    <label className="flex items-center gap-2 text-[10px] text-gray-600">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={editFormData.againRenewal} 
                                                            onChange={e => setEditFormData({...editFormData, againRenewal: e.target.checked})} 
                                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                                        /> 
                                                        Again?
                                                    </label>
                                                    {editFormData.againRenewal && (
                                                        <input 
                                                            type="date" 
                                                            className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none" 
                                                            value={editFormData.nextRenewalDate} 
                                                            onChange={e => setEditFormData({...editFormData, nextRenewalDate: e.target.value})} 
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded text-xs font-medium">
                                                    {doc.renewalDate ? formatDate(doc.renewalDate) : 'Pending'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {editingDocId === doc.id && editFormData.againRenewal ? (
                                                <div className="relative">
                                                    <input type="file" id={`file-${doc.id}`} className="hidden" onChange={handleFileChange} />
                                                    <label htmlFor={`file-${doc.id}`} className="flex items-center justify-center gap-1 w-full p-1 border border-dashed border-gray-300 rounded text-gray-600 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-all text-[10px]">
                                                        <Upload size={12} />
                                                        <span className="truncate max-w-[80px]">{editFormData.newFileName || "Upload"}</span>
                                                    </label>
                                                </div>
                                            ) : doc.file ? (
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
                                    {editingDocId === doc.id ? (
                                        <input
                                            type="text"
                                            className="w-full mt-2 p-1.5 border border-gray-300 rounded text-sm font-semibold text-gray-900 focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={editFormData.companyName}
                                            onChange={e => setEditFormData({...editFormData, companyName: e.target.value})}
                                        />
                                    ) : (
                                        <h3 className="font-semibold text-gray-900 mt-1">{doc.companyName}</h3>
                                    )}
                                    
                                    {editingDocId === doc.id ? (
                                        <input
                                            type="text"
                                            className="w-full mt-1 p-1.5 border border-gray-300 rounded text-xs text-gray-600 focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={editFormData.documentType}
                                            onChange={e => setEditFormData({...editFormData, documentType: e.target.value})}
                                        />
                                    ) : (
                                        <p className="text-xs text-gray-500 mt-1">{doc.documentType}</p>
                                    )}
                                </div>
                                {editingDocId === doc.id ? (
                                    <input
                                        type="text"
                                        className="w-24 p-1 border border-gray-300 rounded text-[10px] font-medium text-indigo-700 bg-indigo-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        value={editFormData.category}
                                        onChange={e => setEditFormData({...editFormData, category: e.target.value})}
                                    />
                                ) : (
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-medium mt-1">
                                        {doc.category}
                                    </span>
                                )}
                            </div>

                            <div className="pt-2 border-t border-gray-50">
                                {editingDocId === doc.id ? (
                                    <input
                                        type="text"
                                        className="w-full mb-2 p-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        value={editFormData.documentName}
                                        onChange={e => setEditFormData({...editFormData, documentName: e.target.value})}
                                    />
                                ) : (
                                    <p className="text-sm font-medium text-gray-700 mb-2">{doc.documentName}</p>
                                )}
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span className="flex items-center gap-1">Entry: 
                                        {editingDocId === doc.id ? (
                                            <input
                                                type="date"
                                                className="w-[110px] p-0.5 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none"
                                                value={editFormData.date}
                                                onChange={e => setEditFormData({...editFormData, date: e.target.value})}
                                            />
                                        ) : (
                                            formatDate(doc.date)
                                        )}
                                    </span>
                                    <span className="flex items-center gap-1 font-medium text-amber-600 bg-amber-50 px-1.5 rounded">
                                        Renewal: 
                                        {editingDocId === doc.id ? (
                                            <input 
                                                type="date" 
                                                className="w-[110px] p-0.5 border border-amber-300 rounded text-[10px] focus:ring-1 focus:ring-amber-500 outline-none ml-1 bg-white" 
                                                value={editFormData.nextRenewalDate} 
                                                onChange={e => setEditFormData({...editFormData, nextRenewalDate: e.target.value})} 
                                            />
                                        ) : doc.renewalDate || 'Pending'}
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
                                {editingDocId === doc.id ? (
                                    <>
                                        <button onClick={() => handleSaveRenewalInline(doc)} className="p-1.5 text-green-600 bg-green-50 rounded-lg" title="Save">
                                            <Save size={16} />
                                        </button>
                                        <button onClick={handleCancelEdit} className="p-1.5 text-gray-500 bg-gray-100 rounded-lg" title="Cancel">
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleEditRenewal(doc)}
                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1"
                                        title="Edit Renewal"
                                    >
                                        <Edit2 size={14} /> Edit / Renew
                                    </button>
                                )}
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

            {/* Removed the monolithic Document Renewal Modal handling */ }
        </div>
    );
};

export default DocumentRenewal;
