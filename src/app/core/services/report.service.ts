import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  /**
   * Rapport des ventes par période
   */
  getSalesReport(params?: {
    period?: 'today' | 'week' | 'month';
    date_from?: string;
    date_to?: string;
  }): Observable<any> {
    return this.http.get(`${this.apiUrl}/sales`, { params: this.buildParams(params) });
  }

  /**
   * Top produits vendus
   */
  getTopProducts(params?: {
    limit?: number;
    period?: 'today' | 'week' | 'month';
    date_from?: string;
    date_to?: string;
  }): Observable<any> {
    return this.http.get(`${this.apiUrl}/top-products`, { params: this.buildParams(params) });
  }

  /**
   * Rapport de stock faible
   */
  getLowStockReport(params?: {
    category_id?: number;
  }): Observable<any> {
    return this.http.get(`${this.apiUrl}/low-stock`, { params: this.buildParams(params) });
  }

  /**
   * Rapport de rentabilité
   */
  getProfitReport(params?: {
    period?: 'today' | 'week' | 'month';
    date_from?: string;
    date_to?: string;
  }): Observable<any> {
    return this.http.get(`${this.apiUrl}/profit`, { params: this.buildParams(params) });
  }

  /**
   * Valeur du stock
   */
  getInventoryValue(params?: {
    category_id?: number;
  }): Observable<any> {
    return this.http.get(`${this.apiUrl}/inventory-value`, { params: this.buildParams(params) });
  }

  /**
   * Ventes par catégorie
   */
  getSalesByCategory(params?: {
    date_from?: string;
    date_to?: string;
  }): Observable<any> {
    return this.http.get(`${this.apiUrl}/sales-by-category`, { params: this.buildParams(params) });
  }

  private buildParams(params?: any): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return httpParams;
  }
}
