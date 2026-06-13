export type OrganizationTier = 'free' | 'premium';
export type UserRole = 'owner' | 'manager' | 'assistant';
export type ActivityType = 'sale' | 'restock' | 'transfer' | 'anomaly';

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
  location_id: string;
  declared_cash: number;
  declared_transfers: number;
  expected_cash: number;
  expected_transfers: number;
  status: 'pending' | 'matched' | 'discrepancy';
  created_by: string | null;
  created_at: string;
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
}

export interface LeadSignal {
  id: string;
  product_name: string;
  location: string;
  timestamp: string;
  match_confidence: number;
  is_locked?: boolean;
}
