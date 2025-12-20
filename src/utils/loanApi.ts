// Loan API Service - connects frontend to backend loan endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';

// ==================== TYPES ====================

export interface Loan {
    id: number;
    loan_name: string;
    bank_name: string;
    amount: number;
    emi: number;
    loan_start_date: string;
    loan_end_date: string;
    provided_document_name?: string;
    upload_document?: string;
    remarks?: string;
    created_at: string;
}

export interface ForeclosureRequest {
    id: number;
    serial_no: string;
    loan_name: string;
    bank_name: string;
    amount: number;
    emi: number;
    loan_start_date: string;
    loan_end_date: string;
    request_date: string;
    requester_name: string;
    created_at: string;
}

export interface NOCRecord {
    id: number;
    serial_no: string;
    loan_name: string;
    bank_name: string;
    loan_start_date: string;
    loan_end_date: string;
    closure_request_date: string;
    collect_noc: boolean;
    created_at: string;
}

// ==================== ALL LOANS ====================

// Create new loan
export async function createLoan(loanData: {
    loan_name: string;
    bank_name: string;
    amount: number;
    emi: number;
    loan_start_date: string;
    loan_end_date: string;
    provided_document_name?: string;
    upload_document?: string;
    remarks?: string;
}): Promise<Loan> {
    const res = await fetch(`${API_BASE_URL}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanData)
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || 'Failed to create loan');
    }

    const data = await res.json();
    return data.loan;
}

// Get all loans
export async function fetchAllLoans(): Promise<Loan[]> {
    const res = await fetch(`${API_BASE_URL}/loans`);

    if (!res.ok) {
        throw new Error('Failed to fetch loans');
    }

    const data = await res.json();
    return data.loans;
}

// Get loans eligible for foreclosure (end date <= today)
export async function fetchForeclosureEligibleLoans(): Promise<Loan[]> {
    const res = await fetch(`${API_BASE_URL}/loans/foreclosure-eligible`);

    if (!res.ok) {
        throw new Error('Failed to fetch foreclosure eligible loans');
    }

    const data = await res.json();
    return data.loans;
}

// Get loan by ID
export async function fetchLoanById(id: number): Promise<Loan> {
    const res = await fetch(`${API_BASE_URL}/loans/${id}`);

    if (!res.ok) {
        throw new Error('Failed to fetch loan');
    }

    const data = await res.json();
    return data.loan;
}

// Update loan
export async function updateLoan(id: number, loanData: Partial<Loan>): Promise<Loan> {
    const res = await fetch(`${API_BASE_URL}/loans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanData)
    });

    if (!res.ok) {
        throw new Error('Failed to update loan');
    }

    const data = await res.json();
    return data.loan;
}

// Delete loan
export async function deleteLoan(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/loans/${id}`, {
        method: 'DELETE'
    });

    if (!res.ok) {
        throw new Error('Failed to delete loan');
    }
}

// ==================== FORECLOSURE REQUESTS ====================

// Create foreclosure request
export async function createForeclosureRequest(requestData: {
    serial_no: string;
    loan_name: string;
    bank_name: string;
    amount: number;
    emi: number;
    loan_start_date: string;
    loan_end_date: string;
    request_date?: string;
    requester_name: string;
}): Promise<ForeclosureRequest> {
    const res = await fetch(`${API_BASE_URL}/loans/foreclosure/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || 'Failed to create foreclosure request');
    }

    const data = await res.json();
    return data.request;
}

// Get foreclosure history
export async function fetchForeclosureHistory(): Promise<ForeclosureRequest[]> {
    const res = await fetch(`${API_BASE_URL}/loans/foreclosure/history`);

    if (!res.ok) {
        throw new Error('Failed to fetch foreclosure history');
    }

    const data = await res.json();
    return data.history;
}

// Get foreclosure requests pending NOC
export async function fetchForeclosuresPendingNOC(): Promise<ForeclosureRequest[]> {
    const res = await fetch(`${API_BASE_URL}/loans/foreclosure/pending-noc`);

    if (!res.ok) {
        throw new Error('Failed to fetch pending NOC requests');
    }

    const data = await res.json();
    return data.requests;
}

// ==================== COLLECT NOC ====================

// Create or update NOC
export async function createOrUpdateNOC(nocData: {
    serial_no: string;
    loan_name: string;
    bank_name: string;
    loan_start_date: string;
    loan_end_date: string;
    closure_request_date: string;
    collect_noc: boolean;
}): Promise<NOCRecord> {
    const res = await fetch(`${API_BASE_URL}/loans/noc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nocData)
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || 'Failed to process NOC');
    }

    const data = await res.json();
    return data.noc;
}

// Get pending NOC collections
export async function fetchPendingNOCCollections(): Promise<NOCRecord[]> {
    const res = await fetch(`${API_BASE_URL}/loans/noc/pending`);

    if (!res.ok) {
        throw new Error('Failed to fetch pending NOC collections');
    }

    const data = await res.json();
    return data.pending;
}

// Get NOC history
export async function fetchNOCHistory(): Promise<NOCRecord[]> {
    const res = await fetch(`${API_BASE_URL}/loans/noc/history`);

    if (!res.ok) {
        throw new Error('Failed to fetch NOC history');
    }

    const data = await res.json();
    return data.history;
}

// Get all NOC records
export async function fetchAllNOCRecords(): Promise<NOCRecord[]> {
    const res = await fetch(`${API_BASE_URL}/loans/noc/all`);

    if (!res.ok) {
        throw new Error('Failed to fetch NOC records');
    }

    const data = await res.json();
    return data.records;
}
