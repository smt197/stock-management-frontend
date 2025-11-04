import { Component, OnInit, signal } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ProductService } from '../../core/services/product.service';
import { StockMovementService } from '../../core/services/stock-movement.service';
import { Product } from '../../shared/models/product.model';
import { StockMovement } from '../../shared/models/stock-movement.model';
import { StockMovementFormComponent } from '../stock-movements/stock-movement-form/stock-movement-form.component';
import { forkJoin } from 'rxjs';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalValue: number;
  recentMovements: number;
}

interface ActivityItem {
  icon: string;
  iconClass: string;
  title: string;
  product: string;
  time: string;
  type: 'in' | 'out' | 'adjustment' | 'update';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats = signal<DashboardStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    totalValue: 0,
    recentMovements: 0
  });

  recentActivities = signal<ActivityItem[]>([]);
  recentMovements = signal<any[]>([]);
  lowStockProducts = signal<Product[]>([]);
  loading = signal(true);

  constructor(
    private productService: ProductService,
    private stockMovementService: StockMovementService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading.set(true);

    forkJoin({
      products: this.productService.getAll(),
      movements: this.stockMovementService.getAll()
    }).subscribe({
      next: ({ products, movements }) => {
        const productsList = products.data;
        const movementsList = movements.data;

        // Calculate stats
        const totalValue = productsList.reduce((sum, p) => sum + (p.unit_price * p.quantity), 0);
        const lowStock = productsList.filter(p => p.quantity <= p.min_quantity);

        this.stats.set({
          totalProducts: productsList.length,
          lowStockProducts: lowStock.length,
          totalValue: totalValue,
          recentMovements: movementsList.length
        });

        // Set low stock products
        this.lowStockProducts.set(lowStock.slice(0, 5)); // Top 5 low stock

        // Set recent movements
        const sortedMovements = [...movementsList].sort((a, b) =>
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        );

        this.recentMovements.set(sortedMovements.slice(0, 5).map(m => ({
          ...m,
          productName: this.getProductName(m.product_id, productsList)
        })));

        // Build recent activities from movements
        const activities: ActivityItem[] = sortedMovements.slice(0, 4).map(movement => {
          const product = this.getProductName(movement.product_id, productsList);
          return {
            icon: this.getMovementIcon(movement.type),
            iconClass: this.getMovementClass(movement.type),
            title: this.getMovementTitle(movement.type),
            product: product,
            time: this.getRelativeTime(movement.created_at),
            type: movement.type
          };
        });

        this.recentActivities.set(activities);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading.set(false);
      }
    });
  }

  getProductName(productId: number, products: Product[]): string {
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Produit #${productId}`;
  }

  getMovementIcon(type: string): string {
    switch(type) {
      case 'in': return 'add_circle';
      case 'out': return 'remove_circle';
      case 'adjustment': return 'sync';
      default: return 'info';
    }
  }

  getMovementClass(type: string): string {
    switch(type) {
      case 'in': return 'success';
      case 'out': return 'warn';
      case 'adjustment': return 'info';
      default: return 'primary';
    }
  }

  getMovementTitle(type: string): string {
    switch(type) {
      case 'in': return 'Entrée de stock';
      case 'out': return 'Sortie de stock';
      case 'adjustment': return 'Ajustement de stock';
      default: return 'Mouvement';
    }
  }

  getRelativeTime(date: any): string {
    if (!date) return 'Date inconnue';

    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;

    return then.toLocaleDateString('fr-FR');
  }

  getMovementTypeLabel(type: string): string {
    switch(type) {
      case 'in': return 'Entrée';
      case 'out': return 'Sortie';
      case 'adjustment': return 'Ajustement';
      default: return type;
    }
  }

  getMovementTypeColor(type: string): string {
    switch(type) {
      case 'in': return 'primary';
      case 'out': return 'warn';
      case 'adjustment': return 'accent';
      default: return '';
    }
  }

  openNewMovementDialog(): void {
    const dialogRef = this.dialog.open(StockMovementFormComponent, {
      width: '600px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Reload dashboard data after creating a movement
        this.loadDashboardData();
      }
    });
  }
}
