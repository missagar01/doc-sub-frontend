import React, { useState, useMemo, useEffect } from 'react';
import useDataStore, { DocumentItem, MasterItem } from '../../store/dataStore';
import { toast } from 'react-hot-toast';
import { X, Save, Upload } from 'lucide-react';
import SearchableInput from '../../components/SearchableInput';

interface EditDocumentProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string | null;
}

const EditDocument: React.FC<EditDocumentProps> = ({ isOpen, onClose, documentId }) => {
  const { documents, updateDocument, masterData, addMasterData } = useDataStore();
  
  const [formData, setFormData] = useState<Partial<DocumentItem>>({});
  const [fileName, setFileName] = useState('');

  // Options
  const docTypeOptions = useMemo(() => Array.from(new Set(masterData?.map(m => m.documentType) || [])), [masterData]);
  const categoryOptions = ['Personal', 'Company', 'Director'];

  useEffect(() => {
      if (isOpen && documentId) {
          const doc = documents.find(d => d.id === documentId);
          if (doc) {
              setFormData({ ...doc });
              setFileName(doc.file || '');
          }
      }
  }, [isOpen, documentId, documents]);

  if (!isOpen || !documentId) return null;

  const handleChange = (field: keyof DocumentItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setFileName(file.name);
          const reader = new FileReader();
          reader.onloadend = () => {
              handleChange('file', file.name); 
              handleChange('fileContent', reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const getNameLabel = (category?: string) => {
    const c = category?.toLowerCase() || '';
    if (c.includes('personal')) return 'Person Name';
    if (c.includes('director')) return 'Director Name';
    if (c.includes('company')) return 'Company Name';
    return 'Name';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.documentType || !formData.category || !formData.documentName) {
        toast.error("Please fill all required fields.");
        return;
    }

    if (formData.needsRenewal && !formData.renewalDate) {
        toast.error("Please select a renewal date.");
        return;
    }

    // Check for new Master Data
    const exists = masterData?.some(m => 
        m.companyName.toLowerCase() === formData.companyName?.toLowerCase() &&
        m.documentType.toLowerCase() === formData.documentType?.toLowerCase() &&
        m.category.toLowerCase() === formData.category?.toLowerCase()
    );

    if (!exists && formData.companyName && formData.documentType && formData.category) {
        const newMaster: MasterItem = {
            id: Math.random().toString(36).substr(2, 9),
            companyName: formData.companyName,
            documentType: formData.documentType,
            category: formData.category
        };
        addMasterData(newMaster);
    }

    updateDocument(documentId, formData);
    toast.success("Document updated successfully");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl my-4">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div>
                <h2 className="text-lg font-bold text-gray-800">Edit Document</h2>
                {formData.sn && <p className="text-xs text-gray-500 font-mono">{formData.sn}</p>}
            </div>
            <button 
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        <div className="p-4 max-h-[75vh] overflow-y-auto bg-gray-50/30">
            <form id="edit-doc-form" onSubmit={handleSubmit} className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        
                        {/* 1. Document Name (Input) */}
                        <div>
                             <label className="block text-xs font-semibold text-gray-600 mb-1">Document Name <span className="text-red-500">*</span></label>
                             <input
                                 type="text"
                                 required
                                 className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none font-medium bg-gray-50/50 focus:bg-white transition-colors"
                                 value={formData.documentName || ''}
                                 onChange={e => handleChange('documentName', e.target.value)}
                             />
                        </div>

                        {/* 2. Document Type (Searchable) */}
                        <div>
                             <SearchableInput compact
                                 label="Document Type"
                                 value={formData.documentType || ''}
                                 onChange={val => handleChange('documentType', val)}
                                 options={docTypeOptions}
                                 placeholder="Select Type..."
                                 required
                             />
                        </div>

                        {/* 3. Category (Searchable) */}
                        <div>
                             <SearchableInput compact
                                 label="Category"
                                 value={formData.category || ''}
                                 onChange={val => handleChange('category', val)}
                                 options={categoryOptions}
                                 placeholder="Select Category..."
                                 required
                             />
                        </div>

                        {/* 4. Name (Input with Dynamic Label) */}
                        <div>
                             <label className="block text-xs font-semibold text-gray-600 mb-1">{getNameLabel(formData.category)} <span className="text-red-500">*</span></label>
                             <input
                                 type="text"
                                 required
                                 className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none font-medium bg-gray-50/50 focus:bg-white transition-colors"
                                 value={formData.companyName || ''}
                                 onChange={e => handleChange('companyName', e.target.value)}
                                 placeholder={`Enter ${getNameLabel(formData.category)}...`}
                             />
                        </div>

                         {/* 5. Needs Renewal & Date */}
                         <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                             <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input 
                                    type="checkbox"
                                    className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    checked={formData.needsRenewal || false}
                                    onChange={e => handleChange('needsRenewal', e.target.checked)}
                                />
                                <span className="text-xs font-medium text-gray-700">Need Renewal</span>
                            </label>
                            {formData.needsRenewal && (
                                <div className="flex-1">
                                    <input
                                        type="date"
                                        className="w-full p-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                                        value={formData.renewalDate || ''}
                                        onChange={e => handleChange('renewalDate', e.target.value)}
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
                                     id="edit-file-upload"
                                     className="hidden"
                                     onChange={handleFileChange}
                                 />
                                 <label 
                                     htmlFor="edit-file-upload"
                                     className="flex items-center justify-center gap-2 w-full p-2 border border-dashed border-gray-300 rounded-lg text-gray-600 cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all bg-white"
                                 >
                                     <Upload size={14} />
                                     <span className="text-xs font-medium truncate max-w-[180px]">{fileName || "Change File"}</span>
                                 </label>
                             </div>
                        </div>

                    </div>
                </div>
            </form>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-3 rounded-lg border border-gray-200 text-gray-700 text-sm font-bold hover:bg-white hover:border-gray-300 transition-all shadow-sm"
            >
                Cancel
            </button>
            <button
                type="submit"
                form="edit-doc-form"
                className="flex-[2] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
                <Save size={16} />
                Save
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditDocument;
