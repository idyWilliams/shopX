export type OrganizationTier = 'free' | 'premium';
export type UserRole = 'owner' | 'manager' | 'assistant';
export type ActivityType = 'sale' | 'restock' | 'transfer' | 'anomaly';

export type ShiftStatus = 'open' | 'clean' | 'discrepancy_locked';
export type CashDrawerEventType = 'OPENING' | 'CLOSING' | 'DROP';
export type PendingTransferStatus = 'initiated' | 'confirmed' | 'failed';

export interface Organization {
  id: string;
  name: string;
  tier: OrganizationTier;
  created_at: string;
  is_pro: boolean;
  pro_expiry_date: string | null;
}

export interface Profile {
  id: string;
  user_id: string;
  org_id: string;
  role: UserRole;
  name: string;
  referral_code: string;
  email?: string;
  phone?: string;
}

export interface Location {
  id: string;
  org_id: string;
  name: string;
}

export interface Product {
  id: string;
  org_id: string;
  name: string;
  category: string;
  image_url: string | null;
  base_currency: string;
  cost_price: number;
  selling_price: number;
  created_at: string;
  stock_quantity?: number;
}

export interface Inventory {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  updated_at: string;
}

export interface ActivityFeed {
  id: string;
  org_id: string;
  type: ActivityType;
  product_id: string;
  quantity: number;
  source_location_id: string | null;
  target_location_id: string | null;
  total_amount: number;
  recorded_by: string;
  timestamp: string;
  image_url?: string | null;
  payment_method?: 'cash' | 'transfer' | null;
}

export type SenderRole = 'staff' | 'ai_manager' | 'owner';
export type MessageType = 'text' | 'audio';

export interface ChatMessage {
  id: string;
  sender_role: SenderRole;
  message_type: MessageType;
  text: string;
  transcription?: string;
  timestamp: string;
  sender_name: string;
}

export interface Shift {
  id: string;
  store_id: string;
  attendant_id: string | null;
  opened_at: Date;
  closed_at: Date | null;
  opening_cash_float: number;
  status: ShiftStatus;
}

export interface CashDrawerLog {
  id: string;
  store_id: string;
  shift_id: string;
  event_type: CashDrawerEventType;
  expected_amount: number;
  actual_amount: number;
  discrepancy: number | null;
  created_at: Date;
}

export interface DailyDigest {
  store_id: string;
  date: string;
  total_sales_amount: number;
  number_of_transactions: number;
  shifts: {
    total: number;
    clean: number;
    discrepancy_locked: number;
  };
  total_discrepancy_amount: number;
  anomalies: any[];
}

export interface PendingTransfer {
  id: string;
  store_id: string;
  ticket_id: string | null;
  sale_id: string | null;
  amount: number;
  currency: string;
  status: PendingTransferStatus;
  created_at: Date;
  confirmed_at: Date | null;
}

export interface StaleStockAlert {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  days_inactive: number;
  product_name: string;
  location_name: string;
}

export interface FootTrafficEvent {
  id: string;
  location_id: string;
  start_time: string;
  end_time: string;
  motion_count: number;
  sales_count: number;
}

export interface ParsedActivityInput {
  action: ActivityType;
  item: string;
  qty: number;
  location: string;
  amount: number;
  target_location?: string;
  paymentMethod?: 'cash' | 'transfer' | null;
}

export interface LeadSignal {
  id: string;
  product_name: string;
  location: string;
  timestamp: string;
  match_confidence: number;
  is_locked?: boolean;
}

export interface OperationalAnomaly {
  id: string;
  store_id: string;
  shift_id?: string;
  attendant_id?: string;
  anomaly_type: string;
  severity: "low" | "medium" | "high" | "critical";
  payload?: string;
  resolved: boolean;
  created_at: Date;
}

export interface StoreSummary {
  store_id: string;
  name: string;
  location?: string;
  revenue_today: number;
  active_shift?: Shift;
  active_attendant_name?: string;
  anomaly_count: number;
  last_activity_at: Date;
}

export interface GlobalOverview {
  total_revenue_today: number;
  active_shifts_count: number;
  unresolved_anomalies_count: number;
  locked_shifts_count: number;
}
