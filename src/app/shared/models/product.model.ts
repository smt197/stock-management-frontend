import { Category } from './category.model';
import { Supplier } from './supplier.model';

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category_id: number;
  category?: Category;
  supplier_id?: number;
  supplier?: Supplier;
  unit_price: number;
  cost_price: number;
  quantity: number;
  min_quantity: number;
  max_quantity?: number;
  image?: string;
  image_url?: string;
  status: 'active' | 'inactive' | 'discontinued';
  created_at?: Date;
  updated_at?: Date;
}

export interface ProductCreateDto {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category_id: number;
  supplier_id?: number;
  unit_price: number;
  cost_price: number;
  quantity: number;
  min_quantity: number;
  max_quantity?: number;
  image_url?: string;
  status: 'active' | 'inactive' | 'discontinued';
}

export interface ProductUpdateDto extends Partial<ProductCreateDto> {
  id: number;
}
