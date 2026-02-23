// Subscription API Service Layer
// Connects frontend to backend subscription APIs

import { authFetch, API_BASE_URL } from './apiClient';

// ==================== SUBSCRIPTION APIs ====================

export interface SubscriptionPayload {
    timestamp: string;
    subscriptionNo: string;
    companyName: string;
    subscriberName: string;
    subscriptionName: string;
    price: string;
    frequency: string;
    purpose: string;
}

export interface SubscriptionResponse {
    id: number;
    subscription_no: string;
    company_name: string;
    subscriber_name: string;
    subscription_name: string;
    price: string;
    frequency: string;
    purpose: string;
    start_date: string | null;
    end_date: string | null;
    timestamp: string;
    planned_1: string | null;
    planned_2: string | null;
    planned_3: string | null;
    actual_1: string | null;
    actual_2: string | null;
    actual_3: string | null;
}

// Generate next subscription number
export async function generateSubscriptionNo(): Promise<string> {
    const res = await authFetch(`${API_BASE_URL}/subscription/generate-number`);
    if (!res.ok) throw new Error('Failed to generate subscription number');
    const data = await res.json();
    return data.subscriptionNo;
}

// Create new subscription
export async function createSubscription(payload: SubscriptionPayload): Promise<any> {
    const res = await authFetch(`${API_BASE_URL}/subscription/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create subscription');
    return res.json();
}

// Fetch all subscriptions
export async function fetchAllSubscriptions(): Promise<SubscriptionResponse[]> {
    const res = await authFetch(`${API_BASE_URL}/subscription/all`);
    if (!res.ok) throw new Error('Failed to fetch subscriptions');
    return res.json();
}

// Update subscription
export async function updateSubscription(id: string | number, payload: Partial<SubscriptionPayload>): Promise<any> {
    const res = await authFetch(`${API_BASE_URL}/subscription/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            // Transform frontend keys to backend columns expected by update API
            company_name: payload.companyName,
            subscriber_name: payload.subscriberName,
            subscription_name: payload.subscriptionName,
            price: payload.price,
            frequency: payload.frequency,
            purpose: payload.purpose,
            start_date: (payload as any).startDate, // in case it's passed
            end_date: (payload as any).endDate,     // in case it's passed
            timestamp: (payload as any).timestamp     // handling requested date updates
        })
    });
    if (!res.ok) throw new Error('Failed to update subscription');
    return res.json();
}

// ==================== APPROVAL APIs ====================

export interface ApprovalItem {
    id: number;
    subscription_no: string;
    company_name: string;
    subscriber_name: string;
    subscription_name: string;
    price: string;
    frequency: string;
    purpose: string;
    timestamp: string;
}

export interface ApprovalHistoryItem {
    id: number;
    subscription_no: string;
    approval: string;
    note: string;
    approved_by: string;
    requested_on: string;
}

export interface ApprovalPayload {
    subscriptionNo: string;
    approval: 'Approved' | 'Rejected';
    note: string;
    approvedBy: string;
    requestedOn: string;
    companyName?: string;
    subscriberName?: string;
    subscriptionName?: string;
    price?: string;
    frequency?: string;
    purpose?: string;
}

export async function fetchPendingApprovals(): Promise<ApprovalItem[]> {
    const res = await authFetch(`${API_BASE_URL}/subscription-approval/pending`);
    if (!res.ok) throw new Error('Failed to fetch pending approvals');
    return res.json();
}

export async function fetchApprovalHistory(): Promise<ApprovalHistoryItem[]> {
    const res = await authFetch(`${API_BASE_URL}/subscription-approval/history`);
    if (!res.ok) throw new Error('Failed to fetch approval history');
    return res.json();
}

export async function submitApproval(payload: ApprovalPayload): Promise<any> {
    const res = await authFetch(`${API_BASE_URL}/subscription-approval/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit approval');
    return res.json();
}

// ==================== PAYMENT APIs ====================

export interface PendingPaymentItem {
    id: number;
    subscription_no: string;
    company_name: string;
    subscriber_name: string;
    subscription_name: string;
    price: string;
    frequency: string;
    purpose: string;
    planned_3: string;
    planned_1: string | null;
}

export interface PaymentHistoryItem {
    id: number;
    subscription_no: string;
    payment_mode: string;
    transaction_id: string;
    start_date: string;
    insurance_document: string | null;
    created_at: string;
}

export interface PaymentPayload {
    subscriptionNo: string;
    paymentMethod: string;
    transactionId: string;
    price: string;
    startDate: string;
    endDate: string;
    insuranceDocument?: string;
    reason?: string;
    planned_1?: string;
    companyName?: string;
    subscriberName?: string;
    subscriptionName?: string;
    frequency?: string;
    purpose?: string;
}

export async function fetchPendingPayments(): Promise<PendingPaymentItem[]> {
    const res = await authFetch(`${API_BASE_URL}/subscription-payment/pending`);
    if (!res.ok) throw new Error('Failed to fetch pending payments');
    return res.json();
}

export async function fetchPaymentHistory(): Promise<PaymentHistoryItem[]> {
    const res = await authFetch(`${API_BASE_URL}/subscription-payment/history`);
    if (!res.ok) throw new Error('Failed to fetch payment history');
    return res.json();
}

export async function submitPayment(payload: PaymentPayload): Promise<any> {
    const res = await authFetch(`${API_BASE_URL}/subscription-payment/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit payment');
    return res.json();
}

// ==================== RENEWAL APIs ====================

export interface PendingRenewalItem {
    id: number;
    subscription_no: string;
    company_name: string;
    subscriber_name: string;
    subscription_name: string;
    price: string;
    frequency: string;
    end_date: string;
    planned_1: string | null;
    reason_for_renewal: string | null;
}

export interface RenewalHistoryItem {
    id: number;
    renewal_no: string;
    subscription_no: string;
    renewal_status: string;
    approved_by: string;
    price: string;
    created_at: string;
}

export interface RenewalPayload {
    subscription_no: string;
    renewal_status: 'Approved' | 'Rejected';
    approved_by: string;
    price: string;
    company_name?: string;
    subscriber_name?: string;
    subscription_name?: string;
    frequency?: string;
    end_date?: string;
}

export async function fetchPendingRenewals(): Promise<PendingRenewalItem[]> {
    const res = await authFetch(`${API_BASE_URL}/subscription-renewal/pending`);
    if (!res.ok) throw new Error('Failed to fetch pending renewals');
    return res.json();
}

export async function fetchRenewalHistory(): Promise<RenewalHistoryItem[]> {
    const res = await authFetch(`${API_BASE_URL}/subscription-renewal/history`);
    if (!res.ok) throw new Error('Failed to fetch renewal history');
    return res.json();
}

export async function submitRenewal(payload: RenewalPayload): Promise<any> {
    const res = await authFetch(`${API_BASE_URL}/subscription-renewal/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit renewal');
    return res.json();
}
