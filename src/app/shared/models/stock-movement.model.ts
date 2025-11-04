export interface StockMovement {
  id: number;
  product_id: number;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference?: string;
  notes?: string;
  user_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface StockMovementCreateDto {
  product_id: number;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference?: string;
  notes?: string;
}

export interface StockMovementUpdateDto extends Partial<StockMovementCreateDto> {
  id: number;
}
