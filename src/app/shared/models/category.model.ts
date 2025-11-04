export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  parent?: Category;
  children?: Category[];
  products?: any[];
  status: 'active' | 'inactive';
  created_at?: Date;
  updated_at?: Date;
}

export interface CategoryCreateDto {
  name: string;
  description?: string;
  parent_id?: number;
  status: 'active' | 'inactive';
}

export interface CategoryUpdateDto extends Partial<CategoryCreateDto> {
  id: number;
}
