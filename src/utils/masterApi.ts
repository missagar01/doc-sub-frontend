// Master API Service - connects frontend to backend master endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';

// Master record type
export interface MasterRecord {
    id: number;
    company_name: string;
    document_type: string;
    category: string;
    renewal_filter: boolean;
}

// Frontend master item type
export interface MasterItem {
    id: number;
    companyName: string;
    documentType: string;
    category: string;
    renewalFilter: boolean;
}

// Get all master records
export async function fetchAllMasterData(): Promise<MasterRecord[]> {
    const res = await fetch(`${API_BASE_URL}/master`);

    if (!res.ok) {
        throw new Error('Failed to fetch master data');
    }

    const data = await res.json();
    return data.data;
}

// Get company names for dropdown
export async function fetchCompanyNames(): Promise<string[]> {
    const res = await fetch(`${API_BASE_URL}/master/company-names`);

    if (!res.ok) {
        throw new Error('Failed to fetch company names');
    }

    const data = await res.json();
    return data.companyName;
}

// Get document types for dropdown
export async function fetchDocumentTypes(): Promise<string[]> {
    const res = await fetch(`${API_BASE_URL}/master/document-types`);

    if (!res.ok) {
        throw new Error('Failed to fetch document types');
    }

    const data = await res.json();
    return data.documentTypes;
}

// Get categories for dropdown
export async function fetchCategories(): Promise<string[]> {
    const res = await fetch(`${API_BASE_URL}/master/categories`);

    if (!res.ok) {
        throw new Error('Failed to fetch categories');
    }

    const data = await res.json();
    return data.categories;
}

// Create master record
export async function createMasterRecord(data: {
    company_name: string;
    document_type: string;
    category: string;
    renewal_filter?: boolean;
}): Promise<MasterRecord> {
    const res = await fetch(`${API_BASE_URL}/master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || 'Failed to create master record');
    }

    const result = await res.json();
    return result.data;
}

// Update master record
export async function updateMasterRecord(id: number, data: Partial<{
    company_name: string;
    document_type: string;
    category: string;
    renewal_filter: boolean;
}>): Promise<MasterRecord> {
    const res = await fetch(`${API_BASE_URL}/master/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        throw new Error('Failed to update master record');
    }

    const result = await res.json();
    return result.data;
}

// Delete master record
export async function deleteMasterRecord(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/master/${id}`, {
        method: 'DELETE'
    });

    if (!res.ok) {
        throw new Error('Failed to delete master record');
    }
}

// Utility: Map backend to frontend format
export function mapToFrontend(record: MasterRecord): MasterItem {
    return {
        id: record.id,
        companyName: record.company_name,
        documentType: record.document_type,
        category: record.category,
        renewalFilter: record.renewal_filter
    };
}
