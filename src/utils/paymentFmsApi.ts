const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface PaymentFmsRequest {
    id?: string;
    uniqueNo?: string;
    unique_no?: string;
    fmsName?: string;
    fms_name?: string;
    payTo?: string;
    pay_to?: string;
    amount: number;
    remarks?: string;
    attachment?: string;
    status?: string;
    stageRemarks?: string;
    stage_remarks?: string;
    planned1?: string;
    actual1?: string;
    planned2?: string;
    actual2?: string;
    planned3?: string;
    actual3?: string;
    paymentType?: string;
    payment_type?: string;
    createdAt?: string;
    created_at?: string;
}

// Helper to transform API response to frontend format
export const transformPaymentFms = (item: PaymentFmsRequest) => ({
    id: item.id || '',
    status: item.status || 'Pending',
    uniqueNo: item.uniqueNo || item.unique_no || '',
    fmsName: item.fmsName || item.fms_name || '',
    payTo: item.payTo || item.pay_to || '',
    amount: Number(item.amount) || 0,
    remarks: item.remarks || '',
    stageRemarks: item.stageRemarks || item.stage_remarks || '',
    attachment: item.attachment || '',
    paymentType: item.paymentType || item.payment_type || '',
    planned1: item.planned1 || '',
    actual1: item.actual1 || '',
    planned2: item.planned2 || '',
    actual2: item.actual2 || '',
    planned3: item.planned3 || '',
    actual3: item.actual3 || '',
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
});

// ==================== GENERAL ====================
// Create a new payment FMS request
export const createPaymentFms = async (data: Omit<PaymentFmsRequest, 'id' | 'createdAt'>): Promise<PaymentFmsRequest> => {
    const res = await fetch(`${API_BASE_URL}/payment-fms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to create payment request');
    return result.data;
};

// Get all payment FMS records
export const getAllPaymentFms = async (): Promise<PaymentFmsRequest[]> => {
    const res = await fetch(`${API_BASE_URL}/payment-fms/all`);
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to fetch payment requests');
    return result.data;
};

// Delete payment FMS record
export const deletePaymentFms = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/payment-fms/${id}`, {
        method: 'DELETE',
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to delete payment request');
};

// ==================== STAGE 1: APPROVAL ====================
export const getApprovalPending = async (): Promise<PaymentFmsRequest[]> => {
    const res = await fetch(`${API_BASE_URL}/payment-fms/approval/pending`);
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to fetch approval pending');
    return result.data;
};

export const getApprovalHistory = async (): Promise<PaymentFmsRequest[]> => {
    const res = await fetch(`${API_BASE_URL}/payment-fms/approval/history`);
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to fetch approval history');
    return result.data;
};

export const processApproval = async (id: string, status: string, stageRemarks?: string): Promise<PaymentFmsRequest> => {
    const res = await fetch(`${API_BASE_URL}/payment-fms/approval/${id}/process`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, stageRemarks }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to process approval');
    return result.data;
};

// ==================== STAGE 2: MAKE PAYMENT ====================
export const getMakePaymentPending = async (): Promise<PaymentFmsRequest[]> => {
    const res = await fetch(`${API_BASE_URL}/payment-fms/make-payment/pending`);
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to fetch make payment pending');
    return result.data;
};

export const getMakePaymentHistory = async (): Promise<PaymentFmsRequest[]> => {
    const res = await fetch(`${API_BASE_URL}/payment-fms/make-payment/history`);
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to fetch make payment history');
    return result.data;
};

export const processMakePayment = async (id: string, paymentType: string): Promise<PaymentFmsRequest> => {
    const res = await fetch(`${API_BASE_URL}/payment-fms/make-payment/${id}/process`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentType }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to process payment');
    return result.data;
};

// ==================== STAGE 3: TALLY ENTRY ====================
export const getTallyEntryPending = async (): Promise<PaymentFmsRequest[]> => {
    const res = await fetch(`${API_BASE_URL}/payment-fms/tally-entry/pending`);
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to fetch tally entry pending');
    return result.data;
};

export const getTallyEntryHistory = async (): Promise<PaymentFmsRequest[]> => {
    const res = await fetch(`${API_BASE_URL}/payment-fms/tally-entry/history`);
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to fetch tally entry history');
    return result.data;
};

export const processTallyEntry = async (ids: string[]): Promise<PaymentFmsRequest[]> => {
    const res = await fetch(`${API_BASE_URL}/payment-fms/tally-entry/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to process tally entries');
    return result.data;
};
