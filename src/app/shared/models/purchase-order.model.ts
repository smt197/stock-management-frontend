import { Product } from './product.model';
import { Supplier } from './supplier.model';

export interface PurchaseOrderItem {
  id?: number;
  purchase_order_id?: number;
  product_id: number;
  product?: Product;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  total_price: number;
  remaining_quantity?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseOrder {
  id?: number;
  reference: string;
  supplier_id: number;
  supplier?: Supplier;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  status: 'pending' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';
  total_amount: number;
  notes?: string;
  items: PurchaseOrderItem[];
  created_at?: string;
  updated_at?: string;
}

export interface ReceiveItemData {
  item_id: number;
  quantity_received: number;
}

export interface ReceivePurchaseOrderRequest {
  items: ReceiveItemData[];
  actual_delivery_date?: string;
}
