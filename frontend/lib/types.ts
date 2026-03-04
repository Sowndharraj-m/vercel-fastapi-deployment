// ─── Auth ───────────────────────────────────────────────
export interface LoginRequest {
    email: string;
    password: string;
}

export interface AdminCreateUserRequest {
    email: string;
    password: string;
    role?: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface RefreshRequest {
    refresh_token: string;
}

export interface InviteCompleteRequest {
    email: string;
    password: string;
    full_name?: string | null;
}

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordResetConfirm {
    token: string;
    new_password: string;
}

export interface UserResponse {
    id: number;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
    last_login?: string | null;
}

// ─── Person ─────────────────────────────────────────────
export interface PersonCreate {
    person_type: string;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    date_of_birth?: string | null;
    address?: string | null;
    department?: string | null;
    manager_id?: number | null;
    join_date?: string | null;
    end_date?: string | null;
}

export interface PersonUpdate {
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    date_of_birth?: string | null;
    address?: string | null;
    department?: string | null;
    manager_id?: number | null;
    join_date?: string | null;
    end_date?: string | null;
    status?: string | null;
    person_type?: string | null;
}

export interface PersonSelfUpdate {
    phone?: string | null;
    address?: string | null;
}

export interface PersonResponse {
    id: number;
    person_code: string;
    person_type: string;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    date_of_birth?: string | null;
    address?: string | null;
    department?: string | null;
    manager_id?: number | null;
    join_date?: string | null;
    end_date?: string | null;
    status: string;
    created_at: string;
}

export interface PersonListResponse {
    items: PersonResponse[];
    total: number;
}

// ─── Offer Letters ──────────────────────────────────────
export interface OfferTemplateCreate {
    name: string;
    content: string;
    placeholders_schema?: string[] | null;
}

export interface OfferTemplateResponse {
    id: number;
    name: string;
    version: number;
    content: string;
    placeholders_schema?: string[] | null;
    created_by?: number | null;
    created_at: string;
}

export interface OfferLetterGenerate {
    person_id: number;
    template_id: number;
    placeholders?: Record<string, unknown> | null;
}

export interface OfferLetterResponse {
    id: number;
    person_id: number;
    template_id?: number | null;
    rendered_content?: string | null;
    pdf_file_key?: string | null;
    status: string;
    sent_at?: string | null;
    viewed_at?: string | null;
    accepted_at?: string | null;
    declined_at?: string | null;
    acceptance_metadata?: Record<string, unknown> | null;
    created_at: string;
}

export interface OfferAcceptRequest {
    typed_name?: string | null;
    confirmation?: boolean;
    start_date_confirmed?: string | null;
}

export interface OfferDeclineRequest {
    reason?: string | null;
}

// ─── Onboarding ─────────────────────────────────────────
export interface OnboardingSubmitRequest {
    person_id: number;
    offer_id?: number | null;
    form_data: Record<string, unknown>;
}

export interface OnboardingSubmissionResponse {
    id: number;
    person_id: number;
    offer_id?: number | null;
    form_data?: Record<string, unknown> | null;
    submitted_at: string;
}

export interface OnboardingStatusResponse {
    person_id: number;
    offer_sent: boolean;
    offer_accepted: boolean;
    documents_uploaded: number;
    documents_verified: number;
    onboarding_submitted: boolean;
}

// ─── Documents ──────────────────────────────────────────
export interface DocumentUploadResponse {
    id: number;
    person_id: number;
    doc_type: string;
    original_filename?: string | null;
    mime_type?: string | null;
    size_bytes?: number | null;
    status: string;
    uploaded_at: string;
}

export interface DocumentListResponse {
    id: number;
    person_id: number;
    doc_type: string;
    original_filename?: string | null;
    status: string;
    uploaded_at: string;
    verified_at?: string | null;
    rejection_notes?: string | null;
}

export interface DocumentDownloadResponse {
    download_url: string;
    expires_in_seconds: number;
}

export interface DocumentVerifyRequest {
    notes?: string | null;
}

export interface DocumentRejectRequest {
    notes: string;
}

// ─── Attendance ─────────────────────────────────────────
export interface AttendanceCheckInRequest {
    notes?: string | null;
}

export interface AttendanceCheckOutRequest {
    notes?: string | null;
}

export interface AttendanceMarkRequest {
    date: string;
    status: string;
    notes?: string | null;
}

export interface AttendanceResponse {
    id: number;
    person_id: number;
    date: string;
    check_in?: string | null;
    check_out?: string | null;
    status: string;
    notes?: string | null;
    created_at: string;
}

export interface AttendanceUpdateRequest {
    status?: string | null;
    check_in?: string | null;
    check_out?: string | null;
    notes?: string | null;
    override_reason: string;
}

export interface AttendanceSummary {
    person_id: number;
    period_from: string;
    period_to: string;
    total_present: number;
    total_absent: number;
    total_half_day: number;
    total_leave: number;
    total_holiday: number;
}

// ─── Compensation & Payroll ─────────────────────────────
export interface CompensationProfileCreate {
    comp_type: string;
    amount?: number | null;
    currency?: string;
    effective_from?: string | null;
    bank_details?: string | null;
}

export interface CompensationProfileResponse {
    id: number;
    person_id: number;
    comp_type: string;
    amount?: number | null;
    currency: string;
    effective_from?: string | null;
    created_at: string;
}

export interface PayoutRunRequest {
    period_month: string;
    person_ids?: number[] | null;
}

export interface PayoutResponse {
    id: number;
    person_id: number;
    period_month: string;
    amount: number;
    status: string;
    paid_at?: string | null;
    reference_id?: string | null;
    created_at: string;
}

export interface PayoutMarkPaidRequest {
    reference_id?: string | null;
}

export interface PayslipResponse {
    id: number;
    payout_id: number;
    file_key?: string | null;
    generated_at: string;
}

export interface PayslipDownloadResponse {
    download_url: string;
}

// ─── Audit Logs ─────────────────────────────────────────
export interface AuditLogResponse {
    id: number;
    actor_user_id?: number | null;
    entity_type: string;
    entity_id: number;
    action: string;
    before_json?: unknown | null;
    after_json?: unknown | null;
    timestamp: string;
    ip_address?: string | null;
    user_agent?: string | null;
}

export interface AuditLogListResponse {
    items: AuditLogResponse[];
    total: number;
}

// ─── Items (legacy) ─────────────────────────────────────
export interface ItemCreate {
    name: string;
    description?: string;
    price: number;
}

export interface ItemResponse {
    id: number;
    name: string;
    description: string;
    price: number;
    created_at: string;
}

export interface ItemUpdate {
    name?: string | null;
    description?: string | null;
    price?: number | null;
}
