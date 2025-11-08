import { Component, signal, OnInit, computed } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { StockMovementService } from '../../../core/services/stock-movement.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../models';

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
  currentUser = signal<User | null>(null);

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

  constructor(
    private stockMovementService: StockMovementService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadRecentMovements();
    this.loadCurrentUser();
    // Reload every 5 minutes
    setInterval(() => this.loadRecentMovements(), 5 * 60 * 1000);
  }

  loadCurrentUser(): void {
    const user = this.authService.getUser();
    this.currentUser.set(user);
  }

  loadRecentMovements(): void {
    // Pour le badge, on charge seulement les mouvements récents (dernières 24h)
    // Mais on peut aussi utiliser juste le total du backend
    const params = { limit: 10, page: 1 }; // On charge juste les 10 derniers pour optimiser

    this.stockMovementService.getAll(params).subscribe({
      next: (response) => {
        // Utilise le total du backend au lieu du nombre d'éléments chargés
        const recentCount = response.total || 0;
        this.recentMovementsCount.set(recentCount);
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

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        // La navigation est gérée dans le service auth
      },
      error: (error) => {
        console.error('Erreur lors de la déconnexion:', error);
        // Même en cas d'erreur, on déconnecte côté client
        this.authService['clearAuthData']();
      }
    });
  }
}
