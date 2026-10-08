import type { Option } from '@/types/ui';

/** The record types activities, notes, files and custom fields attach to (CrmRecords::TYPES). */
export type RecordType =
    | 'account'
    | 'contact'
    | 'lead'
    | 'deal'
    | 'case'
    | 'contract';

export type Owner = { id: number; name: string };

export type Account = {
    id: number;
    custom_fields?: Record<string, unknown> | null;
    name: string;
    industry: string | null;
    website: string | null;
    phone: string | null;
    email: string | null;
    billing_address: string | null;
    shipping_address: string | null;
    owner_id: number;
    owner: Owner;
    contacts_count?: number;
    created_at: string;
};

export type Contact = {
    id: number;
    custom_fields?: Record<string, unknown> | null;
    first_name: string;
    last_name: string;
    full_name: string;
    job_title: string | null;
    email: string | null;
    phone: string | null;
    account_id: number | null;
    account?: { id: number; name: string } | null;
    owner_id: number;
    owner: Owner;
    created_at: string;
};

export type Stage = {
    id: number;
    name: string;
    probability: number;
    kind: 'open' | 'won' | 'lost';
};

export type Deal = {
    id: number;
    custom_fields?: Record<string, unknown> | null;
    name: string;
    account_id: number | null;
    account?: { id: number; name: string } | null;
    contact_id: number | null;
    contact?: {
        id: number;
        first_name: string;
        last_name: string;
        email?: string | null;
    } | null;
    stage_id: number;
    stage?: Pick<Stage, 'id' | 'name' | 'kind'> & Partial<Stage>;
    amount: string;
    probability: number;
    expected_close_date: string | null;
    closed_at: string | null;
    owner_id: number;
    owner: Owner;
    created_at: string;
};

/** A contact picker option, carrying its account so the list can narrow to one account. */
export type ContactOption = {
    value: string;
    label: string;
    account_id: number | null;
};

export type Lead = {
    id: number;
    custom_fields?: Record<string, unknown> | null;
    first_name: string;
    last_name: string;
    full_name: string;
    company: string | null;
    job_title: string | null;
    email: string | null;
    phone: string | null;
    source: string | null;
    status: string;
    converted_at: string | null;
    converted_account?: { id: number; name: string } | null;
    converted_contact?: {
        id: number;
        first_name: string;
        last_name: string;
    } | null;
    converted_deal?: { id: number; name: string } | null;
    owner_id: number;
    owner: Owner;
    created_at: string;
};

export type Activity = {
    id: number;
    type: 'call' | 'meeting' | 'task' | 'email';
    subject: string;
    notes: string | null;
    due_at: string | null;
    done_at: string | null;
    owner_id: number;
    owner: Owner | null;
    regarding_type: RecordType | null;
    regarding_id: number | null;
    regarding: { type: string; id: number; name: string } | null;
};

/** The record an activity is logged against, from its page. */
export type Regarding = {
    type: RecordType;
    id: number;
};

export type Note = {
    id: number;
    body: string;
    user_id: number | null;
    author: Owner | null;
    created_at: string;
};

export type Attachment = {
    id: number;
    name: string;
    mime_type: string | null;
    size: number;
    user_id: number | null;
    uploader: Owner | null;
    created_at: string;
};

export type HistoryEntry = {
    id: number;
    event: 'created' | 'updated' | 'deleted';
    at: string | null;
    user: string | null;
    changes: { field: string; from: unknown; to: unknown }[];
};

/** What every record page's tabs receive (ListsRecords::recordTabProps). */
export type RecordTabData = {
    activities: Activity[];
    activityTypes: Option[];
    notes: Note[];
    attachments: Attachment[];
    history: HistoryEntry[];
};

export type Product = {
    id: number;
    name: string;
    sku: string | null;
    description?: string | null;
    unit_price: string;
    tax_rate: string;
    active?: boolean;
};

export type QuoteItem = {
    id?: number;
    product_id: number | null;
    description: string;
    quantity: string;
    unit_price: string;
    discount_percent: string;
    tax_rate: string;
    line_total?: string;
};

export type Quote = {
    id: number;
    number: string;
    account_id: number | null;
    account?: Account | { id: number; name: string } | null;
    contact_id: number | null;
    contact?: Contact | null;
    deal_id: number | null;
    deal?: { id: number; name: string } | null;
    status: 'draft' | 'pending_approval' | 'sent' | 'accepted' | 'declined';
    approval_decision: 'approved' | 'rejected' | null;
    approval_note: string | null;
    approval_at: string | null;
    approver?: Owner | null;
    valid_until: string | null;
    notes: string | null;
    subtotal: string;
    discount_total: string;
    tax_total: string;
    total: string;
    owner_id: number;
    owner: Owner;
    items?: QuoteItem[];
    created_at: string;
};

export type CustomFieldDef = {
    id?: number;
    entity: RecordType;
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'date' | 'checkbox' | 'select';
    options: string[] | null;
    required: boolean;
    active?: boolean;
};

export type SupportCase = {
    id: number;
    custom_fields?: Record<string, unknown> | null;
    number: string;
    subject: string;
    description: string | null;
    account_id: number | null;
    account?: { id: number; name: string } | null;
    contact_id: number | null;
    contact?: {
        id: number;
        first_name: string;
        last_name: string;
        email?: string | null;
    } | null;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    status: 'open' | 'pending' | 'resolved' | 'closed';
    sla_due_at: string;
    resolved_at: string | null;
    escalated_at: string | null;
    owner_id: number;
    owner: Owner;
    created_at: string;
};

export type Contract = {
    id: number;
    custom_fields?: Record<string, unknown> | null;
    name: string;
    account_id: number;
    account?: { id: number; name: string } | null;
    contact_id: number | null;
    contact?: {
        id: number;
        first_name: string;
        last_name: string;
        email?: string | null;
    } | null;
    quote_id: number | null;
    quote?: { id: number; number: string; total: string } | null;
    status: 'draft' | 'active' | 'expired' | 'cancelled' | 'renewed';
    start_date: string;
    end_date: string;
    value: string;
    renewal_terms: string | null;
    notice_days: number;
    reminded_at: string | null;
    renewal_deal_id: number | null;
    renewal_deal?: { id: number; name: string } | null;
    owner_id: number;
    owner: Owner;
    created_at: string;
};

/** Account/contact a new case or contract starts with, from ?new=1&account=&contact=. */
export type RecordDefaults = {
    account_id: number | null;
    contact_id: number | null;
};
