// Document API Service - connects frontend to backend document endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';

// Document response type from backend
export interface BackendDocument {
    document_id: number;
    document_name: string;
    document_type: string | null;
    category: string | null;
    company_department: string | null;
    tags: string | null;
    person_name: string | null;
    need_renewal: 'yes' | 'no';
    renewal_date: string | null;
    image: string | null;
    email: string | null;
    mobile: string | null;
    is_deleted: boolean;
    created_at: string;
}

// Frontend document format
export interface FrontendDocument {
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

// Create a new document
export async function createDocument(documentData: {
    document_name: string;
    document_type?: string;
    category?: string;
    company_department?: string;
    tags?: string;
    person_name?: string;
    need_renewal?: 'yes' | 'no';
    renewal_date?: string;
    image?: string;
    email?: string;
    mobile?: string;
}): Promise<BackendDocument> {
    const res = await fetch(`${API_BASE_URL}/documents/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentData)
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || 'Failed to create document');
    }

    const data = await res.json();
    return data.document;
}

// Create multiple documents
export async function createMultipleDocuments(documents: Array<{
    document_name: string;
    document_type?: string;
    category?: string;
    company_department?: string;
    tags?: string;
    person_name?: string;
    need_renewal?: 'yes' | 'no';
    renewal_date?: string;
    image?: string;
    email?: string;
    mobile?: string;
}>): Promise<BackendDocument[]> {
    const res = await fetch(`${API_BASE_URL}/documents/create-multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || 'Failed to create documents');
    }

    const data = await res.json();
    return data.documents;
}

// Get all documents
export async function fetchAllDocuments(): Promise<BackendDocument[]> {
    const res = await fetch(`${API_BASE_URL}/documents/`);

    if (!res.ok) {
        throw new Error('Failed to fetch documents');
    }

    const data = await res.json();
    return data.documents;
}

// Get document by ID
export async function fetchDocumentById(id: number): Promise<BackendDocument> {
    const res = await fetch(`${API_BASE_URL}/documents/${id}`);

    if (!res.ok) {
        throw new Error('Failed to fetch document');
    }

    const data = await res.json();
    return data.document;
}

// Update document
export async function updateDocument(id: number, documentData: Partial<{
    document_name: string;
    document_type: string;
    category: string;
    company_department: string;
    tags: string;
    person_name: string;
    need_renewal: 'yes' | 'no';
    renewal_date: string;
    image: string;
    email: string;
    mobile: string;
}>): Promise<BackendDocument> {
    const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentData)
    });

    if (!res.ok) {
        throw new Error('Failed to update document');
    }

    const data = await res.json();
    return data.document;
}

// Delete document (soft delete)
export async function deleteDocument(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'DELETE'
    });

    if (!res.ok) {
        throw new Error('Failed to delete document');
    }
}

// Get documents needing renewal
export async function fetchDocumentsNeedingRenewal(): Promise<BackendDocument[]> {
    const res = await fetch(`${API_BASE_URL}/documents/renewal`);

    if (!res.ok) {
        throw new Error('Failed to fetch renewal documents');
    }

    const data = await res.json();
    return data.documents;
}

// Get document stats
export async function fetchDocumentStats(): Promise<{
    total: number;
    personal: number;
    company: number;
    director: number;
    needs_renewal: number;
    recent: number;
}> {
    const res = await fetch(`${API_BASE_URL}/documents/stats`);

    if (!res.ok) {
        throw new Error('Failed to fetch document stats');
    }

    const data = await res.json();
    return data.stats;
}

// Utility: Convert backend document to frontend format
export function mapBackendToFrontend(doc: BackendDocument): FrontendDocument {
    return {
        id: String(doc.document_id),
        sn: `SN-${doc.document_id.toString().padStart(3, '0')}`,
        documentName: doc.document_name,
        companyName: doc.person_name || doc.company_department || '',
        documentType: doc.document_type || '',
        category: doc.category || '',
        needsRenewal: doc.need_renewal === 'yes',
        renewalDate: doc.renewal_date || undefined,
        file: doc.image ? getFileNameFromUrl(doc.image) : null,
        fileContent: doc.image || undefined, // S3 URL goes here for viewing
        date: doc.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        status: 'Active'
    };
}

// Helper: Extract filename from S3 URL
function getFileNameFromUrl(url: string): string {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1] || 'document';
}

