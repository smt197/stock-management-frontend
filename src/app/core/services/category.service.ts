import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Category, CategoryCreateDto, CategoryUpdateDto } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private endpoint = 'categories';

  constructor(private apiService: ApiService) {}

  getAll(params?: any): Observable<{ data: Category[], total: number }> {
    return this.apiService.get<{ data: Category[], total: number }>(this.endpoint, params);
  }

  getById(id: number): Observable<Category> {
    return this.apiService.get<Category>(`${this.endpoint}/${id}`);
  }

  create(category: CategoryCreateDto): Observable<Category> {
    return this.apiService.post<Category>(this.endpoint, category);
  }

  update(id: number, category: CategoryUpdateDto): Observable<Category> {
    return this.apiService.put<Category>(`${this.endpoint}/${id}`, category);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }
}
