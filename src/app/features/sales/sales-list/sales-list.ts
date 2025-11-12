import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { SaleService } from '../../../core/services/sale.service';
import { Sale } from '../../../core/models/sale.model';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    MatCardModule,
    FormsModule,
  ],
  templateUrl: './sales-list.html',
  styleUrls: ['./sales-list.scss']
})
export class SalesListComponent implements OnInit {
  sales: Sale[] = [];
  displayedColumns: string[] = [
    'sale_number',
    'customer_name',
    'sale_date',
    'total_amount',
    'profit',
    'payment_method',
    'payment_status',
    'status',
    'actions'
  ];

  // Pagination
  totalSales = 0;
  pageSize = 10;
  pageIndex = 0;

  // Filtres
  filters = {
    search: '',
    status: '',
    payment_status: '',
    payment_method: '',
    period: ''
  };

  loading = false;

  constructor(
    private saleService: SaleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSales();
  }

  loadSales(): void {
    this.loading = true;

    const params: any = {
      page: this.pageIndex + 1,
      limit: this.pageSize,
    };

    // Ajouter les filtres
    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.status) params.status = this.filters.status;
    if (this.filters.payment_status) params.payment_status = this.filters.payment_status;
    if (this.filters.payment_method) params.payment_method = this.filters.payment_method;
    if (this.filters.period) params.period = this.filters.period;

    this.saleService.getSales(params).subscribe({
      next: (response) => {
        this.sales = response.data;
        this.totalSales = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des ventes:', error);
        this.snackBar.open('Erreur lors du chargement des ventes', 'Fermer', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadSales();
  }

  applyFilters(): void {
    this.pageIndex = 0; // Reset to first page
    this.loadSales();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: '',
      payment_status: '',
      payment_method: '',
      period: ''
    };
    this.applyFilters();
  }

  viewSale(sale: Sale): void {
    this.router.navigate(['/sales', sale.id]);
  }

  createSale(): void {
    this.router.navigate(['/sales/new']);
  }

  cancelSale(sale: Sale): void {
    if (confirm(`Êtes-vous sûr de vouloir annuler la vente ${sale.sale_number} ? Le stock sera remis.`)) {
      this.saleService.cancelSale(sale.id).subscribe({
        next: (response) => {
          this.snackBar.open(response.message, 'Fermer', { duration: 3000 });
          this.loadSales();
        },
        error: (error) => {
          const message = error.error?.message || 'Erreur lors de l\'annulation';
          this.snackBar.open(message, 'Fermer', { duration: 5000 });
        }
      });
    }
  }

  getPaymentMethodLabel(method: string): string {
    const labels: any = {
      'cash': 'Espèces',
      'mobile_money': 'Mobile Money',
      'card': 'Carte',
      'credit': 'Crédit'
    };
    return labels[method] || method;
  }

  getPaymentStatusLabel(status: string): string {
    const labels: any = {
      'paid': 'Payé',
      'pending': 'En attente',
      'partial': 'Partiel'
    };
    return labels[status] || status;
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'completed': 'Complétée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    return status === 'completed' ? 'primary' : 'warn';
  }

  getPaymentStatusColor(status: string): string {
    const colors: any = {
      'paid': 'primary',
      'pending': 'warn',
      'partial': 'accent'
    };
    return colors[status] || 'basic';
  }
}
