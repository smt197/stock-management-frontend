import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Supplier, SupplierCreateDto, SupplierUpdateDto } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private endpoint = 'suppliers';

  constructor(private apiService: ApiService) {}

  getAll(params?: any): Observable<{ data: Supplier[], total: number }> {
    return this.apiService.get<{ data: Supplier[], total: number }>(this.endpoint, params);
  }

  getById(id: number): Observable<Supplier> {
    return this.apiService.get<Supplier>(`${this.endpoint}/${id}`);
  }

  create(supplier: SupplierCreateDto): Observable<Supplier> {
    return this.apiService.post<Supplier>(this.endpoint, supplier);
  }

  update(id: number, supplier: SupplierUpdateDto): Observable<Supplier> {
    return this.apiService.put<Supplier>(`${this.endpoint}/${id}`, supplier);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }
}
