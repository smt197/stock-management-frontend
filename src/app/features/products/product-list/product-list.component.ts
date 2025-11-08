import { Component, OnInit, AfterViewInit, signal, ViewChild } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { RouterModule, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ProductFormComponent } from '../product-form/product-form.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [SharedModule, RouterModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['sku', 'name', 'category', 'quantity', 'unit_price', 'status', 'actions'];
  dataSource = new MatTableDataSource<Product>([]);
  totalRecords = signal(0);
  loading = signal(true);

  pageIndex = 0;
  pageSize = 10;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productService: ProductService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  ngAfterViewInit() {
    // Pagination côté serveur - on ne lie pas le paginator au dataSource
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }

    // Écouter les changements de pagination avec un délai pour s'assurer que le paginator est initialisé
    setTimeout(() => {
      if (this.paginator) {
        this.paginator.page.subscribe((event) => {
          this.pageIndex = this.paginator.pageIndex;
          this.pageSize = this.paginator.pageSize;
          this.loadProducts();
        });
      } else {
        console.error('Paginator is not available');
      }
    }, 0);
  }

  loadProducts() {
    this.loading.set(true);
    const params = {
      page: this.pageIndex + 1, // Backend utilise généralement page 1-based
      limit: this.pageSize
    };
    this.productService.getAll(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalRecords.set(response.total);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.snackBar.open('Erreur lors du chargement des produits', 'Fermer', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addProduct() {
    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProducts();
      }
    });
  }

  editProduct(product: Product) {
    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { mode: 'edit', product }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProducts();
      }
    });
  }

  viewProduct(product: Product) {
    this.router.navigate(['/products', product.id]);
  }

  deleteProduct(product: Product) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le produit',
        message: `Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productService.delete(product.id).subscribe({
          next: () => {
            this.snackBar.open('Produit supprimé avec succès', 'Fermer', { duration: 3000 });
            this.loadProducts();
          },
          error: (error) => {
            this.snackBar.open('Erreur lors de la suppression du produit', 'Fermer', { duration: 3000 });
          }
        });
      }
    });
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'active': return 'primary';
      case 'inactive': return 'warn';
      case 'discontinued': return 'accent';
      default: return '';
    }
  }
}
