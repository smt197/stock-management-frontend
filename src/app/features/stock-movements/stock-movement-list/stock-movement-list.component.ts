import { Component, OnInit, AfterViewInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StockMovementService } from '../../../core/services/stock-movement.service';
import { ProductService } from '../../../core/services/product.service';
import { StockMovement } from '../../../shared/models/stock-movement.model';
import { Product } from '../../../shared/models/product.model';
import { StockMovementFormComponent } from '../stock-movement-form/stock-movement-form.component';

@Component({
  selector: 'app-stock-movement-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './stock-movement-list.component.html',
  styleUrl: './stock-movement-list.component.scss',
})
export class StockMovementListComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['id', 'date', 'product', 'type', 'quantity', 'reference', 'notes'];
  loading = signal(false);
  totalRecords = signal(0);
  products: Product[] = [];

  pageIndex = 0;
  pageSize = 10;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private stockMovementService: StockMovementService,
    private productService: ProductService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadMovements();
  }

  ngAfterViewInit(): void {
    // Pagination côté serveur - on ne lie pas le paginator au dataSource
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }

    // Écouter les changements de pagination avec un délai pour s'assurer que le paginator est initialisé
    setTimeout(() => {
      if (this.paginator) {
        this.paginator.page.subscribe(() => {
          this.pageIndex = this.paginator.pageIndex;
          this.pageSize = this.paginator.pageSize;
          this.loadMovements();
        });
      }
    }, 0);
  }

  loadMovements(): void {
    this.loading.set(true);
    const params = {
      page: this.pageIndex + 1,
      limit: this.pageSize
    };

    this.stockMovementService.getAll(params).subscribe({
      next: (response: any) => {
        const movements = response.data || [];
        // Combine movements with product info
        this.dataSource.data = movements.map((movement: StockMovement) => ({
          ...movement,
          productName: this.getProductName(movement.product_id)
        }));
        this.totalRecords.set(response.total);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading stock movements:', error);
        this.snackBar.open('Erreur lors du chargement des mouvements', 'Fermer', {
          duration: 3000
        });
        this.loading.set(false);
      }
    });
  }

  loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (response: any) => {
        this.products = response.data || [];
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  getProductName(productId: number): string {
    const product = this.products.find(p => p.id === productId);
    return product ? product.name : `Produit #${productId}`;
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(StockMovementFormComponent, {
      width: '600px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMovements();
        this.loadProducts(); // Reload products to update quantities
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getTypeLabel(type: string): string {
    switch(type) {
      case 'in': return 'Entrée';
      case 'out': return 'Sortie';
      case 'adjustment': return 'Ajustement';
      default: return type;
    }
  }

  getTypeColor(type: string): string {
    switch(type) {
      case 'in': return 'primary';
      case 'out': return 'warn';
      case 'adjustment': return 'accent';
      default: return '';
    }
  }

  getTypeIcon(type: string): string {
    switch(type) {
      case 'in': return 'arrow_downward';
      case 'out': return 'arrow_upward';
      case 'adjustment': return 'sync';
      default: return 'help';
    }
  }
}
