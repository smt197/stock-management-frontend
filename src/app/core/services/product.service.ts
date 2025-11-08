import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Product, ProductCreateDto, ProductUpdateDto } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private endpoint = 'products';

  constructor(private apiService: ApiService) {}

  getAll(params?: any): Observable<{ data: Product[], total: number }> {
    return this.apiService.get<{ data: Product[], total: number }>(this.endpoint, params);
  }

  getById(id: number): Observable<{ success: boolean, data: Product }> {
    return this.apiService.get<{ success: boolean, data: Product }>(`${this.endpoint}/${id}`);
  }

  create(product: ProductCreateDto | FormData): Observable<{ success: boolean, message: string, data: Product }> {
    return this.apiService.post<{ success: boolean, message: string, data: Product }>(this.endpoint, product);
  }

  update(id: number, product: ProductUpdateDto | FormData): Observable<{ success: boolean, message: string, data: Product }> {
    // Use POST for updates with FormData to support method spoofing (_method: 'PUT')
    return this.apiService.post<{ success: boolean, message: string, data: Product }>(`${this.endpoint}/${id}`, product);
  }

  delete(id: number): Observable<{ success: boolean, message: string }> {
    return this.apiService.delete<{ success: boolean, message: string }>(`${this.endpoint}/${id}`);
  }

  getLowStock(): Observable<Product[]> {
    return this.apiService.get<Product[]>(`${this.endpoint}/low-stock`);
  }
}
