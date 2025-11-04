import { Component, signal } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [SharedModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  sidenavOpened = signal(true);
  isDarkTheme = signal(false);

  menuItems = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard', badge: null, badgeType: null },
    { icon: 'inventory_2', label: 'Produits', route: '/products', badge: null, badgeType: null },
    { icon: 'category', label: 'Catégories', route: '/categories', badge: null, badgeType: null },
    { icon: 'local_shipping', label: 'Fournisseurs', route: '/suppliers', badge: null, badgeType: null },
    { icon: 'swap_horiz', label: 'Mouvements Stock', route: '/stock-movements', badge: null, badgeType: null },
    { icon: 'assessment', label: 'Rapports', route: '/reports', badge: null, badgeType: null },
  ];

  toggleSidenav() {
    this.sidenavOpened.update(value => !value);
  }

  toggleTheme() {
    this.isDarkTheme.update(value => !value);
    document.body.classList.toggle('dark-theme');
  }
}
