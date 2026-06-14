import type {
  Organization,
  Profile,
  Location,
  Product,
  Inventory,
  ActivityFeed,
  StaleStockAlert,
  FootTrafficEvent,
} from '../types';

// Mock data
const mockOrganization: Organization = {
  id: 'org-1',
  name: 'Fashion Haven Ltd',
  tier: 'premium',
  created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  is_pro: false,
  pro_expiry_date: null,
};

const mockProfile: Profile = {
  id: 'profile-1',
  user_id: 'user-1',
  org_id: 'org-1',
  role: 'owner',
  name: 'John Doe',
  referral_code: 'ABC123',
};

const mockLocations: Location[] = [
  { id: 'loc-1', org_id: 'org-1', name: 'Victoria Island' },
  { id: 'loc-2', org_id: 'org-1', name: 'Lekki Suite' },
];

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    org_id: 'org-1',
    name: 'Ankara Weekend Dress',
    category: 'Ankara',
    image_url: 'https://example.com/dress.jpg',
    base_currency: 'NGN',
    cost_price: 8500,
    selling_price: 15000,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    org_id: 'org-1',
    name: 'Leather Slides - Tan',
    category: 'Shoes',
    image_url: 'https://example.com/shoes.jpg',
    base_currency: 'NGN',
    cost_price: 6000,
    selling_price: 12000,
    created_at: new Date().toISOString(),
  },
];

const mockInventory: Inventory[] = [
  {
    id: 'inv-1',
    product_id: 'prod-1',
    location_id: 'loc-1',
    quantity: 35,
    updated_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days ago (stale)
  },
  {
    id: 'inv-2',
    product_id: 'prod-1',
    location_id: 'loc-2',
    quantity: 25,
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inv-3',
    product_id: 'prod-2',
    location_id: 'loc-2',
    quantity: 45,
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockActivityFeed: ActivityFeed[] = [
  {
    id: 'act-1',
    org_id: 'org-1',
    type: 'sale',
    product_id: 'prod-2',
    quantity: 2,
    source_location_id: 'loc-2',
    target_location_id: null,
    total_amount: 24000,
    recorded_by: 'user-1',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    payment_method: 'cash',
  },
];

const mockStaleStockAlerts: StaleStockAlert[] = [
  {
    id: 'stale-1',
    product_id: 'prod-1',
    location_id: 'loc-1',
    quantity: 35,
    days_inactive: 40,
    product_name: 'Ankara Weekend Dress',
    location_name: 'Victoria Island',
  },
];

const mockFootTrafficEvents: FootTrafficEvent[] = [
  {
    id: 'traffic-1',
    location_id: 'loc-1',
    start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    end_time: new Date().toISOString(),
    motion_count: 25,
    sales_count: 0,
  },
];

// Mock database
export const supabaseMock = {
  getOrganization: () => mockOrganization,
  getProfile: () => mockProfile,
  getLocations: () => mockLocations,
  getProducts: () => mockProducts,
  getInventory: () => mockInventory,
  getActivityFeed: () => mockActivityFeed,
  getFootTrafficEvents: () => mockFootTrafficEvents,
};

export {
  mockStaleStockAlerts,
  mockFootTrafficEvents,
};
