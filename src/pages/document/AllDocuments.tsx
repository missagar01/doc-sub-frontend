import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Download, Edit, Trash2, MoreHorizontal, Mail, MessageCircle, Share2 } from 'lucide-react';
import useDataStore from '../../store/dataStore';
import useHeaderStore from '../../store/headerStore';
import AddDocument from './AddDocument';
import EditDocument from './EditDocument';
import ShareModal from './ShareModal';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { formatDate } from '../../utils/dateFormatter';

const AllDocuments = () => {
    const { documents, deleteDocument } = useDataStore();
    const { setTitle } = useHeaderStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        setTitle('All Document');
    }, [setTitle]);

    const filteredData = documents.filter(item => {
        const matchesSearch = item.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sn.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = filterCategory ? item.category === filterCategory : true;
        
        return matchesSearch && matchesCategory;
    });

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleAll = () => {
        if (selectedIds.size === filteredData.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredData.map(d => d.id)));
        }
    };

    const [editingDocId, setEditingDocId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Share Modal State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareType, setShareType] = useState<'email' | 'whatsapp' | 'both' | null>(null);
    const [shareDoc, setShareDoc] = useState<{id: string, name: string} | null>(null);

    const handleEdit = (id: string) => {
        setEditingDocId(id);
        setIsEditModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this document?")) {
            deleteDocument(id);
            // Also remove from selected if necessary
            if (selectedIds.has(id)) {
                const newSelected = new Set(selectedIds);
                newSelected.delete(id);
                setSelectedIds(newSelected);
            }
        }
    };

    const openShare = (type: 'email' | 'whatsapp' | 'both', doc: {id: string, name: string}) => {
        setShareType(type);
        setShareDoc(doc);
        setIsShareModalOpen(true);
    };

    const handleDownload = (fileContent: string | undefined, fileName: string | null) => {
        if (!fileContent) {
            alert("File content not available for download (demo data).");
            return;
        }
        const link = document.createElement('a');
        link.href = fileContent;
        link.download = fileName || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  return (
    <>
    <div className="space-y-3">
      {/* Search and Action Bar */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl shadow-input">
        <div className="min-h-[38px] flex items-center">
             {selectedIds.size > 0 ? (
                 <div className="flex flex-wrap items-center gap-3 animate-fade-in-right w-full sm:w-auto">
                     <span className="text-sm text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 whitespace-nowrap">
                         {selectedIds.size} Selected
                     </span>
                     <div className="hidden sm:block h-4 w-px bg-gray-200 mx-1"></div>
                     <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <button 
                            onClick={() => openShare('email', {id: 'batch', name: `${selectedIds.size} Documents`})}
                            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                            title="Share via Email"
                        >
                            <Mail size={14} />
                            Email
                        </button>
                        <button 
                            onClick={() => openShare('whatsapp', {id: 'batch', name: `${selectedIds.size} Documents`})}
                            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-100"
                            title="Share via WhatsApp"
                        >
                            <MessageCircle size={14} />
                            WhatsApp
                        </button>
                     </div>
                 </div>
             ) : (
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">All Documents</h1>
                  <p className="text-gray-500 text-sm mt-1">Manage your documents repository</p>
                </div>
             )}
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                    type="text"
                    placeholder="Search documents..."
                    className="pl-10 pr-4 py-2.5 w-full shadow-input border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {/* Filter Dropdown */}
             <div className="relative">
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2.5 shadow-input border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-700 text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                >
                    <option value="">All Categories</option>
                    {/* Dynamic Categories */}
                    {Array.from(new Set(documents.map(d => d.category))).filter(Boolean).sort().map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
             </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            <span>Add New</span>
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:flex flex-col bg-white rounded-xl shadow-input overflow-hidden h-[calc(100vh-350px)]">
        <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-gray-50 shadow-sm">
            <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                    <th className="px-3 py-2 w-10 text-center bg-gray-50">
                        <input 
                            type="checkbox" 
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                            onChange={toggleAll}
                        />
                    </th>
                    <th className="px-3 py-2 w-12 text-center bg-gray-50">Share</th>
                    <th className="px-3 py-2 w-20 text-center bg-gray-50">Action</th>
                    <th className="px-3 py-2 whitespace-nowrap bg-gray-50">Serial No</th>
                    <th className="px-3 py-2 whitespace-nowrap bg-gray-50">Document Name</th>
                    <th className="px-3 py-2 whitespace-nowrap bg-gray-50">Document Type</th>
                    <th className="px-3 py-2 whitespace-nowrap bg-gray-50">Category</th>
                    <th className="px-3 py-2 whitespace-nowrap bg-gray-50">Name</th>
                    <th className="px-3 py-2 whitespace-nowrap text-center bg-gray-50">Renewal</th>
                    <th className="px-3 py-2 whitespace-nowrap bg-gray-50">Renewal Date</th>
                    <th className="px-3 py-2 whitespace-nowrap bg-gray-50">File</th>
                </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
                {filteredData.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50/80 transition-colors ${selectedIds.has(item.id) ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-3 py-2 text-center">
                        <input 
                            type="checkbox" 
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleSelection(item.id)}
                        />
                    </td>
                    <td className="px-3 py-2 text-center">
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors outline-none">
                                    <MoreHorizontal size={20} />
                                </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                                <DropdownMenu.Content className="min-w-[160px] bg-white rounded-lg shadow-xl border border-gray-100 p-1.5 z-50 animate-fade-in-up" sideOffset={5} align="start">
                                    <DropdownMenu.Item 
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md cursor-pointer outline-none"
                                        onClick={() => openShare('email', {id: item.id, name: item.documentName})}
                                    >
                                        <Mail size={16} className="text-blue-500" />
                                        Email
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item 
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md cursor-pointer outline-none"
                                        onClick={() => openShare('whatsapp', {id: item.id, name: item.documentName})}
                                    >
                                        <MessageCircle size={16} className="text-green-500" />
                                        WhatsApp
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
                                    <DropdownMenu.Item 
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md cursor-pointer outline-none"
                                        onClick={() => openShare('both', {id: item.id, name: item.documentName})}
                                    >
                                        <Share2 size={16} className="text-purple-500" />
                                        Share Both
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                    </td>
                    <td className="px-3 py-2 flex justify-center items-center gap-2">
                         <button 
                            onClick={() => handleEdit(item.id)} 
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                         >
                             <Edit size={16} />
                         </button>
                         <button 
                            onClick={() => handleDelete(item.id)} 
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                         >
                             <Trash2 size={16} />
                         </button>
                    </td>
                    <td className="px-3 py-2 font-bold text-gray-700 text-xs">{item.sn}</td>
                    <td className="px-3 py-2 text-gray-900 flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" />
                        {item.documentName}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{item.documentType}</td>
                    <td className="px-3 py-2 text-gray-600">
                         <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                             {item.category}
                         </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900">{item.companyName}</td>
                    <td className="px-3 py-2 text-center">
                         {item.needsRenewal ? (
                             <span className="inline-flex items-center justify-center px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded text-xs font-medium">
                                Yes
                             </span>
                         ) : (
                             <span className="inline-flex items-center justify-center px-2.5 py-1 bg-gray-50 text-gray-500 border border-gray-100 rounded text-xs font-medium">
                                No
                             </span>
                         )}
                    </td>
                    <td className="px-3 py-2 text-gray-500 font-mono text-xs">{formatDate(item.renewalDate)}</td>
                    <td className="px-3 py-2">
                        {item.file ? (
                            <div 
                                onClick={() => handleDownload(item.fileContent, item.file)}
                                className="flex items-center gap-2 text-indigo-600 text-xs cursor-pointer hover:underline"
                            >
                                <Download size={14} />
                                <span className="truncate max-w-[100px]">View</span>
                            </div>
                        ) : (
                            <span className="text-gray-400 text-xs">-</span>
                        )}
                    </td>
                </tr>
                ))}
                {filteredData.length === 0 && (
                    <tr>
                        <td colSpan={11} className="p-12 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                                <FileText size={48} className="text-gray-200" />
                                <p>No documents found</p>
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid sm:grid-cols-2 gap-4">
        {filteredData.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-input space-y-3">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{item.sn}</span>
                        <h3 className="font-semibold text-gray-900 mt-1">{item.companyName}</h3>
                        <p className="text-xs text-gray-500">{item.documentType}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-medium border border-indigo-100">
                         {item.category}
                    </span>
                </div>
                
                <div className="pt-2 border-t border-gray-50">
                    <div className="flex items-start gap-2 mb-2">
                        <FileText size={16} className="text-gray-400 mt-0.5 max-w-4" />
                        <span className="text-sm text-gray-700 font-medium line-clamp-2">{item.documentName}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs mt-3">
                         <div className="flex items-center gap-2">
                             <span className="text-gray-500">Renewal:</span>
                             {item.needsRenewal ? (
                                 <span className="text-amber-600 font-medium bg-amber-50 px-1.5 rounded">Yes</span>
                             ) : (
                                 <span className="text-gray-400 font-medium bg-gray-50 px-1.5 rounded">No</span>
                             )}
                         </div>
                         {item.needsRenewal && (
                            <span className="font-mono text-red-500 bg-red-50 px-1.5 rounded">{formatDate(item.renewalDate)}</span>
                         )}
                    </div>
                    
                    <div className="pt-3 mt-3 border-t border-gray-50 flex justify-between items-center bg-gray-50/50 -mx-4 -mb-4 px-4 py-3">
                         {item.file ? (
                             <button 
                                 onClick={() => handleDownload(item.fileContent, item.file)}
                                 className="flex items-center gap-1.5 text-indigo-600 text-xs font-medium"
                             >
                                 <Download size={14} />
                                 Download
                             </button>
                         ) : (
                             <span className="text-gray-400 text-xs">-</span>
                         )}
                         <div className="flex gap-2">
                             <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                    <button className="p-1.5 text-indigo-600 bg-indigo-50 rounded-lg">
                                        <Share2 size={14} />
                                    </button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Portal>
                                    <DropdownMenu.Content className="min-w-[160px] bg-white rounded-lg shadow-xl border border-gray-100 p-1.5 z-50 animate-fade-in-up" sideOffset={5} align="end">
                                        <DropdownMenu.Item 
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md cursor-pointer outline-none"
                                            onClick={() => openShare('email', {id: item.id, name: item.documentName})}
                                        >
                                            <Mail size={16} className="text-blue-500" />
                                            Email
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item 
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md cursor-pointer outline-none"
                                            onClick={() => openShare('whatsapp', {id: item.id, name: item.documentName})}
                                        >
                                            <MessageCircle size={16} className="text-green-500" />
                                            WhatsApp
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
                                        <DropdownMenu.Item 
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md cursor-pointer outline-none"
                                            onClick={() => openShare('both', {id: item.id, name: item.documentName})}
                                        >
                                            <Share2 size={16} className="text-purple-500" />
                                            Share Both
                                        </DropdownMenu.Item>
                                    </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                            </DropdownMenu.Root>

                            <button onClick={() => handleEdit(item.id)} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg">
                                <Edit size={14} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 bg-red-50 rounded-lg">
                                <Trash2 size={14} />
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        ))}
         {filteredData.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100 border-dashed">
                <div className="flex flex-col items-center gap-2">
                    <FileText size={40} className="text-gray-200" />
                    <p>No documents found</p>
                </div>
            </div>
        )}
      </div>
    </div>
    <AddDocument isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    <EditDocument isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} documentId={editingDocId} />
    <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        type={shareType} 
        documentId={shareDoc?.id || ''} 
        documentName={shareDoc?.name || ''} 
    />
    </>
  );
};
export default AllDocuments;
