import { Component, signal, OnInit, computed } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { StockMovementService } from '../../../core/services/stock-movement.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [SharedModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  sidenavOpened = signal(true);
  isDarkTheme = signal(false);
  recentMovementsCount = signal(0);

  menuItems = computed(() => [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard', badge: null, badgeType: null },
    { icon: 'inventory_2', label: 'Produits', route: '/products', badge: null, badgeType: null },
    { icon: 'category', label: 'Catégories', route: '/categories', badge: null, badgeType: null },
    { icon: 'local_shipping', label: 'Fournisseurs', route: '/suppliers', badge: null, badgeType: null },
    {
      icon: 'swap_horiz',
      label: 'Mouvements Stock',
      route: '/stock-movements',
      badge: this.recentMovementsCount() > 0 ? this.recentMovementsCount() : null,
      badgeType: 'warn'
    },
    { icon: 'assessment', label: 'Rapports', route: '/reports', badge: null, badgeType: null },
  ]);

  constructor(private stockMovementService: StockMovementService) {}

  ngOnInit(): void {
    this.loadRecentMovements();
    // Reload every 5 minutes
    setInterval(() => this.loadRecentMovements(), 5 * 60 * 1000);
  }

  loadRecentMovements(): void {
    this.stockMovementService.getAll().subscribe({
      next: (response) => {
        const movements = response.data || [];
        console.log('📊 Total movements loaded:', movements.length);
        console.log('📊 Movements data:', movements);

        // For now, show all movements to test if badge works
        // Later we can filter by date
        const recentCount = movements.length;

        console.log('📊 Setting badge count to:', recentCount);
        this.recentMovementsCount.set(recentCount);
        console.log('📊 Badge count after set:', this.recentMovementsCount());
      },
      error: (error) => {
        console.error('❌ Error loading recent movements:', error);
        this.recentMovementsCount.set(0);
      }
    });
  }

  toggleSidenav() {
    this.sidenavOpened.update(value => !value);
  }

  toggleTheme() {
    this.isDarkTheme.update(value => !value);
    document.body.classList.toggle('dark-theme');
  }
}
