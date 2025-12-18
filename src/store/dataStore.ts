import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DocumentItem {
    id: string;
    sn: string; // Serial Number
    companyName: string;
    documentType: string;
    category: string;
    documentName: string;
    needsRenewal: boolean;
    renewalDate?: string; // Optional renewal date
    file: string | null; // File name
    fileContent?: string; // Base64 data for download
    date: string;
    status: string;
}

export interface SubscriptionItem {
    id: string;
    sn: string;
    requestedDate: string;
    companyName: string;
    subscriberName: string;
    subscriptionName: string;
    price: string;
    frequency: string;
    purpose: string;
    startDate: string; // Blank initially
    endDate: string; // Blank initially
    status: string; // Blank initially or Active
    // keeping legacy fields optional for compatibility if needed, or mapping them
    service?: string;
    plan?: string;
    renewalDate?: string;
    renewalStatus?: string; // For renewal workflow
    renewalNumber?: string; // RN-xxx
    approvalNo?: string;
    remarks?: string;
    approvalDate?: string;
    paymentDate?: string;
    paymentMethod?: string;
    paymentFile?: string;
    paymentFileContent?: string;
    file?: string | null; // Generic file
    fileContent?: string;
}

export interface LoanItem {
    id: string;
    sn: string; // SN-xxx
    loanName: string;
    bankName: string;
    amount: string;
    emi: string;
    startDate: string;
    endDate: string;
    providedDocument: string;
    remarks: string;
    file?: string | null;
    fileContent?: string;

    // Foreclosure
    foreclosureStatus?: 'Pending' | 'Approved' | 'Rejected'; // "Action" stage status
    requestDate?: string;
    requesterName?: string;

    // Collect All Document
    documentStatus?: 'Yes' | 'No';
    documentCollectionRemarks?: string;
    closerRequestDate?: string; // Appears in Collect Document table

    // Collect NOC
    collectNocStatus?: 'Yes' | 'No';

    // Final Settlement
    finalSettlementStatus?: 'Yes' | 'No';
    nextDate?: string;
    settlementDate?: string; // Date when settled
}

export interface MasterItem {
    id: string;
    companyName: string;
    documentType: string;
    category: string;
}

export interface RenewalItem {
    id: string;
    documentId: string;
    sn: string;
    documentName: string;
    documentType: string;
    category: string;
    companyName: string; // "Name"
    entryDate: string;
    oldRenewalDate: string; // "Renewal" column in history
    oldFile: string | null; // "Document File" column
    renewalStatus: 'Yes' | 'No'; // "Renewal Status"
    nextRenewalDate: string | null; // "Next Renewal Data"
    newFile: string | null; // "New Document file"
    newFileContent?: string;
    oldFileContent?: string;
}

export interface SubscriptionRenewalItem {
    id: string;
    renewalNo: string;
    subscriptionId: string;
    sn: string;
    companyName: string;
    subscriberName: string;
    subscriptionName: string;
    frequency: string;
    price: string;
    endDate: string;
    renewalStatus: string;
}

export interface ShareItem {
    id: string;
    shareNo: string;
    dateTime: string;
    docSerial: string;
    docName: string;
    docFile: string;
    sharedVia: 'Email' | 'WhatsApp';
    recipientName: string;
    contactInfo: string;
}


const DUMMY_SHARE_DATA: ShareItem[] = [
    {
        id: 'share-1',
        shareNo: 'SH-001',
        dateTime: '2024-10-10 10:30',
        docSerial: 'SN-001',
        docName: 'Project Proposal_v2.pdf',
        docFile: 'document.pdf',
        sharedVia: 'WhatsApp',
        recipientName: 'Rahul Sharma',
        contactInfo: '+91 98765 43210'
    },
    {
        id: 'share-2',
        shareNo: 'SH-002',
        dateTime: '2024-10-12 11:45',
        docSerial: 'SN-002',
        docName: 'Invoice_8822.pdf',
        docFile: 'document.pdf',
        sharedVia: 'Email',
        recipientName: 'Priya Patel',
        contactInfo: 'priya.patel@example.com'
    }
];

const DUMMY_SUBSCRIPTIONS: SubscriptionItem[] = [
    {
        id: 'sub-1',
        sn: 'SN-001',
        requestedDate: '10/01/2024',
        companyName: 'Reliance Jio Infocomm',
        subscriberName: 'Rahul Kumar',
        subscriptionName: 'JioFiber Postpaid',
        plan: 'Gold Plan',
        price: '₹999',
        frequency: 'Monthly',
        purpose: 'Office Internet',
        startDate: '',
        endDate: '',
        renewalDate: '',
        status: '',
        file: 'sub_doc.pdf'
    },
    {
        id: 'sub-2',
        sn: 'SN-002',
        requestedDate: '15/01/2024',
        companyName: 'Tata AIG General Insurance',
        subscriberName: 'Priya Sharma',
        subscriptionName: 'Health Insurance',
        plan: 'Family Floater',
        file: 'health_policy.pdf',
        price: '₹12,499',
        frequency: 'Yearly',
        purpose: 'Employee Benefit',
        startDate: '',
        endDate: '',
        renewalDate: '',
        status: ''
    },
    {
        id: 'sub-3',
        sn: 'SN-003',
        requestedDate: '20/01/2024',
        companyName: 'Zoho Corporation',
        subscriberName: 'Amit Patel',
        subscriptionName: 'Zoho One',
        plan: 'Professional',
        file: 'zoho_invoice.pdf',
        price: '₹1,500',
        frequency: 'Monthly',
        purpose: 'CRM & Accounting',
        startDate: '',
        endDate: '',
        renewalDate: '',
        status: ''
    },
    {
        id: 'sub-4',
        sn: 'SN-004',
        requestedDate: '22/01/2024',
        companyName: 'Bharti Airtel',
        subscriberName: 'Vikram Singh',
        subscriptionName: 'Airtel Xstream',
        plan: 'Fiber Basic',
        price: '₹799',
        frequency: 'Monthly',
        purpose: 'Home Internet',
        startDate: '',
        endDate: '',
        renewalDate: '',
        status: 'Approved',
        approvalNo: 'AP-014',
        approvalDate: '2024-02-01',
        paymentDate: '',
        remarks: 'Approved for home office',
        file: 'airtel_bill.pdf'
    },
    {
        id: 'sub-5',
        sn: 'SN-005',
        requestedDate: '25/01/2024',
        companyName: 'Disney+ Hotstar',
        subscriberName: 'Neha Gupta',
        subscriptionName: 'Hotstar Premium',
        plan: 'Super',
        price: '₹899',
        frequency: 'Yearly',
        purpose: 'Entertainment',
        startDate: '',
        endDate: '',
        renewalDate: '',
        status: 'Rejected',
        approvalNo: 'AP-015',
        approvalDate: '2024-02-05',
        paymentDate: '',
        remarks: 'Personal expense',
        file: 'hotstar.png'
    },
    {
        id: 'sub-6',
        sn: 'SN-006',
        requestedDate: '01/02/2024',
        companyName: 'Amazon',
        subscriberName: 'Rohan Das',
        subscriptionName: 'Amazon Prime',
        plan: 'Prime Lite',
        price: '₹999',
        frequency: 'Yearly',
        purpose: 'Shopping & Video',
        startDate: '',
        endDate: '',
        renewalDate: '',
        status: 'Approved',
        approvalNo: 'AP-016',
        approvalDate: '2024-02-10',
        paymentDate: '',
        remarks: 'Confirmed',
        file: 'amazon_prime.pdf'
    },
    {
        id: 'sub-7',
        sn: 'SN-007',
        requestedDate: '05/02/2024',
        companyName: 'Bennett, Coleman & Co.',
        subscriberName: 'Office Admin',
        subscriptionName: 'Times of India',
        plan: 'ePaper',
        price: '₹150',
        frequency: 'Monthly',
        purpose: 'News & Research',
        startDate: '',
        endDate: '',
        renewalDate: '',
        status: 'Approved',
        approvalNo: 'AP-017',
        approvalDate: '2024-02-12',
        paymentDate: '',
        remarks: 'Daily news',
        file: 'times_sub.pdf'
    },
    {
        id: 'sub-8',
        sn: 'SN-008',
        requestedDate: '10/02/2024',
        companyName: 'Swiggy',
        subscriberName: 'Staff Welfare',
        subscriptionName: 'Swiggy One',
        plan: 'Quarterly',
        price: '₹300',
        frequency: 'Quarterly',
        purpose: 'Food Delivery',
        startDate: '',
        endDate: '',
        renewalDate: '',
        status: 'Rejected',
        approvalNo: 'AP-018',
        approvalDate: '2024-02-15',
        paymentDate: '',
        remarks: 'Not approved',
        file: 'swiggy_receipt.pdf'
    },
    {
        id: 'sub-9',
        sn: 'SN-009',
        requestedDate: '12/02/2024',
        companyName: 'Zomato',
        subscriberName: 'Marketing Team',
        subscriptionName: 'Zomato Gold',
        plan: 'Half-Yearly',
        price: '₹750',
        frequency: '6 Months',
        purpose: 'Client Meetings',
        startDate: '2024-02-21',
        endDate: '2024-08-21',
        renewalDate: '',
        status: 'Paid',
        approvalNo: 'AP-019',
        approvalDate: '2024-02-20',
        paymentDate: '2024-02-21',
        paymentMethod: 'Credit Card',
        remarks: 'Marketing expense',
        file: 'zomato_gold.pdf'
    },
    {
        id: 'sub-10',
        sn: 'SN-010',
        requestedDate: '15/02/2024',
        companyName: 'Cure.fit',
        subscriberName: 'HR Dept',
        subscriptionName: 'Cult.pro',
        plan: 'ElitePass',
        price: '₹15,000',
        frequency: 'Yearly',
        purpose: 'Employee Wellness',
        startDate: '2024-02-26',
        endDate: '2025-02-25',
        renewalDate: '',
        status: 'Paid',
        approvalNo: 'AP-020',
        approvalDate: '2024-02-25',
        paymentDate: '2024-02-26',
        paymentMethod: 'Bank Transfer',
        remarks: 'Wellness program',
        file: 'cult_fit.pdf'
    },
    {
        id: 'sub-11',
        sn: 'SN-011',
        requestedDate: '18/02/2024',
        companyName: 'Microsoft Corporation',
        subscriberName: 'IT Dept',
        subscriptionName: 'Microsoft 365',
        plan: 'Business Standard',
        price: '₹4,800',
        frequency: 'Yearly',
        purpose: 'Productivity Suite',
        startDate: '2024-03-01',
        endDate: '2025-02-28',
        renewalDate: '',
        status: 'Paid',
        approvalNo: 'AP-021',
        approvalDate: '2024-02-28',
        paymentDate: '2024-03-01',
        paymentMethod: 'Credit Card',
        remarks: 'Core software',
        file: 'ms_licenses.pdf'
    },
    {
        id: 'sub-12',
        sn: 'SN-012',
        requestedDate: '20/02/2024',
        companyName: 'Adobe Inc.',
        subscriberName: 'Design Team',
        subscriptionName: 'Creative Cloud',
        plan: 'All Apps',
        price: '₹4,200',
        frequency: 'Monthly',
        purpose: 'Graphic Design',
        startDate: '2024-03-02',
        endDate: '2026-04-01',
        renewalDate: '',
        status: 'Paid',
        approvalNo: 'AP-022',
        approvalDate: '2024-03-01',
        paymentDate: '2024-03-02',
        paymentMethod: 'Credit Card',
        remarks: 'Design tools'
    },
    {
        id: 'sub-13',
        sn: 'SN-013',
        requestedDate: '25/02/2024',
        companyName: 'LIC India',
        subscriberName: 'Finance Head',
        subscriptionName: 'Jeevan Anand',
        plan: 'Life Insurance',
        price: '₹25,000',
        frequency: 'Yearly',
        purpose: 'Keyman Insurance',
        startDate: '2024-03-06',
        endDate: '2026-03-05',
        renewalDate: '',
        status: 'Paid',
        approvalNo: 'AP-023',
        approvalDate: '2024-03-05',
        paymentDate: '2024-03-06',
        paymentMethod: 'Bank Transfer',
        remarks: 'Insurance'
    },
    {
        id: 'sub-hist-1',
        sn: 'SN-014',
        requestedDate: '01/03/2024',
        companyName: 'Slack Technologies',
        subscriberName: 'Dev Team',
        subscriptionName: 'Slack Pro',
        plan: 'Business',
        price: '₹600',
        frequency: 'Monthly',
        purpose: 'Communication',
        startDate: '2024-03-03',
        endDate: '2024-04-02',
        renewalDate: '',
        status: 'Paid',
        approvalNo: 'AP-001',
        approvalDate: '2024-03-02',
        paymentDate: '2024-03-03',
        paymentMethod: 'Credit Card',
        remarks: 'Essential for team comms'
    },
    {
        id: 'sub-hist-2',
        sn: 'SN-015',
        requestedDate: '02/03/2024',
        companyName: 'Atlassian',
        subscriberName: 'Project Managers',
        subscriptionName: 'Jira Software',
        plan: 'Standard',
        price: '₹800',
        frequency: 'Monthly',
        purpose: 'Project Tracking',
        startDate: '2024-03-04',
        endDate: '2024-04-03',
        renewalDate: '',
        status: 'Paid',
        approvalNo: 'AP-002',
        approvalDate: '2024-03-03',
        paymentDate: '2024-03-04',
        paymentMethod: 'Credit Card',
        remarks: 'Approved for Q1'
    },
    {
        id: 'sub-hist-3',
        sn: 'SN-016',
        requestedDate: '03/03/2024',
        companyName: 'Canva',
        subscriberName: 'Design Team',
        subscriptionName: 'Canva Pro',
        plan: 'Team',
        price: '₹3,000',
        frequency: 'Yearly',
        purpose: 'Marketing Assets',
        startDate: '',
        endDate: '',
        renewalDate: '',
        status: 'Rejected',
        approvalNo: 'AP-003',
        approvalDate: '2024-03-04',
        remarks: 'Use free version for now'
    },
    {
        id: 'sub-hist-4',
        sn: 'SN-017',
        requestedDate: '05/03/2024',
        companyName: 'GitHub',
        subscriberName: 'Engineering',
        subscriptionName: 'GitHub Copilot',
        plan: 'Business',
        price: '₹1,500',
        frequency: 'Monthly',
        purpose: 'Coding Assistant',
        startDate: '2024-03-07',
        endDate: '2024-04-06',
        renewalDate: '',
        status: 'Paid',
        approvalNo: 'AP-004',
        approvalDate: '2024-03-06',
        paymentDate: '2024-03-07',
        paymentMethod: 'UPI',
        remarks: 'Productivity boost'
    },
    {
        id: 'sub-hist-5',
        sn: 'SN-018',
        requestedDate: '08/03/2024',
        companyName: 'Zoom Video',
        subscriberName: 'Sales Team',
        subscriptionName: 'Zoom Pro',
        plan: 'Pro',
        price: '₹1,300',
        frequency: 'Monthly',
        purpose: 'Client Calls',
        startDate: '2024-03-10',
        endDate: '2024-04-09',
        renewalDate: '',
        status: 'Paid',
        approvalNo: 'AP-005',
        approvalDate: '2024-03-09',
        paymentDate: '2024-03-10',
        paymentMethod: 'Credit Card',
        remarks: 'Approved'
    },
    {
        id: 'sub-hist-6',
        sn: 'SN-019',
        requestedDate: '10/03/2024',
        companyName: 'Figma',
        subscriberName: 'UI/UX Team',
        subscriptionName: 'Figma Professional',
        plan: 'Org',
        price: '₹3,500',
        frequency: 'Yearly',
        purpose: 'Design Tool',
        startDate: '2024-03-12',
        endDate: '2025-03-11',
        renewalDate: '',
        status: 'Paid',
        approvalNo: 'AP-006',
        approvalDate: '2024-03-11',
        paymentDate: '2024-03-12',
        paymentMethod: 'Bank Transfer',
        remarks: 'Standard design tool'
    },
    {
        id: 'sub-hist-7',
        sn: 'SN-020',
        requestedDate: '12/03/2024',
        companyName: 'Spotify',
        subscriberName: 'Office Admin',
        subscriptionName: 'Spotify Premium',
        plan: 'Family',
        price: '₹199',
        frequency: 'Monthly',
        purpose: 'Office Ambience',
        startDate: '',
        endDate: '',
        renewalDate: '',
        status: 'Rejected',
        approvalNo: 'AP-007',
        approvalDate: '2024-03-13',
        remarks: 'Not a business expense'
    },
    {
        id: 'sub-hist-8',
        sn: 'SN-021',
        requestedDate: '15/03/2024',
        companyName: 'Notion',
        subscriberName: 'Product Team',
        subscriptionName: 'Notion Team',
        plan: 'Team',
        price: '₹800',
        frequency: 'Monthly',
        purpose: 'Documentation',
        startDate: '2024-03-17',
        endDate: '2024-04-16',
        renewalDate: '',
        status: 'Paid',
        approvalNo: 'AP-008',
        approvalDate: '2024-03-16',
        paymentDate: '2024-03-17',
        paymentMethod: 'Credit Card',
        remarks: 'Knowledge base'
    },
    {
        id: 'sub-hist-9',
        sn: 'SN-022',
        requestedDate: '18/03/2024',
        companyName: 'Grammarly',
        subscriberName: 'Content Team',
        subscriptionName: 'Grammarly Business',
        plan: 'Business',
        price: '₹2,000',
        frequency: 'Monthly',
        purpose: 'Copy Editing',
        startDate: '2024-03-20',
        endDate: '2024-04-19',
        renewalDate: '',
        status: 'Paid',
        approvalNo: 'AP-009',
        approvalDate: '2024-03-19',
        paymentDate: '2024-03-20',
        paymentMethod: 'UPI',
        remarks: 'Approved'
    },
    {
        id: 'sub-hist-10',
        sn: 'SN-023',
        requestedDate: '20/03/2024',
        companyName: 'NordVPN',
        subscriberName: 'IT Security',
        subscriptionName: 'NordLayer',
        plan: 'Basic',
        price: '₹600',
        frequency: 'Monthly',
        purpose: 'Secure Access',
        startDate: '2024-03-22',
        endDate: '2024-04-21',
        renewalDate: '',
        status: 'Paid',
        approvalNo: 'AP-010',
        approvalDate: '2024-03-21',
        paymentDate: '2024-03-22',
        paymentMethod: 'Credit Card',
        remarks: 'Security requirement'
    }
];

interface DataState {
    documents: DocumentItem[];
    subscriptions: SubscriptionItem[];
    loans: LoanItem[];
    masterData: MasterItem[];
    renewalHistory: RenewalItem[];
    subscriptionRenewalHistory: SubscriptionRenewalItem[];
    shareHistory: ShareItem[];
    addDocument: (item: DocumentItem) => void;
    addDocuments: (items: DocumentItem[]) => void;
    addSubscription: (item: SubscriptionItem) => void;
    addLoan: (item: LoanItem) => void;
    addMasterData: (item: MasterItem) => void;
    addRenewalHistory: (item: RenewalItem) => void;
    addSubscriptionRenewalHistory: (item: SubscriptionRenewalItem) => void;
    addShareHistory: (item: ShareItem) => void;
    resetShareHistory: () => void;
    resetSubscriptions: () => void;
    updateDocument: (id: string, updatedItem: Partial<DocumentItem>) => void;
    updateSubscription: (id: string, updatedItem: Partial<SubscriptionItem>) => void;
    updateLoan: (id: string, updatedItem: Partial<LoanItem>) => void;
    deleteDocument: (id: string) => void;
}

const useDataStore = create<DataState>()(
    persist(
        (set) => ({
            documents: [
                {
                    id: 'doc-1',
                    sn: 'SN-001',
                    companyName: 'Acme Corp',
                    documentType: 'Contract',
                    category: 'Company',
                    documentName: 'Service Agreement 2024',
                    needsRenewal: true,
                    renewalDate: '2024-12-31',
                    file: 'service_agreement.pdf',
                    date: '2024-01-15',
                    status: 'Active'
                },
                {
                    id: 'doc-2',
                    sn: 'SN-002',
                    companyName: 'Globex Inc.',
                    documentType: 'Invoice',
                    category: 'Company',
                    documentName: 'Q4 Invoice',
                    needsRenewal: false,
                    file: 'inv_q4_2023.pdf',
                    date: '2024-02-10',
                    status: 'Active'
                },
                {
                    id: 'doc-3',
                    sn: 'SN-003',
                    companyName: 'Soylent Corp',
                    documentType: 'NDA',
                    category: 'Company',
                    documentName: 'Non-Disclosure Agreement',
                    needsRenewal: true,
                    renewalDate: '2025-06-30',
                    file: 'nda_soylent.pdf',
                    date: '2023-11-20',
                    status: 'Active'
                },
                {
                    id: 'doc-4',
                    sn: 'SN-004',
                    companyName: 'Umbrella Corp',
                    documentType: 'License',
                    category: 'Director',
                    documentName: 'Software License Key',
                    needsRenewal: true,
                    renewalDate: '2024-10-01',
                    file: 'license_key.txt',
                    date: '2023-09-01',
                    status: 'Active'
                },
                {
                    id: 'doc-5',
                    sn: 'SN-005',
                    companyName: 'Stark Industries',
                    documentType: 'Blueprint',
                    category: 'Personal',
                    documentName: 'Arc Reactor Schematics',
                    needsRenewal: false,
                    file: 'blueprint_v4.png',
                    date: '2024-03-01',
                    status: 'Active'
                },
                {
                    id: 'doc-6',
                    sn: 'SN-006',
                    companyName: 'Wayne Enterprises',
                    documentType: 'Policy',
                    category: 'Company',
                    documentName: 'Employee Handbook 2024',
                    needsRenewal: true,
                    renewalDate: '2025-01-01',
                    file: 'handbook.pdf',
                    date: '2024-01-01',
                    status: 'Active'
                }
            ],
            subscriptions: DUMMY_SUBSCRIPTIONS, /*
                {
                    id: 'sub-1',
                    sn: 'SN-001',
                    requestedDate: '10/01/2024',
                    companyName: 'Reliance Jio Infocomm',
                    subscriberName: 'Rahul Kumar',
                    subscriptionName: 'JioFiber Postpaid',
                    plan: 'Gold Plan',
                    price: '₹999',
                    frequency: 'Monthly',
                    purpose: 'Office Internet',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-2',
                    sn: 'SN-002',
                    requestedDate: '15/01/2024',
                    companyName: 'Tata AIG General Insurance',
                    subscriberName: 'Priya Sharma',
                    subscriptionName: 'Health Insurance',
                    plan: 'Family Floater',
                    price: '₹12,499',
                    frequency: 'Yearly',
                    purpose: 'Employee Benefit',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-3',
                    sn: 'SN-003',
                    requestedDate: '20/01/2024',
                    companyName: 'Zoho Corporation',
                    subscriberName: 'Amit Patel',
                    subscriptionName: 'Zoho One',
                    plan: 'Professional',
                    price: '₹1,500',
                    frequency: 'Monthly',
                    purpose: 'CRM & Accounting',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-4',
                    sn: 'SN-004',
                    requestedDate: '22/01/2024',
                    companyName: 'Bharti Airtel',
                    subscriberName: 'Vikram Singh',
                    subscriptionName: 'Airtel Xstream',
                    plan: 'Fiber Basic',
                    price: '₹799',
                    frequency: 'Monthly',
                    purpose: 'Home Internet',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-5',
                    sn: 'SN-005',
                    requestedDate: '25/01/2024',
                    companyName: 'Disney+ Hotstar',
                    subscriberName: 'Neha Gupta',
                    subscriptionName: 'Hotstar Premium',
                    plan: 'Super',
                    price: '₹899',
                    frequency: 'Yearly',
                    purpose: 'Entertainment',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-6',
                    sn: 'SN-006',
                    requestedDate: '01/02/2024',
                    companyName: 'Amazon',
                    subscriberName: 'Rohan Das',
                    subscriptionName: 'Amazon Prime',
                    plan: 'Prime Lite',
                    price: '₹999',
                    frequency: 'Yearly',
                    purpose: 'Shopping & Video',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-7',
                    sn: 'SN-007',
                    requestedDate: '05/02/2024',
                    companyName: 'Bennett, Coleman & Co.',
                    subscriberName: 'Office Admin',
                    subscriptionName: 'Times of India',
                    plan: 'ePaper',
                    price: '₹150',
                    frequency: 'Monthly',
                    purpose: 'News & Research',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-8',
                    sn: 'SN-008',
                    requestedDate: '10/02/2024',
                    companyName: 'Swiggy',
                    subscriberName: 'Staff Welfare',
                    subscriptionName: 'Swiggy One',
                    plan: 'Quarterly',
                    price: '₹300',
                    frequency: 'Quarterly',
                    purpose: 'Food Delivery',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-9',
                    sn: 'SN-009',
                    requestedDate: '12/02/2024',
                    companyName: 'Zomato',
                    subscriberName: 'Marketing Team',
                    subscriptionName: 'Zomato Gold',
                    plan: 'Half-Yearly',
                    price: '₹750',
                    frequency: '6 Months',
                    purpose: 'Client Meetings',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-10',
                    sn: 'SN-010',
                    requestedDate: '15/02/2024',
                    companyName: 'Cure.fit',
                    subscriberName: 'HR Dept',
                    subscriptionName: 'Cult.pro',
                    plan: 'ElitePass',
                    price: '₹15,000',
                    frequency: 'Yearly',
                    purpose: 'Employee Wellness',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-11',
                    sn: 'SN-011',
                    requestedDate: '18/02/2024',
                    companyName: 'Microsoft Corporation',
                    subscriberName: 'IT Dept',
                    subscriptionName: 'Microsoft 365',
                    plan: 'Business Standard',
                    price: '₹4,800',
                    frequency: 'Yearly',
                    purpose: 'Productivity Suite',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-12',
                    sn: 'SN-012',
                    requestedDate: '20/02/2024',
                    companyName: 'Adobe Inc.',
                    subscriberName: 'Design Team',
                    subscriptionName: 'Creative Cloud',
                    plan: 'All Apps',
                    price: '₹4,200',
                    frequency: 'Monthly',
                    purpose: 'Graphic Design',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-13',
                    sn: 'SN-013',
                    requestedDate: '25/02/2024',
                    companyName: 'LIC India',
                    subscriberName: 'Finance Head',
                    subscriptionName: 'Jeevan Anand',
                    plan: 'Life Insurance',
                    price: '₹25,000',
                    frequency: 'Yearly',
                    purpose: 'Keyman Insurance',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                }
            */
            loans: [
                // 1. Initial State (All Loans)
                {
                    id: '1',
                    sn: 'SN-001',
                    loanName: 'Home Loan',
                    bankName: 'HDFC Bank',
                    amount: '₹50,00,000',
                    emi: '₹45,000',
                    startDate: '2023-01-01',
                    endDate: '2043-01-01',
                    providedDocument: 'Property Deed',
                    remarks: 'Primary Residence',
                    file: 'home_loan_agreement.pdf'
                },
                {
                    id: '2',
                    sn: 'SN-002',
                    loanName: 'Car Loan',
                    bankName: 'SBI',
                    amount: '₹10,00,000',
                    emi: '₹15,000',
                    startDate: '2023-06-15',
                    endDate: '2028-06-15',
                    providedDocument: 'Car RC',
                    remarks: 'Company Car',
                    file: 'car_loan_docs.pdf'
                },
                {
                    id: '3',
                    sn: 'SN-003',
                    loanName: 'Personal Loan',
                    bankName: 'ICICI Bank',
                    amount: '₹5,00,000',
                    emi: '₹12,000',
                    startDate: '2024-01-01',
                    endDate: '2026-01-01',
                    providedDocument: 'Salary Slips',
                    remarks: 'Emergency Fund',
                    file: 'personal_loan.pdf'
                },
                {
                    id: '4',
                    sn: 'SN-004',
                    loanName: 'Education Loan',
                    bankName: 'Canara Bank',
                    amount: '₹20,00,000',
                    emi: '₹20,000',
                    startDate: '2022-08-01',
                    endDate: '2032-08-01',
                    providedDocument: 'Admission Letter',
                    remarks: 'Son\'s Education'
                },
                {
                    id: '5',
                    sn: 'SN-005',
                    loanName: 'Business Loan',
                    bankName: 'Axis Bank',
                    amount: '₹25,00,000',
                    emi: '₹30,000',
                    startDate: '2023-03-01',
                    endDate: '2026-03-01',
                    providedDocument: 'GST Returns',
                    remarks: 'Expansion'
                },

                // 2. Foreclosure Requested (Pending Tab in Foreclosure)
                {
                    id: '6',
                    sn: 'SN-006',
                    loanName: 'Bike Loan',
                    bankName: 'HDFC Bank',
                    amount: '₹1,50,000',
                    emi: '₹5,000',
                    startDate: '2023-01-01',
                    endDate: '2025-01-01',
                    providedDocument: 'Bike RC',
                    remarks: 'Early closure planned',
                    foreclosureStatus: 'Pending',
                    requestDate: '2024-03-01',
                    requesterName: 'John Doe',
                    file: 'bike_noc.pdf'
                },
                {
                    id: '7',
                    sn: 'SN-007',
                    loanName: 'Gold Loan',
                    bankName: 'Muthoot Finance',
                    amount: '₹3,00,000',
                    emi: 'Interest Only',
                    startDate: '2023-12-01',
                    endDate: '2024-12-01',
                    providedDocument: 'Gold Ornaments',
                    remarks: 'Releasing gold',
                    foreclosureStatus: 'Pending',
                    requestDate: '2024-03-05',
                    requesterName: 'Jane Smith',
                    file: 'gold_loan_receipt.pdf'
                },
                {
                    id: '8',
                    sn: 'SN-008',
                    loanName: 'Laptop Loan',
                    bankName: 'Bajaj Finserv',
                    amount: '₹80,000',
                    emi: '₹4,000',
                    startDate: '2023-05-01',
                    endDate: '2024-05-01',
                    providedDocument: 'Invoice',
                    remarks: 'Upgrade required',
                    foreclosureStatus: 'Pending',
                    requestDate: '2024-03-10',
                    requesterName: 'Admin',
                    file: 'laptop_inv.pdf'
                },

                // 3. Documents Collected (Pending in Collect NOC, History in Collect Documents)
                {
                    id: '9',
                    sn: 'SN-009',
                    loanName: 'Equipment Loan',
                    bankName: 'IDFC First',
                    amount: '₹5,00,000',
                    emi: '₹15,000',
                    startDate: '2022-01-01',
                    endDate: '2025-01-01',
                    providedDocument: 'Machinery Invoice',
                    remarks: 'Closing early',
                    foreclosureStatus: 'Pending',
                    requestDate: '2024-02-15',
                    requesterName: 'Factory Manager',
                    documentStatus: 'Yes',
                    documentCollectionRemarks: 'All original docs received',
                    file: 'equip_docs.pdf'
                },
                {
                    id: '10',
                    sn: 'SN-010',
                    loanName: 'Consumer Loan',
                    bankName: 'Kotak Bank',
                    amount: '₹50,000',
                    emi: '₹2,500',
                    startDate: '2023-01-01',
                    endDate: '2024-01-01',
                    providedDocument: 'None',
                    remarks: '-',
                    foreclosureStatus: 'Pending',
                    requestDate: '2024-02-20',
                    requesterName: 'Admin',
                    documentStatus: 'Yes',
                    documentCollectionRemarks: 'Verified',
                    file: 'consumer_loan.pdf'
                },
                {
                    id: '11',
                    sn: 'SN-011',
                    loanName: 'Travel Loan',
                    bankName: 'Tata Capital',
                    amount: '₹2,00,000',
                    emi: '₹10,000',
                    startDate: '2023-04-01',
                    endDate: '2024-04-01',
                    providedDocument: 'Passport Copy',
                    remarks: 'Paid off',
                    foreclosureStatus: 'Pending',
                    requestDate: '2024-02-25',
                    requesterName: 'Travel Desk',
                    documentStatus: 'Yes',
                    documentCollectionRemarks: 'Received',
                    file: 'passport_copy.pdf'
                },


                // 4. NOC Collected (Pending in Final Settlement, History in Collect NOC)
                {
                    id: '12',
                    sn: 'SN-012',
                    loanName: 'Renovation Loan',
                    bankName: 'PNB',
                    amount: '₹4,00,000',
                    emi: '₹8,000',
                    startDate: '2021-01-01',
                    endDate: '2026-01-01',
                    providedDocument: 'House Papers',
                    remarks: 'Done',
                    file: 'reno_noc.pdf',
                    foreclosureStatus: 'Pending',
                    requestDate: '2024-01-10',
                    requesterName: 'Owner',
                    documentStatus: 'Yes',
                    documentCollectionRemarks: 'Collected',
                    collectNocStatus: 'Yes'
                },
                {
                    id: '13',
                    sn: 'SN-013',
                    loanName: 'Wedding Loan',
                    bankName: 'BoB',
                    amount: '₹10,00,000',
                    emi: '₹20,000',
                    startDate: '2022-06-01',
                    endDate: '2027-06-01',
                    providedDocument: 'Salary Slip',
                    remarks: 'Closure',
                    file: 'wedding_loan_noc.pdf',
                    foreclosureStatus: 'Pending',
                    requestDate: '2024-01-15',
                    requesterName: 'Admin',
                    documentStatus: 'Yes',
                    documentCollectionRemarks: 'Ok',
                    collectNocStatus: 'Yes'
                },
                {
                    id: '14',
                    sn: 'SN-014',
                    loanName: 'Medical Loan',
                    bankName: 'Yes Bank',
                    amount: '₹3,00,000',
                    emi: '₹12,000',
                    startDate: '2023-02-01',
                    endDate: '2024-02-01',
                    providedDocument: 'Insurance',
                    remarks: 'Settled',
                    file: 'med_insurance.pdf',
                    foreclosureStatus: 'Pending',
                    requestDate: '2024-01-20',
                    requesterName: 'HR',
                    documentStatus: 'Yes',
                    documentCollectionRemarks: 'Ok',
                    collectNocStatus: 'Yes'
                },


                // 5. Final Settled (History in Final Settlement)
                {
                    id: '15',
                    sn: 'SN-015',
                    loanName: 'Top-up Loan',
                    bankName: 'ICICI Bank',
                    amount: '₹1,00,000',
                    emi: '₹5,000',
                    startDate: '2022-01-01',
                    endDate: '2023-01-01',
                    providedDocument: 'Cheques',
                    remarks: 'Closed',
                    foreclosureStatus: 'Pending',
                    requestDate: '2023-12-01',
                    requesterName: 'Admin',
                    documentStatus: 'Yes',
                    documentCollectionRemarks: 'Complete',
                    collectNocStatus: 'Yes',
                    finalSettlementStatus: 'Yes',
                    settlementDate: '2023-12-15',
                    file: 'settlement_letter.pdf'
                },
                {
                    id: '16',
                    sn: 'SN-016',
                    loanName: 'Small Biz Loan',
                    bankName: 'HDFC',
                    amount: '₹5,00,000',
                    emi: '₹10,000',
                    startDate: '2022-03-01',
                    endDate: '2023-03-01',
                    providedDocument: 'Udyam',
                    remarks: 'Closed',
                    foreclosureStatus: 'Pending',
                    requestDate: '2023-12-05',
                    requesterName: 'Director',
                    documentStatus: 'Yes',
                    documentCollectionRemarks: 'Received',
                    collectNocStatus: 'Yes',
                    finalSettlementStatus: 'Yes',
                    settlementDate: '2023-12-20',
                    file: 'closure_cert.pdf'
                },

                // 6. Settlement Deferred (Pending in Final Settlement with Next Date)
                {
                    id: '17',
                    sn: 'SN-017',
                    loanName: 'Credit Card Loan',
                    bankName: 'SBI Cards',
                    amount: '₹50,000',
                    emi: '₹2,500',
                    startDate: '2023-01-01',
                    endDate: '2023-12-01',
                    providedDocument: 'None',
                    remarks: 'Pending check',
                    foreclosureStatus: 'Pending',
                    requestDate: '2023-12-10',
                    requesterName: 'Admin',
                    documentStatus: 'Yes',
                    documentCollectionRemarks: 'Yes',
                    collectNocStatus: 'Yes',
                    finalSettlementStatus: 'No',
                    nextDate: '2024-04-15',
                    file: 'cc_statement_apr.pdf'
                },
                {
                    id: '18',
                    sn: 'SN-018',
                    loanName: 'Mobile Loan',
                    bankName: 'Bajaj',
                    amount: '₹30,000',
                    emi: '₹2,000',
                    startDate: '2023-07-01',
                    endDate: '2023-12-01',
                    providedDocument: 'None',
                    remarks: 'Wait',
                    foreclosureStatus: 'Pending',
                    requestDate: '2023-12-12',
                    requesterName: 'Admin',
                    documentStatus: 'Yes',
                    documentCollectionRemarks: 'Yes',
                    collectNocStatus: 'Yes',
                    finalSettlementStatus: 'No',
                    nextDate: '2024-04-20',
                    file: 'mobile_bill_mar.pdf'
                },
                {
                    id: '19',
                    sn: 'SN-019',
                    loanName: 'Appliance Loan',
                    bankName: 'IDFC',
                    amount: '₹40,000',
                    emi: '₹3,000',
                    startDate: '2023-08-01',
                    endDate: '2024-02-01',
                    providedDocument: 'None',
                    remarks: 'Delayed',
                    foreclosureStatus: 'Pending',
                    requestDate: '2024-02-15',
                    requesterName: 'Admin',
                    documentStatus: 'Yes',
                    documentCollectionRemarks: 'Yes',
                    collectNocStatus: 'Yes',
                    finalSettlementStatus: 'No',
                    nextDate: '2024-05-01',
                    file: 'appliance_warranty.pdf'
                },
                {
                    id: '20',
                    sn: 'SN-020',
                    loanName: 'Printer Loan',
                    bankName: 'Canon Finance',
                    amount: '₹20,000',
                    emi: '₹1,000',
                    startDate: '2023-09-01',
                    endDate: '2024-03-01',
                    providedDocument: 'Invoice',
                    remarks: 'Delayed',
                    foreclosureStatus: 'Pending',
                    requestDate: '2024-03-01',
                    requesterName: 'IT',
                    documentStatus: 'Yes',
                    documentCollectionRemarks: 'Yes',
                    collectNocStatus: 'Yes',
                    finalSettlementStatus: 'No',
                    nextDate: '2024-05-15',
                    file: 'printer_manual.pdf'
                },
            ],
            masterData: [
                { id: '1', companyName: 'Acme Corp', documentType: 'Contract', category: 'Company' },
                { id: '2', companyName: 'Globex Inc.', documentType: 'Invoice', category: 'Company' },
                { id: '3', companyName: 'Soylent Corp', documentType: 'NDA', category: 'Company' },
                { id: '4', companyName: 'Umbrella Corp', documentType: 'Report', category: 'Director' },
                { id: '5', companyName: 'Stark Industries', documentType: 'Blueprint', category: 'Personal' },
                { id: '6', companyName: 'Wayne Enterprises', documentType: 'Grant', category: 'Personal' },
            ],
            renewalHistory: [
                {
                    id: 'hist-1',
                    documentId: 'doc-1',
                    sn: 'SN-001',
                    documentName: 'Service Agreement 2023',
                    companyName: 'Acme Corp',
                    documentType: 'Contract',
                    category: 'Company',
                    entryDate: '2023-01-15',
                    oldRenewalDate: '2024-01-15',
                    oldFile: 'service_agreement_v1.pdf',
                    renewalStatus: 'Yes',
                    nextRenewalDate: '2025-01-15',
                    newFile: 'service_agreement_v2.pdf'
                },
                {
                    id: 'hist-2',
                    documentId: 'doc-2',
                    sn: 'SN-002',
                    documentName: 'Liability Insurance',
                    companyName: 'Globex Inc.',
                    documentType: 'Insurance',
                    category: 'Company',
                    entryDate: '2023-03-10',
                    oldRenewalDate: '2024-03-10',
                    oldFile: 'insurance_2023.pdf',
                    renewalStatus: 'No',
                    nextRenewalDate: null,
                    newFile: null
                }
            ],
            shareHistory: DUMMY_SHARE_DATA,
            subscriptionRenewalHistory: [],
            addDocument: (item) => set((state) => ({ documents: [...state.documents, item] })),
            addDocuments: (items) => set((state) => ({ documents: [...state.documents, ...items] })),
            addSubscription: (item) => set((state) => ({ subscriptions: [...state.subscriptions, item] })),
            addLoan: (item) => set((state) => ({ loans: [...state.loans, item] })),
            addMasterData: (item) => set((state) => ({ masterData: [...state.masterData, item] })),
            addRenewalHistory: (item) => set((state) => ({ renewalHistory: [item, ...state.renewalHistory] })),
            addSubscriptionRenewalHistory: (item) => set((state) => ({ subscriptionRenewalHistory: [item, ...state.subscriptionRenewalHistory] })),
            addShareHistory: (item) => set((state) => ({ shareHistory: [item, ...state.shareHistory] })),
            resetShareHistory: () => set({ shareHistory: DUMMY_SHARE_DATA }),
            resetSubscriptions: () => set({ subscriptions: DUMMY_SUBSCRIPTIONS }), /*
                {
                    id: 'sub-1',
                    sn: 'SN-001',
                    requestedDate: '10/01/2024',
                    companyName: 'Reliance Jio Infocomm',
                    subscriberName: 'Rahul Kumar',
                    subscriptionName: 'JioFiber Postpaid',
                    plan: 'Gold Plan',
                    price: '₹999',
                    frequency: 'Monthly',
                    purpose: 'Office Internet',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-2',
                    sn: 'SN-002',
                    requestedDate: '15/01/2024',
                    companyName: 'Tata AIG General Insurance',
                    subscriberName: 'Priya Sharma',
                    subscriptionName: 'Health Insurance',
                    plan: 'Family Floater',
                    price: '₹12,499',
                    frequency: 'Yearly',
                    purpose: 'Employee Benefit',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-3',
                    sn: 'SN-003',
                    requestedDate: '20/01/2024',
                    companyName: 'Zoho Corporation',
                    subscriberName: 'Amit Patel',
                    subscriptionName: 'Zoho One',
                    plan: 'Professional',
                    price: '₹1,500',
                    frequency: 'Monthly',
                    purpose: 'CRM & Accounting',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-4',
                    sn: 'SN-004',
                    requestedDate: '22/01/2024',
                    companyName: 'Bharti Airtel',
                    subscriberName: 'Vikram Singh',
                    subscriptionName: 'Airtel Xstream',
                    plan: 'Fiber Basic',
                    price: '₹799',
                    frequency: 'Monthly',
                    purpose: 'Home Internet',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-5',
                    sn: 'SN-005',
                    requestedDate: '25/01/2024',
                    companyName: 'Disney+ Hotstar',
                    subscriberName: 'Neha Gupta',
                    subscriptionName: 'Hotstar Premium',
                    plan: 'Super',
                    price: '₹899',
                    frequency: 'Yearly',
                    purpose: 'Entertainment',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-6',
                    sn: 'SN-006',
                    requestedDate: '01/02/2024',
                    companyName: 'Amazon',
                    subscriberName: 'Rohan Das',
                    subscriptionName: 'Amazon Prime',
                    plan: 'Prime Lite',
                    price: '₹999',
                    frequency: 'Yearly',
                    purpose: 'Shopping & Video',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-7',
                    sn: 'SN-007',
                    requestedDate: '05/02/2024',
                    companyName: 'Bennett, Coleman & Co.',
                    subscriberName: 'Office Admin',
                    subscriptionName: 'Times of India',
                    plan: 'ePaper',
                    price: '₹150',
                    frequency: 'Monthly',
                    purpose: 'News & Research',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-8',
                    sn: 'SN-008',
                    requestedDate: '10/02/2024',
                    companyName: 'Swiggy',
                    subscriberName: 'Staff Welfare',
                    subscriptionName: 'Swiggy One',
                    plan: 'Quarterly',
                    price: '₹300',
                    frequency: 'Quarterly',
                    purpose: 'Food Delivery',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-9',
                    sn: 'SN-009',
                    requestedDate: '12/02/2024',
                    companyName: 'Zomato',
                    subscriberName: 'Marketing Team',
                    subscriptionName: 'Zomato Gold',
                    plan: 'Half-Yearly',
                    price: '₹750',
                    frequency: '6 Months',
                    purpose: 'Client Meetings',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-10',
                    sn: 'SN-010',
                    requestedDate: '15/02/2024',
                    companyName: 'Cure.fit',
                    subscriberName: 'HR Dept',
                    subscriptionName: 'Cult.pro',
                    plan: 'ElitePass',
                    price: '₹15,000',
                    frequency: 'Yearly',
                    purpose: 'Employee Wellness',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-11',
                    sn: 'SN-011',
                    requestedDate: '18/02/2024',
                    companyName: 'Microsoft Corporation',
                    subscriberName: 'IT Dept',
                    subscriptionName: 'Microsoft 365',
                    plan: 'Business Standard',
                    price: '₹4,800',
                    frequency: 'Yearly',
                    purpose: 'Productivity Suite',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-12',
                    sn: 'SN-012',
                    requestedDate: '20/02/2024',
                    companyName: 'Adobe Inc.',
                    subscriberName: 'Design Team',
                    subscriptionName: 'Creative Cloud',
                    plan: 'All Apps',
                    price: '₹4,200',
                    frequency: 'Monthly',
                    purpose: 'Graphic Design',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                },
                {
                    id: 'sub-13',
                    sn: 'SN-013',
                    requestedDate: '25/02/2024',
                    companyName: 'LIC India',
                    subscriberName: 'Finance Head',
                    subscriptionName: 'Jeevan Anand',
                    plan: 'Life Insurance',
                    price: '₹25,000',
                    frequency: 'Yearly',
                    purpose: 'Keyman Insurance',
                    startDate: '',
                    endDate: '',
                    renewalDate: '',
                    status: ''
                }
        */
            updateDocument: (id, updatedItem) => set((state) => ({
                documents: state.documents.map((doc) =>
                    doc.id === id ? { ...doc, ...updatedItem } : doc
                )
            })),
            updateSubscription: (id, updatedItem) => set((state) => ({
                subscriptions: state.subscriptions.map((sub) =>
                    sub.id === id ? { ...sub, ...updatedItem } : sub
                )
            })),
            updateLoan: (id, updatedItem) => set((state) => ({
                loans: state.loans.map((loan) =>
                    loan.id === id ? { ...loan, ...updatedItem } : loan
                )
            })),
            deleteDocument: (id) => set((state) => ({
                documents: state.documents.filter((doc) => doc.id !== id)
            })),
        }),
        {
            name: 'app-data-storage-v8',
        }
    )
);

export default useDataStore;
