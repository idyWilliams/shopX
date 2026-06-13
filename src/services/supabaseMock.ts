import type {
  Organization,
  Profile,
  Location,
  Product,
  Inventory,
  ActivityFeed,
  StaleStockAlert,
  FootTrafficEvent,
  ParsedActivityInput,
} from '../types';

// Generate UUIDs for mock data
const uuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Mock Organization
export const mockOrganization: Organization = {
  id: uuid(),
  name: 'Lagos Fashion Hub',
  tier: 'premium',
  created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  is_pro: false,
  pro_expiry_date: null
};

// Mock Profiles
export const mockProfiles: Profile[] = [
  {
    id: uuid(),
    user_id: 'auth-user-1',
    org_id: mockOrganization.id,
    role: 'owner',
    name: 'Adaeze Okonkwo',
    referral_code: 'ADA123'
  },
  {
    id: uuid(),
    user_id: 'auth-user-2',
    org_id: mockOrganization.id,
    role: 'manager',
    name: 'Chidi Eze',
    referral_code: 'CHI456'
  },
  {
    id: uuid(),
    user_id: 'auth-user-3',
    org_id: mockOrganization.id,
    role: 'assistant',
    name: 'Funke Adeleke',
    referral_code: 'FUN789'
  },
];

// Mock Locations
export const mockLocations: Location[] = [
  { id: uuid(), org_id: mockOrganization.id, name: 'Shop 1 - Victoria Island' },
  { id: uuid(), org_id: mockOrganization.id, name: 'Shop 2 - Lekki' },
  { id: uuid(), org_id: mockOrganization.id, name: 'Home Storage - Ikeja' },
];

// Mock Products - Rich African Fashion Inventory
export const mockProducts: Product[] = [
  // Ankara Styles
  {
    id: uuid(),
    org_id: mockOrganization.id,
    name: 'Ankara Weekend Dress',
    category: 'Ankara',
    image_url: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400',
    base_currency: 'NGN',
    cost_price: 8500,
    selling_price: 15000,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuid(),
    org_id: mockOrganization.id,
    name: 'Ankara Two-Piece Set',
    category: 'Ankara',
    image_url: 'https://images.unsplash.com/photo-1583391720851-9748e2d3e2b5?w=400',
    base_currency: 'NGN',
    cost_price: 12000,
    selling_price: 22000,
    created_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuid(),
    org_id: mockOrganization.id,
    name: 'Ankara Palazzo Suit',
    category: 'Ankara',
    image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400',
    base_currency: 'NGN',
    cost_price: 15000,
    selling_price: 28000,
    created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Lace Materials
  {
    id: uuid(),
    org_id: mockOrganization.id,
    name: 'Nigerian Lace Fabric - Gold',
    category: 'Lace',
    image_url: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
    base_currency: 'NGN',
    cost_price: 25000,
    selling_price: 45000,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuid(),
    org_id: mockOrganization.id,
    name: 'Nigerian Lace Fabric - Silver',
    category: 'Lace',
    image_url: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
    base_currency: 'NGN',
    cost_price: 28000,
    selling_price: 50000,
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuid(),
    org_id: mockOrganization.id,
    name: 'Lace Gown with Cuffs',
    category: 'Lace',
    image_url: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400',
    base_currency: 'NGN',
    cost_price: 35000,
    selling_price: 65000,
    created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Slides & Sandals
  {
    id: uuid(),
    org_id: mockOrganization.id,
    name: 'Leather Slides - Tan',
    category: 'Shoes',
    image_url: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400',
    base_currency: 'NGN',
    cost_price: 6000,
    selling_price: 12000,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuid(),
    org_id: mockOrganization.id,
    name: 'Leather Slides - Black',
    category: 'Shoes',
    image_url: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400',
    base_currency: 'NGN',
    cost_price: 6500,
    selling_price: 13000,
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuid(),
    org_id: mockOrganization.id,
    name: 'Designer Heels - Red',
    category: 'Shoes',
    image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
    base_currency: 'NGN',
    cost_price: 18000,
    selling_price: 35000,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuid(),
    org_id: mockOrganization.id,
    name: 'Designer Heels - Black',
    category: 'Shoes',
    image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
    base_currency: 'NGN',
    cost_price: 18000,
    selling_price: 35000,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Luxury Bags
  {
    id: uuid(),
    org_id: mockOrganization.id,
    name: 'Leather Tote Bag - Cognac',
    category: 'Bags',
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
    base_currency: 'NGN',
    cost_price: 22000,
    selling_price: 42000,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuid(),
    org_id: mockOrganization.id,
    name: 'Leather Crossbody Bag - Black',
    category: 'Bags',
    image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    base_currency: 'NGN',
    cost_price: 18000,
    selling_price: 35000,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuid(),
    org_id: mockOrganization.id,
    name: 'Beaded Handbag - Multi',
    category: 'Bags',
    image_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400',
    base_currency: 'NGN',
    cost_price: 12000,
    selling_price: 25000,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Jewelry Accessories
  {
    id: uuid(),
    org_id: mockOrganization.id,
    name: 'Gold Plated Necklace Set',
    category: 'Jewelry',
    image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
    base_currency: 'NGN',
    cost_price: 5000,
    selling_price: 12000,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuid(),
    org_id: mockOrganization.id,
    name: 'Beaded Bracelet Set',
    category: 'Jewelry',
    image_url: 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=400',
    base_currency: 'NGN',
    cost_price: 2500,
    selling_price: 6000,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuid(),
    org_id: mockOrganization.id,
    name: 'Statement Earrings - Gold',
    category: 'Jewelry',
    image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400',
    base_currency: 'NGN',
    cost_price: 3000,
    selling_price: 8000,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock Inventory - Distribution across locations
export const mockInventory: Inventory[] = [
  // Shop 1 - Victoria Island
  { id: uuid(), product_id: mockProducts[0].id, location_id: mockLocations[0].id, quantity: 5, updated_at: new Date().toISOString() },
  { id: uuid(), product_id: mockProducts[1].id, location_id: mockLocations[0].id, quantity: 3, updated_at: new Date().toISOString() },
  { id: uuid(), product_id: mockProducts[3].id, location_id: mockLocations[0].id, quantity: 2, updated_at: new Date().toISOString() },
  { id: uuid(), product_id: mockProducts[6].id, location_id: mockLocations[0].id, quantity: 8, updated_at: new Date().toISOString() },
  { id: uuid(), product_id: mockProducts[8].id, location_id: mockLocations[0].id, quantity: 4, updated_at: new Date().toISOString() },
  { id: uuid(), product_id: mockProducts[10].id, location_id: mockLocations[0].id, quantity: 2, updated_at: new Date().toISOString() },
  // Shop 2 - Lekki
  { id: uuid(), product_id: mockProducts[0].id, location_id: mockLocations[1].id, quantity: 3, updated_at: new Date().toISOString() },
  { id: uuid(), product_id: mockProducts[2].id, location_id: mockLocations[1].id, quantity: 4, updated_at: new Date().toISOString() },
  { id: uuid(), product_id: mockProducts[4].id, location_id: mockLocations[1].id, quantity: 1, updated_at: new Date().toISOString() },
  { id: uuid(), product_id: mockProducts[7].id, location_id: mockLocations[1].id, quantity: 6, updated_at: new Date().toISOString() },
  { id: uuid(), product_id: mockProducts[9].id, location_id: mockLocations[1].id, quantity: 3, updated_at: new Date().toISOString() },
  { id: uuid(), product_id: mockProducts[11].id, location_id: mockLocations[1].id, quantity: 4, updated_at: new Date().toISOString() },
  // Home Storage - Ikeja (bulk storage)
  { id: uuid(), product_id: mockProducts[0].id, location_id: mockLocations[2].id, quantity: 80, updated_at: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000).toISOString() },
  { id: uuid(), product_id: mockProducts[1].id, location_id: mockLocations[2].id, quantity: 45, updated_at: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000).toISOString() },
  { id: uuid(), product_id: mockProducts[2].id, location_id: mockLocations[2].id, quantity: 30, updated_at: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000).toISOString() },
  { id: uuid(), product_id: mockProducts[3].id, location_id: mockLocations[2].id, quantity: 25, updated_at: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000).toISOString() },
  { id: uuid(), product_id: mockProducts[4].id, location_id: mockLocations[2].id, quantity: 20, updated_at: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000).toISOString() },
  { id: uuid(), product_id: mockProducts[5].id, location_id: mockLocations[2].id, quantity: 15, updated_at: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000).toISOString() },
  { id: uuid(), product_id: mockProducts[8].id, location_id: mockLocations[2].id, quantity: 20, updated_at: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000).toISOString() },
  { id: uuid(), product_id: mockProducts[9].id, location_id: mockLocations[2].id, quantity: 18, updated_at: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000).toISOString() },
];

// Mock Activity Feed
export const mockActivityFeed: ActivityFeed[] = [
  {
    id: uuid(),
    org_id: mockOrganization.id,
    type: 'sale',
    product_id: mockProducts[0].id,
    quantity: 2,
    source_location_id: mockLocations[0].id,
    target_location_id: null,
    total_amount: 30000,
    recorded_by: mockProfiles[2].id,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuid(),
    org_id: mockOrganization.id,
    type: 'sale',
    product_id: mockProducts[6].id,
    quantity: 1,
    source_location_id: mockLocations[1].id,
    target_location_id: null,
    total_amount: 12000,
    recorded_by: mockProfiles[1].id,
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuid(),
    org_id: mockOrganization.id,
    type: 'restock',
    product_id: mockProducts[10].id,
    quantity: 5,
    source_location_id: null,
    target_location_id: mockLocations[1].id,
    total_amount: 110000,
    recorded_by: mockProfiles[0].id,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuid(),
    org_id: mockOrganization.id,
    type: 'transfer',
    product_id: mockProducts[2].id,
    quantity: 10,
    source_location_id: mockLocations[2].id,
    target_location_id: mockLocations[0].id,
    total_amount: 0,
    recorded_by: mockProfiles[0].id,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuid(),
    org_id: mockOrganization.id,
    type: 'sale',
    product_id: mockProducts[13].id,
    quantity: 3,
    source_location_id: mockLocations[0].id,
    target_location_id: null,
    total_amount: 36000,
    recorded_by: mockProfiles[2].id,
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuid(),
    org_id: mockOrganization.id,
    type: 'anomaly',
    product_id: mockProducts[8].id,
    quantity: 0,
    source_location_id: mockLocations[2].id,
    target_location_id: null,
    total_amount: 0,
    recorded_by: mockProfiles[0].id,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock Stale Stock Alerts
export const mockStaleStockAlerts: StaleStockAlert[] = [
  {
    id: uuid(),
    product_id: mockProducts[8].id,
    location_id: mockLocations[2].id,
    quantity: 20,
    days_inactive: 34,
    product_name: mockProducts[8].name,
    location_name: mockLocations[2].name,
  },
  {
    id: uuid(),
    product_id: mockProducts[9].id,
    location_id: mockLocations[2].id,
    quantity: 18,
    days_inactive: 32,
    product_name: mockProducts[9].name,
    location_name: mockLocations[2].name,
  },
];

// Mock Foot Traffic Events
export const mockFootTrafficEvents: FootTrafficEvent[] = [
  {
    id: uuid(),
    location_id: mockLocations[1].id,
    start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    motion_count: 45,
    sales_count: 0,
  },
];

// Simulated AI Parser for unstructured input
export function parseActivityInput(input: string): ParsedActivityInput | null {
  const lowerInput = input.toLowerCase();

  // Detect action type
  let action: ParsedActivityInput['action'] = 'sale';
  if (lowerInput.includes('sold') || lowerInput.includes('sale')) {
    action = 'sale';
  } else if (lowerInput.includes('restock') || lowerInput.includes('received') || lowerInput.includes('stocked')) {
    action = 'restock';
  } else if (lowerInput.includes('transfer') || lowerInput.includes('moved') || lowerInput.includes('shifted')) {
    action = 'transfer';
  } else if (lowerInput.includes('alert') || lowerInput.includes('anomaly') || lowerInput.includes('stale')) {
    action = 'anomaly';
  }

  // Extract quantity
  const qtyMatch = input.match(/(\d+)\s*(pairs?|pieces?|units?|bags?|sets?|pcs)/i);
  const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

  // Extract amount (handle "40k", "15k", "15000" formats)
  const amountMatch = input.match(/(\d+)k\b/i) || input.match(/total[:\s]*(\d+)/i);
  let amount = 0;
  if (amountMatch) {
    const numStr = amountMatch[1];
    amount = numStr.includes('k') ? parseInt(numStr, 10) * 1000 : parseInt(numStr, 10);
  }

  // Extract item name (simplified)
  const itemPatterns = [
    /sold\s+(\d+\s+)?(pairs?\s+of\s+)?([\w\s]+?)\s+at/i,
    /restock\s+(\d+\s+)?(pairs?\s+of\s+)?([\w\s]+?)\s+at/i,
    /transfer\s+(\d+\s+)?(pairs?\s+of\s+)?([\w\s]+?)\s+from/i,
    /(leather slides|ankara|lace|heels|bags?|jewelry|bracelet|necklace|earrings?)/i,
  ];

  let item = 'Unknown Item';
  for (const pattern of itemPatterns) {
    const match = input.match(pattern);
    if (match) {
      item = match[match.length - 1].trim();
      break;
    }
  }

  // Extract location
  const locationMatch = input.match(/(shop\s*\d?|home\s*storage|lekki|victoria\s*island|ikeja)/i);
  const location = locationMatch ? locationMatch[1] : 'Shop 1';

  return { action, item, qty, location, amount };
}

// Service class for mock database operations
class SupabaseMockService {
  getOrganization(): Organization {
    return mockOrganization;
  }

  getProfiles(): Profile[] {
    return mockProfiles;
  }

  getLocations(): Location[] {
    return mockLocations;
  }

  getProducts(): Product[] {
    return mockProducts;
  }

  getInventory(): Inventory[] {
    return mockInventory;
  }

  getActivityFeed(): ActivityFeed[] {
    return mockActivityFeed;
  }

  getStaleStockAlerts(): StaleStockAlert[] {
    return mockStaleStockAlerts;
  }

  getFootTrafficEvents(): FootTrafficEvent[] {
    return mockFootTrafficEvents;
  }

  getInventoryByLocation(locationId: string): (Inventory & { product: Product })[] {
    return mockInventory
      .filter((inv) => inv.location_id === locationId)
      .map((inv) => ({
        ...inv,
        product: mockProducts.find((p) => p.id === inv.product_id)!,
      }))
      .filter((inv) => inv.product);
  }

  getInventoryByProduct(productId: string): (Inventory & { location: Location })[] {
    return mockInventory
      .filter((inv) => inv.product_id === productId)
      .map((inv) => ({
        ...inv,
        location: mockLocations.find((l) => l.id === inv.location_id)!,
      }))
      .filter((inv) => inv.location);
  }

  getProductById(productId: string): Product | undefined {
    return mockProducts.find((p) => p.id === productId);
  }

  getLocationById(locationId: string): Location | undefined {
    return mockLocations.find((l) => l.id === locationId);
  }

  recordActivity(activity: Omit<ActivityFeed, 'id' | 'timestamp'>): ActivityFeed {
    const newActivity: ActivityFeed = {
      ...activity,
      id: uuid(),
      timestamp: new Date().toISOString(),
    };
    mockActivityFeed.unshift(newActivity);
    return newActivity;
  }

  updateInventory(productId: string, locationId: string, quantityChange: number): Inventory | null {
    const invIndex = mockInventory.findIndex(
      (inv) => inv.product_id === productId && inv.location_id === locationId
    );
    if (invIndex === -1) return null;

    mockInventory[invIndex].quantity += quantityChange;
    mockInventory[invIndex].updated_at = new Date().toISOString();
    return mockInventory[invIndex];
  }

  transferStock(
    productId: string,
    fromLocationId: string,
    toLocationId: string,
    quantity: number
  ): { success: boolean; message: string } {
    const sourceInv = mockInventory.find(
      (inv) => inv.product_id === productId && inv.location_id === fromLocationId
    );

    if (!sourceInv || sourceInv.quantity < quantity) {
      return { success: false, message: 'Insufficient stock' };
    }

    this.updateInventory(productId, fromLocationId, -quantity);
    const existingTarget = mockInventory.find(
      (inv) => inv.product_id === productId && inv.location_id === toLocationId
    );

    if (existingTarget) {
      this.updateInventory(productId, toLocationId, quantity);
    } else {
      mockInventory.push({
        id: uuid(),
        product_id: productId,
        location_id: toLocationId,
        quantity: quantity,
        updated_at: new Date().toISOString(),
      });
    }

    this.recordActivity({
      org_id: mockOrganization.id,
      type: 'transfer',
      product_id: productId,
      quantity: quantity,
      source_location_id: fromLocationId,
      target_location_id: toLocationId,
      total_amount: 0,
      recorded_by: mockProfiles[0].id,
    });

    return { success: true, message: 'Transfer completed' };
  }

  parseActivityInput(input: string): ParsedActivityInput | null {
    const lowerInput = input.toLowerCase();

    let action: ParsedActivityInput['action'] = 'sale';
    if (lowerInput.includes('sold') || lowerInput.includes('sale')) {
      action = 'sale';
    } else if (lowerInput.includes('restock') || lowerInput.includes('received') || lowerInput.includes('stocked')) {
      action = 'restock';
    } else if (lowerInput.includes('transfer') || lowerInput.includes('moved') || lowerInput.includes('shifted')) {
      action = 'transfer';
    } else if (lowerInput.includes('alert') || lowerInput.includes('anomaly') || lowerInput.includes('stale')) {
      action = 'anomaly';
    }

    const qtyMatch = input.match(/(\d+)\s*(pairs?|pieces?|units?|bags?|sets?|pcs)/i);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

    const amountMatch = input.match(/(\d+)k\b/i) || input.match(/total[:\s]*(\d+)/i);
    let amount = 0;
    if (amountMatch) {
      const numStr = amountMatch[1];
      amount = numStr.includes('k') ? parseInt(numStr, 10) * 1000 : parseInt(numStr, 10);
    }

    const itemPatterns = [
      /sold\s+(\d+\s+)?(pairs?\s+of\s+)?([\w\s]+?)\s+at/i,
      /restock\s+(\d+\s+)?(pairs?\s+of\s+)?([\w\s]+?)\s+at/i,
      /transfer\s+(\d+\s+)?(pairs?\s+of\s+)?([\w\s]+?)\s+from/i,
      /(leather slides|ankara|lace|heels|bags?|jewelry|bracelet|necklace|earrings?)/i,
    ];

    let item = 'Unknown Item';
    for (const pattern of itemPatterns) {
      const match = input.match(pattern);
      if (match) {
        item = match[match.length - 1].trim();
        break;
      }
    }

    const locationMatch = input.match(/(shop\s*\d?|home\s*storage|lekki|victoria\s*island|ikeja)/i);
    const location = locationMatch ? locationMatch[1] : 'Shop 1';

    return { action, item, qty, location, amount };
  }
}

export const supabaseMock = new SupabaseMockService();
export default supabaseMock;
