import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SaleService } from '../../../core/services/sale.service';
import { Sale } from '../../../core/models/sale.model';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './sale-detail.html',
  styleUrls: ['./sale-detail.scss']
})
export class SaleDetailComponent implements OnInit {
  sale: Sale | null = null;
  loading = true;
  displayedColumns: string[] = ['product_name', 'unit_price', 'quantity', 'subtotal', 'profit'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private saleService: SaleService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSale(+id);
    }
  }

  loadSale(id: number): void {
    this.loading = true;
    this.saleService.getSale(id).subscribe({
      next: (response) => {
        this.sale = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la vente:', error);
        this.snackBar.open('Erreur lors du chargement de la vente', 'Fermer', {
          duration: 3000
        });
        this.loading = false;
        this.router.navigate(['/sales']);
      }
    });
  }

  cancelSale(): void {
    if (!this.sale) return;

    if (confirm(`Êtes-vous sûr de vouloir annuler la vente ${this.sale.sale_number} ? Le stock sera remis.`)) {
      this.saleService.cancelSale(this.sale.id).subscribe({
        next: (response) => {
          this.snackBar.open(response.message, 'Fermer', { duration: 3000 });
          this.loadSale(this.sale!.id); // Reload to show updated status
        },
        error: (error) => {
          const message = error.error?.message || 'Erreur lors de l\'annulation';
          this.snackBar.open(message, 'Fermer', { duration: 5000 });
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/sales']);
  }

  getPaymentMethodLabel(method: string): string {
    const labels: any = {
      'cash': 'Espèces',
      'mobile_money': 'Mobile Money',
      'card': 'Carte Bancaire',
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

  canCancel(): boolean {
    return this.sale?.status === 'completed';
  }

  formatDate(date: string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getItemProfit(item: any): number {
    return (item.unit_price - item.cost_price) * item.quantity;
  }

  getItemMargin(item: any): number {
    if (item.unit_price === 0) return 0;
    return ((item.unit_price - item.cost_price) / item.unit_price) * 100;
  }

  getTotalQuantity(items: any[]): number {
    if (!items) return 0;
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
