import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PurchaseOrder, ReceivePurchaseOrderRequest } from '../../shared/models';

export interface PurchaseOrderListParams {
  page?: number;
  limit?: number;
  status?: string;
  supplier_id?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  private apiUrl = `${environment.apiUrl}/purchase-orders`;

  constructor(private http: HttpClient) {}

  /**
   * Get all purchase orders with optional filters
   */
  getAll(params?: PurchaseOrderListParams): Observable<ApiResponse<PurchaseOrder[]>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof PurchaseOrderListParams];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<PurchaseOrder[]>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Get a single purchase order by ID
   */
  getById(id: number): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.get<ApiResponse<PurchaseOrder>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new purchase order
   */
  create(purchaseOrder: Partial<PurchaseOrder>): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(this.apiUrl, purchaseOrder);
  }

  /**
   * Update an existing purchase order
   */
  update(id: number, purchaseOrder: Partial<PurchaseOrder>): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.put<ApiResponse<PurchaseOrder>>(`${this.apiUrl}/${id}`, purchaseOrder);
  }

  /**
   * Delete a purchase order
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Receive items from a purchase order (partial or full reception)
   */
  receive(id: number, data: ReceivePurchaseOrderRequest): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(`${this.apiUrl}/${id}/receive`, data);
  }

  /**
   * Get status label in French
   */
  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'partially_received': 'Partiellement reçue',
      'received': 'Reçue',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  }

  /**
   * Get status color for Material chips
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': 'accent',
      'confirmed': 'primary',
      'partially_received': 'warn',
      'received': 'primary',
      'cancelled': ''
    };
    return colors[status] || '';
  }
}
