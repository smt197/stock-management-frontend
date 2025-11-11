import { Component, OnInit, AfterViewInit, OnDestroy, signal, ViewChild } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { RouterModule, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ProductFormComponent } from '../product-form/product-form.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [SharedModule, RouterModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = [
    'image',
    'sku',
    'name',
    'category',
    'quantity',
    'unit_price',
    'status',
    'actions',
  ];
  dataSource = new MatTableDataSource<Product>([]);
  totalRecords = signal(0);
  loading = signal(true);

  pageIndex = 0;
  pageSize = 10;
  searchTerm = '';
  private searchSubject = new Subject<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productService: ProductService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadProducts();

    // Écouter les changements de recherche avec debounce
    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe((searchTerm) => {
        this.searchTerm = searchTerm;
        this.pageIndex = 0; // Réinitialiser à la première page lors d'une recherche
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadProducts();
      });
  }

  ngAfterViewInit() {
    // Pagination côté serveur - on ne lie pas le paginator au dataSource
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }

    // Écouter les changements de pagination
    setTimeout(() => {
      if (this.paginator) {
        this.paginator.page.subscribe((event: PageEvent) => {
          this.pageIndex = event.pageIndex;
          this.pageSize = event.pageSize;
          this.loadProducts();
        });
      }
    }, 0);
  }

  loadProducts() {
    this.loading.set(true);
    const params: any = {
      page: this.pageIndex + 1, // Backend utilise généralement page 1-based
      limit: this.pageSize,
    };

    // Ajouter le terme de recherche s'il existe
    if (this.searchTerm && this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

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
      },
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue);
  }

  addProduct() {
    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadProducts();
      }
    });
  }

  editProduct(product: Product) {
    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { mode: 'edit', product },
    });

    dialogRef.afterClosed().subscribe((result) => {
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
        type: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.productService.delete(product.id).subscribe({
          next: () => {
            this.snackBar.open('Produit supprimé avec succès', 'Fermer', { duration: 3000 });
            this.loadProducts();
          },
          error: (error) => {
            this.snackBar.open('Erreur lors de la suppression du produit', 'Fermer', {
              duration: 3000,
            });
          },
        });
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'primary';
      case 'inactive':
        return 'warn';
      case 'discontinued':
        return 'accent';
      default:
        return '';
    }
  }

  getImageUrl(product: Product): string | null {
    if (product.image) {
      return `http://localhost:8000/storage/${product.image}`;
    }
    return product.image_url || null;
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }
}
