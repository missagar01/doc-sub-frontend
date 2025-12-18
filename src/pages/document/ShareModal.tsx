import React, { useState, useEffect } from 'react';
import { X, Mail, Send, Share2 } from 'lucide-react';
import useDataStore from '../../store/dataStore';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'email' | 'whatsapp' | 'both' | null;
    documentId: string | null;
    documentName: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, type, documentId, documentName }) => {
    const [recipientName, setRecipientName] = useState('');
    const [email, setEmail] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const { addShareHistory, shareHistory, documents } = useDataStore();

    useEffect(() => {
        if (isOpen) {
            // Reset fields or prepopulate default subject
            setSubject(`Sharing Document: ${documentName}`);
            setMessage(`Please find attached the document: ${documentName}`);
        }
    }, [isOpen, documentName]);

    if (!isOpen || !type) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Find document details
        const doc = documents.find(d => d.id === documentId);
        const nextId = shareHistory.length + 1;
        
        const newShare: any = {
            id: `share-${Date.now()}`,
            shareNo: `SH-${String(nextId).padStart(3, '0')}`,
            dateTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
            docSerial: doc ? doc.sn : 'SN-???',
            docName: documentName,
            docFile: doc ? doc.file || 'document.pdf' : 'document.pdf',
            sharedVia: type === 'both' ? 'Email' : (type === 'whatsapp' ? 'WhatsApp' : 'Email'),
            recipientName: recipientName || 'Multiple',
            contactInfo: type === 'email' ? email : (type === 'whatsapp' ? whatsapp : `${email}, ${whatsapp}`)
        };

        if (type === 'both') {
            // Add two records if sharing both ways, or just one generic one? 
            // Let's add two separate records for better tracking as per typical requirement, or one combined.
            // The user didn't specify, but "Shared Via" is usually singular enum in the table.
            // Let's split it into two records if "Both".
            
            // 1. Email
            addShareHistory({
                ...newShare,
                id: `share-${Date.now()}-1`,
                sharedVia: 'Email',
                contactInfo: email,
                shareNo: `SH-${String(nextId).padStart(3, '0')}`
            });

             // 2. WhatsApp
             addShareHistory({
                ...newShare,
                id: `share-${Date.now()}-2`,
                sharedVia: 'WhatsApp',
                contactInfo: whatsapp,
                shareNo: `SH-${String(nextId + 1).padStart(3, '0')}`
            });
            
        } else {
             addShareHistory(newShare);
        }

        alert(`Document shared via ${type} successfully!`);
        onClose();
    };

    const isEmail = type === 'email' || type === 'both';
    const isWhatsapp = type === 'whatsapp' || type === 'both';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        {type === 'email' && <Mail className="text-blue-600" size={20} />}
                        {type === 'whatsapp' && <Send className="text-green-600" size={20} />}
                        {type === 'both' && <Share2 className="text-purple-600" size={20} />}
                        <h2 className="text-lg font-semibold text-gray-800">
                            {type === 'email' ? 'Share via Email' : type === 'whatsapp' ? 'Share via WhatsApp' : 'Share Options'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Document Selection (Read Only) */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Document</label>
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700 font-medium flex items-center gap-2">
                             <span>📄</span>
                             {documentName} 
                        </div>
                    </div>

                    {isEmail && (
                        <>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient Name</label>
                                <input
                                    type="text"
                                    required
                                    value={recipientName}
                                    onChange={(e) => setRecipientName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Enter recipient name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </>
                    )}

                    {isWhatsapp && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp Number</label>
                             <div className="flex">
                                <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 bg-gray-50 rounded-l-lg text-gray-500 text-sm">
                                    +91
                                </span>
                                <input
                                    type="tel"
                                    required
                                    value={whatsapp}
                                    onChange={(e) => setWhatsapp(e.target.value)}
                                    className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-r-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    placeholder="98765 43210"
                                />
                            </div>
                        </div>
                    )}

                    {(type === 'both' || type === 'email') && (
                         <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                                <input
                                    type="text"
                                    required={type === 'email' || type === 'both'}
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                    placeholder="Enter email subject"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                                <textarea
                                    rows={3}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
                                    placeholder="Add a message..."
                                />
                            </div>
                         </>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl
                                ${type === 'email' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : ''}
                                ${type === 'whatsapp' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : ''}
                                ${type === 'both' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : ''}
                            `}
                        >
                            Share 
                            {type === 'email' && ' via Email'}
                            {type === 'whatsapp' && ' via WhatsApp'}
                            {type === 'both' && ' Options'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShareModal;
