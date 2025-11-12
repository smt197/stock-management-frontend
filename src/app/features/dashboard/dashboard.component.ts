import { Component, OnInit, signal } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ProductService } from '../../core/services/product.service';
import { StockMovementService } from '../../core/services/stock-movement.service';
import { CategoryService } from '../../core/services/category.service';
import { SaleService } from '../../core/services/sale.service';
import { Product } from '../../shared/models/product.model';
import { StockMovement } from '../../shared/models/stock-movement.model';
import { StockMovementFormComponent } from '../stock-movements/stock-movement-form/stock-movement-form.component';
import { ProductFormComponent } from '../products/product-form/product-form.component';
import { forkJoin } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalValue: number;
  recentMovements: number;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
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
  imports: [SharedModule, RouterModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  stats = signal<DashboardStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    totalValue: 0,
    recentMovements: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
  });

  recentActivities = signal<ActivityItem[]>([]);
  recentMovements = signal<any[]>([]);
  lowStockProducts = signal<Product[]>([]);
  loading = signal(true);

  // Chart configurations
  public readonly doughnutChartType = 'doughnut' as const;
  public doughnutChartData = signal<ChartData<'doughnut'>>({
    labels: ['Stock Normal', 'Stock Bas', 'Rupture de Stock'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
        borderColor: ['#388e3c', '#f57c00', '#d32f2f'],
        borderWidth: 2,
        hoverBackgroundColor: ['#66bb6a', '#ffa726', '#ef5350'],
        hoverBorderWidth: 3,
      },
    ],
  });

  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ${value} produits (${percentage}%)`;
          },
        },
      },
    },
  };

  public readonly barChartType = 'bar' as const;
  public barChartData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [
      {
        label: 'Nombre de produits',
        data: [],
        backgroundColor: '#1976d2',
        borderColor: '#1565c0',
        borderWidth: 1,
        hoverBackgroundColor: '#2196f3',
        borderRadius: 4,
      },
    ],
  });

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.parsed.y} produit(s)`;
          },
        },
      },
    },
  };

  public readonly lineChartType = 'line' as const;
  public lineChartData = signal<ChartData<'line'>>({
    labels: [],
    datasets: [
      {
        label: 'Entrées',
        data: [],
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Sorties',
        data: [],
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  });

  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
  };

  constructor(
    private productService: ProductService,
    private stockMovementService: StockMovementService,
    private categoryService: CategoryService,
    private saleService: SaleService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading.set(true);

    // Pour le dashboard, on charge TOUTES les données (pas de pagination)
    // On utilise une limite très élevée pour récupérer tous les éléments
    const allDataParams = { limit: 10000, page: 1 };

    forkJoin({
      products: this.productService.getAll(allDataParams),
      movements: this.stockMovementService.getAll(allDataParams),
      categories: this.categoryService.getAll(),
      salesStats: this.saleService.getStatistics('today'),
    }).subscribe({
      next: ({ products, movements, categories, salesStats }) => {
        const productsList = products.data;
        const movementsList = movements.data;
        const categoriesList = categories.data || [];

        // Calculate stats using the total from backend (plus précis)
        const totalValue = productsList.reduce((sum, p) => sum + p.unit_price * p.quantity, 0);
        const lowStock = productsList.filter((p) => p.quantity <= p.min_quantity && p.quantity > 0);
        const outOfStock = productsList.filter((p) => p.quantity === 0);
        const normalStock = productsList.filter((p) => p.quantity > p.min_quantity);

        this.stats.set({
          totalProducts: products.total, // Utilise le total du backend
          lowStockProducts: lowStock.length,
          totalValue: totalValue,
          recentMovements: movements.total, // Utilise le total du backend
          totalSales: salesStats.data?.total_sales || 0,
          totalRevenue: salesStats.data?.total_revenue || 0,
          totalProfit: salesStats.data?.total_profit || 0,
        });

        // Update doughnut chart (Stock Status)
        this.doughnutChartData.set({
          labels: ['Stock Normal', 'Stock Bas', 'Rupture de Stock'],
          datasets: [
            {
              data: [normalStock.length, lowStock.length, outOfStock.length],
              backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
              borderColor: ['#388e3c', '#f57c00', '#d32f2f'],
              borderWidth: 2,
              hoverBackgroundColor: ['#66bb6a', '#ffa726', '#ef5350'],
              hoverBorderWidth: 3,
            },
          ],
        });

        // Update bar chart (Products by Category)
        const categoryMap = new Map<string, number>();
        productsList.forEach((product) => {
          const categoryName = product.category?.name || 'Sans catégorie';
          categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
        });

        const categoryLabels = Array.from(categoryMap.keys());
        const categoryData = Array.from(categoryMap.values());

        this.barChartData.set({
          labels: categoryLabels,
          datasets: [
            {
              label: 'Nombre de produits',
              data: categoryData,
              backgroundColor: '#1976d2',
              borderColor: '#1565c0',
              borderWidth: 1,
              hoverBackgroundColor: '#2196f3',
              borderRadius: 4,
            },
          ],
        });

        // Update line chart (Stock Movements over last 7 days)
        const last7Days = this.getLast7Days();
        const entriesData: number[] = [];
        const exitsData: number[] = [];

        last7Days.forEach((day) => {
          const dayMovements = movementsList.filter((m) => {
            const movementDate = new Date(m.created_at || '').toDateString();
            return movementDate === day.date.toDateString();
          });

          const entries = dayMovements
            .filter((m) => m.type === 'in')
            .reduce((sum, m) => sum + m.quantity, 0);
          const exits = dayMovements
            .filter((m) => m.type === 'out')
            .reduce((sum, m) => sum + m.quantity, 0);

          entriesData.push(entries);
          exitsData.push(exits);
        });

        this.lineChartData.set({
          labels: last7Days.map((d) => d.label),
          datasets: [
            {
              label: 'Entrées',
              data: entriesData,
              borderColor: '#4caf50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: 'Sorties',
              data: exitsData,
              borderColor: '#f44336',
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        });

        // Set low stock products
        this.lowStockProducts.set(lowStock.slice(0, 5)); // Top 5 low stock

        // Set recent movements
        const sortedMovements = [...movementsList].sort(
          (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        );

        this.recentMovements.set(
          sortedMovements.slice(0, 5).map((m) => ({
            ...m,
            productName: this.getProductName(m.product_id, productsList),
          }))
        );

        // Build recent activities from movements
        const activities: ActivityItem[] = sortedMovements.slice(0, 4).map((movement) => {
          const product = this.getProductName(movement.product_id, productsList);
          return {
            icon: this.getMovementIcon(movement.type),
            iconClass: this.getMovementClass(movement.type),
            title: this.getMovementTitle(movement.type),
            product: product,
            time: this.getRelativeTime(movement.created_at),
            type: movement.type,
          };
        });

        this.recentActivities.set(activities);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading.set(false);
      },
    });
  }

  getLast7Days(): { date: Date; label: string }[] {
    const days: { date: Date; label: string }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const label =
        i === 0
          ? "Aujourd'hui"
          : i === 1
          ? 'Hier'
          : date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      days.push({ date, label });
    }

    return days;
  }

  getProductName(productId: number, products: Product[]): string {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : `Produit #${productId}`;
  }

  getMovementIcon(type: string): string {
    switch (type) {
      case 'in':
        return 'add_circle';
      case 'out':
        return 'remove_circle';
      case 'adjustment':
        return 'sync';
      default:
        return 'info';
    }
  }

  getMovementClass(type: string): string {
    switch (type) {
      case 'in':
        return 'success';
      case 'out':
        return 'warn';
      case 'adjustment':
        return 'info';
      default:
        return 'primary';
    }
  }

  getMovementTitle(type: string): string {
    switch (type) {
      case 'in':
        return 'Entrée de stock';
      case 'out':
        return 'Sortie de stock';
      case 'adjustment':
        return 'Ajustement de stock';
      default:
        return 'Mouvement';
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

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;

    return then.toLocaleDateString('fr-FR');
  }

  getMovementTypeLabel(type: string): string {
    switch (type) {
      case 'in':
        return 'Entrée';
      case 'out':
        return 'Sortie';
      case 'adjustment':
        return 'Ajustement';
      default:
        return type;
    }
  }

  getMovementTypeColor(type: string): string {
    switch (type) {
      case 'in':
        return 'primary';
      case 'out':
        return 'warn';
      case 'adjustment':
        return 'accent';
      default:
        return '';
    }
  }

  openNewMovementDialog(): void {
    const dialogRef = this.dialog.open(StockMovementFormComponent, {
      width: '600px',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Reload dashboard data after creating a movement
        this.loadDashboardData();
      }
    });
  }

  openNewProductDialog(): void {
    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '1200px',
      maxHeight: '90vh',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadDashboardData();
      }
    });
  }
}
