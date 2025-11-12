import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sale, CreateSaleRequest, SaleStatistics } from '../models/sale.model';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private apiUrl = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer la liste des ventes avec filtres et pagination
   */
  getSales(params?: {
    page?: number;
    limit?: number;
    status?: string;
    payment_status?: string;
    payment_method?: string;
    period?: 'today' | 'week' | 'month';
    date_from?: string;
    date_to?: string;
    search?: string;
  }): Observable<{ success: boolean; data: Sale[]; total: number }> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<{ success: boolean; data: Sale[]; total: number }>(
      this.apiUrl,
      { params: httpParams }
    );
  }

  /**
   * Récupérer les détails d'une vente
   */
  getSale(id: number): Observable<{ success: boolean; data: Sale }> {
    return this.http.get<{ success: boolean; data: Sale }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Créer une nouvelle vente
   */
  createSale(data: CreateSaleRequest): Observable<{ success: boolean; message: string; data: Sale }> {
    return this.http.post<{ success: boolean; message: string; data: Sale }>(
      this.apiUrl,
      data
    );
  }

  /**
   * Annuler une vente (admin uniquement)
   */
  cancelSale(id: number): Observable<{ success: boolean; message: string; data: Sale }> {
    return this.http.post<{ success: boolean; message: string; data: Sale }>(
      `${this.apiUrl}/${id}/cancel`,
      {}
    );
  }

  /**
   * Récupérer les statistiques des ventes
   */
  getStatistics(period: 'today' | 'week' | 'month' = 'today'): Observable<{ success: boolean; data: SaleStatistics }> {
    return this.http.get<{ success: boolean; data: SaleStatistics }>(
      `${this.apiUrl}/statistics`,
      { params: { period } }
    );
  }
}
