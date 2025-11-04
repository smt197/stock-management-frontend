import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'products',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent)
          }
        ]
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/category-list/category-list').then(m => m.CategoryList)
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./features/suppliers/supplier-list/supplier-list').then(m => m.SupplierList)
      },
      {
        path: 'stock-movements',
        loadComponent: () => import('./features/stock-movements/stock-movement-list/stock-movement-list.component').then(m => m.StockMovementListComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) // Placeholder
      }
    ]
  }
];
