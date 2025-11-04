export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  contact_person?: string;
  status: 'active' | 'inactive';
  created_at?: Date;
  updated_at?: Date;
}

export interface SupplierCreateDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  contact_person?: string;
  status: 'active' | 'inactive';
}

export interface SupplierUpdateDto extends Partial<SupplierCreateDto> {
  id: number;
}
