import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { StockMovement, StockMovementCreateDto } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class StockMovementService {
  private endpoint = 'stock-movements';

  constructor(private apiService: ApiService) {}

  getAll(params?: any): Observable<{ data: StockMovement[], total: number }> {
    return this.apiService.get<{ data: StockMovement[], total: number }>(this.endpoint, params);
  }

  getById(id: number): Observable<StockMovement> {
    return this.apiService.get<StockMovement>(`${this.endpoint}/${id}`);
  }

  create(movement: StockMovementCreateDto): Observable<StockMovement> {
    return this.apiService.post<StockMovement>(this.endpoint, movement);
  }

  getByProduct(productId: number): Observable<StockMovement[]> {
    return this.apiService.get<StockMovement[]>(`${this.endpoint}/product/${productId}`);
  }
}
