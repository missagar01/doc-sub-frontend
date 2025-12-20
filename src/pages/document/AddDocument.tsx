import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Save, Plus, Upload, Trash2 } from 'lucide-react';
import SearchableInput from '../../components/SearchableInput';
import { createMultipleDocuments } from '../../utils/documentApi';
import { fetchDocumentTypes, fetchCategories } from '../../utils/masterApi';

interface DocumentEntry {
    id: string;
    documentName: string;
    documentType: string;
    category: string;
    companyName: string; // The "Name" field
    needsRenewal: boolean;
    renewalDate?: string;
    file: File | null;
    fileName: string;
    fileContent?: string;
}

interface AddDocumentProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddDocument: React.FC<AddDocumentProps> = ({ isOpen, onClose }) => {
    const [typeOptions, setTypeOptions] = useState<string[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

    const defaultCategories = ['Personal', 'Company', 'Director'];

    // Fetch document types and categories from master table
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [types, categories] = await Promise.all([
                    fetchDocumentTypes(),
                    fetchCategories()
                ]);
                setTypeOptions(types.filter((t: string) => t)); // Remove empty strings
                // Merge backend categories with defaults
                const allCategories = Array.from(new Set([...categories.filter((c: string) => c), ...defaultCategories]));
                setCategoryOptions(allCategories);
            } catch (err) {
                console.error('Failed to load options:', err);
                setCategoryOptions(defaultCategories);
            }
        };
        if (isOpen) {
            loadOptions();
        }
    }, [isOpen]);

    const [entries, setEntries] = useState<DocumentEntry[]>([
        {
            id: Math.random().toString(),
            documentName: '',
            documentType: '',
            category: '',
            companyName: '',
            needsRenewal: false,
            renewalDate: '',
            file: null,
            fileName: ''
        }
    ]);

    if (!isOpen) return null;

    const handleChange = (id: string, field: keyof DocumentEntry, value: any) => {
        setEntries(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEntries(prev => prev.map(item => item.id === id ? {
                    ...item,
                    file: file,
                    fileName: file.name,
                    fileContent: reader.result as string
                } : item));
            };
            reader.readAsDataURL(file);
        }
    };

    const addEntry = () => {
        if (entries.length >= 10) {
            toast.error("You can add maximum 10 documents at a time.");
            return;
        }
        setEntries(prev => [
            ...prev,
            {
                id: Math.random().toString(),
                documentName: '',
                documentType: '',
                category: '',
                companyName: '',
                needsRenewal: false,
                renewalDate: '',
                file: null,
                fileName: ''
            }
        ]);
    };

    const removeEntry = (id: string) => {
        if (entries.length === 1) {
            toast.error("At least one document is required.");
            return;
        }
        setEntries(prev => prev.filter(item => item.id !== id));
    };

    const getNameLabel = (category: string) => {
        const c = category?.toLowerCase() || '';
        if (c.includes('personal')) return 'Person Name';
        if (c.includes('director')) return 'Director Name';
        if (c.includes('company')) return 'Company Name';
        return 'Name';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        for (const entry of entries) {
            if (!entry.documentName || !entry.documentType || !entry.category || !entry.companyName) {
                toast.error("Please fill all required fields.");
                return;
            }
            if (entry.needsRenewal && !entry.renewalDate) {
                toast.error("Please select a renewal date.");
                return;
            }
        }

        try {
            // Map entries to backend format
            const documentsToCreate = entries.map(entry => {
                // Also update master data locally (optional but keeps consistency)
                const exists = masterData?.some(m =>
                    m.companyName.toLowerCase() === entry.companyName.toLowerCase() &&
                    m.documentType.toLowerCase() === entry.documentType.toLowerCase() &&
                    m.category.toLowerCase() === entry.category.toLowerCase()
                );

                if (!exists) {
                    addMasterData({
                        id: Math.random().toString(36).substr(2, 9),
                        companyName: entry.companyName,
                        documentType: entry.documentType,
                        category: entry.category
                    });
                }

                return {
                    document_name: entry.documentName,
                    document_type: entry.documentType,
                    category: entry.category,
                    person_name: entry.companyName,
                    company_department: entry.category === 'Company' ? entry.companyName : undefined,
                    need_renewal: entry.needsRenewal ? 'yes' as const : 'no' as const,
                    renewal_date: entry.needsRenewal ? entry.renewalDate : undefined,
                    image: entry.fileContent || undefined
                };
            });

            await createMultipleDocuments(documentsToCreate);
            toast.success(`${documentsToCreate.length} Document(s) added successfully`);
            onClose();

            setEntries([{
                id: Math.random().toString(),
                documentName: '',
                documentType: '',
                category: '',
                companyName: '',
                needsRenewal: false,
                renewalDate: '',
                file: null,
                fileName: ''
            }]);
        } catch (err) {
            console.error('Failed to create documents:', err);
            toast.error('Failed to create documents');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-input my-4">
                {/* Header Compact */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">New Document Entry</h2>
                        <p className="text-xs text-gray-500">Add details (Max 10)</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body Compact */}
                <div className="p-4 max-h-[75vh] overflow-y-auto bg-gray-50/30">
                    <form id="add-doc-form" onSubmit={handleSubmit} className="space-y-3">
                        {entries.map((entry, index) => (
                            <div key={entry.id} className="bg-white p-4 rounded-lg shadow-input relative group">
                                <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-50">
                                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Document #{index + 1}</h3>
                                    {entries.length > 1 && (
                                        <button type="button" onClick={() => removeEntry(entry.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Compact Grid: Gaps reduced */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                                    {/* 1. Document Name (Input) */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Document Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full p-2 text-xs shadow-input border-none rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none font-medium bg-gray-50/50 focus:bg-white transition-colors"
                                            value={entry.documentName}
                                            onChange={e => handleChange(entry.id, 'documentName', e.target.value)}
                                            placeholder="e.g. Agreement"
                                        />
                                    </div>

                                    {/* 2. Document Type (Searchable) */}
                                    <div>
                                        {/* Note: SearchableInput styles are internal, but we can wrap it or accept it's slightly larger. 
                                             For compacting, we might just use it as is but careful with layout. 
                                             Ideally, SearchableInput should support size prop. 
                                             For now, we leave it as 'proper' update focused on layout gaps. */}
                                        <SearchableInput compact
                                            label="Document Type"
                                            value={entry.documentType}
                                            onChange={val => handleChange(entry.id, 'documentType', val)}
                                            options={typeOptions}
                                            placeholder="Select Type..."
                                            required
                                        />
                                    </div>

                                    {/* 3. Category (Searchable) */}
                                    <div>
                                        <SearchableInput compact
                                            label="Category"
                                            value={entry.category}
                                            onChange={val => handleChange(entry.id, 'category', val)}
                                            options={categoryOptions}
                                            placeholder="Select Category..."
                                            required
                                        />
                                    </div>

                                    {/* 4. Name (Input - as changed from Searchable per 'Input' requirement) */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">{getNameLabel(entry.category)} <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full p-2 text-xs shadow-input border-none rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none font-medium bg-gray-50/50 focus:bg-white transition-colors"
                                            value={entry.companyName}
                                            onChange={e => handleChange(entry.id, 'companyName', e.target.value)}
                                            placeholder={`Enter ${getNameLabel(entry.category)}...`}
                                        />
                                    </div>

                                    {/* 5. Needs Renewal & Date */}
                                    <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                checked={entry.needsRenewal}
                                                onChange={e => handleChange(entry.id, 'needsRenewal', e.target.checked)}
                                            />
                                            <span className="text-xs font-medium text-gray-700">Need Renewal</span>
                                        </label>

                                        {entry.needsRenewal && (
                                            <div className="flex-1">
                                                <input
                                                    type="date"
                                                    className="w-full p-1.5 text-xs shadow-input border-none rounded focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                                                    value={entry.renewalDate || ''}
                                                    onChange={e => handleChange(entry.id, 'renewalDate', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* 6. File Upload */}
                                    <div>
                                        <div className="relative">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Upload File</label>
                                            <input
                                                type="file"
                                                id={`file-${entry.id}`}
                                                className="hidden"
                                                onChange={e => handleFileChange(entry.id, e)}
                                            />
                                            <label
                                                htmlFor={`file-${entry.id}`}
                                                className="flex items-center justify-center gap-2 w-full p-2 border border-dashed border-gray-300 rounded-lg text-gray-600 cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all bg-white"
                                            >
                                                <Upload size={14} />
                                                <span className="text-xs font-medium truncate max-w-[180px]">{entry.fileName || "Choose File"}</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-center pt-2">
                            <button
                                type="button"
                                onClick={addEntry}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-indigo-200 text-indigo-600 text-xs font-bold hover:bg-indigo-50 transition-colors bg-white shadow-sm"
                            >
                                <Plus size={16} />
                                Add Another Document ({entries.length}/10)
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer Compact */}
                <div className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    <button type="button" onClick={onClose} className="flex-1 py-2 px-3 rounded-lg border border-gray-200 text-gray-700 text-sm font-bold hover:bg-white hover:border-gray-300 transition-all shadow-sm">
                        Cancel
                    </button>
                    <button type="submit" form="add-doc-form" className="flex-[2] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
                        <Save size={16} />
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddDocument;
