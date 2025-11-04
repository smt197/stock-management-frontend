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

  getById(id: number): Observable<Product> {
    return this.apiService.get<Product>(`${this.endpoint}/${id}`);
  }

  create(product: ProductCreateDto): Observable<Product> {
    return this.apiService.post<Product>(this.endpoint, product);
  }

  update(id: number, product: ProductUpdateDto): Observable<Product> {
    return this.apiService.put<Product>(`${this.endpoint}/${id}`, product);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  getLowStock(): Observable<Product[]> {
    return this.apiService.get<Product[]>(`${this.endpoint}/low-stock`);
  }
}
