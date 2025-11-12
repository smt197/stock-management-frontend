export interface Sale {
  id: number;
  sale_number: string;
  customer_name?: string;
  customer_phone?: string;
  total_amount: number;
  payment_method: 'cash' | 'mobile_money' | 'card' | 'credit';
  payment_status: 'paid' | 'pending' | 'partial';
  amount_paid: number;
  amount_due: number;
  notes?: string;
  user_id: number;
  sale_date: string;
  status: 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;

  // Relations
  items?: SaleItem[];
  user?: any;

  // Computed properties
  total_profit?: number;
  total_margin_percentage?: number;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  subtotal: number;
  created_at: string;
  updated_at: string;

  // Relations
  product?: any;

  // Computed properties
  profit?: number;
  margin_percentage?: number;
}

export interface CreateSaleRequest {
  customer_name?: string;
  customer_phone?: string;
  payment_method: 'cash' | 'mobile_money' | 'card' | 'credit';
  payment_status: 'paid' | 'pending' | 'partial';
  amount_paid: number;
  notes?: string;
  items: CreateSaleItemRequest[];
}

export interface CreateSaleItemRequest {
  product_id: number;
  quantity: number;
}

export interface SaleStatistics {
  total_sales: number;
  total_revenue: number;
  total_profit: number;
  average_sale: number;
}
