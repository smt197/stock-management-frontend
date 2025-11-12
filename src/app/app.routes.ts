import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Public routes
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },

  // Protected routes
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
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
            path: ':id',
            loadComponent: () => import('./features/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
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
        path: 'purchase-orders',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/purchase-orders/purchase-order-list/purchase-order-list').then(m => m.PurchaseOrderListComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/purchase-orders/purchase-order-detail/purchase-order-detail').then(m => m.PurchaseOrderDetailComponent)
          }
        ]
      },
      {
        path: 'sales',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/sales/sales-list/sales-list').then(m => m.SalesListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/sales/sale-form/sale-form').then(m => m.SaleFormComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/sales/sale-detail/sale-detail').then(m => m.SaleDetailComponent)
          }
        ]
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/report.component').then(m => m.ReportComponent)
      }
    ]
  },

  // Redirect unknown routes to dashboard
  { path: '**', redirectTo: 'dashboard' }
];
