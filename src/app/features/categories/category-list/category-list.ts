import { Component, OnInit, ViewChild, AfterViewInit, signal } from '@angular/core';
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
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../shared/models/category.model';
import { CategoryForm } from '../category-form/category-form';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-category-list',
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
    MatPaginatorModule
  ],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
})
export class CategoryList implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<Category>([]);
  displayedColumns: string[] = ['id', 'name', 'description', 'parent', 'status', 'actions'];
  loading = signal(false);
  totalRecords = signal(0);

  pageIndex = 0;
  pageSize = 10;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    // Pagination côté serveur - on ne lie pas le paginator au dataSource
    // Écouter les changements de pagination avec un délai pour s'assurer que le paginator est initialisé
    setTimeout(() => {
      if (this.paginator) {
        this.paginator.page.subscribe(() => {
          this.pageIndex = this.paginator.pageIndex;
          this.pageSize = this.paginator.pageSize;
          this.loadCategories();
        });
      }
    }, 0);
  }

  loadCategories(): void {
    this.loading.set(true);
    const params = {
      page: this.pageIndex + 1,
      limit: this.pageSize
    };

    this.categoryService.getAll(params).subscribe({
      next: (response: any) => {
        this.dataSource.data = response.data || [];
        this.totalRecords.set(response.total);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.snackBar.open('Erreur lors du chargement des catégories', 'Fermer', {
          duration: 3000
        });
        this.loading.set(false);
      }
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(CategoryForm, {
      width: '600px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  openEditDialog(category: Category): void {
    const dialogRef = this.dialog.open(CategoryForm, {
      width: '600px',
      data: { mode: 'edit', category }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  deleteCategory(category: Category): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer la catégorie',
        message: `Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categoryService.delete(category.id).subscribe({
          next: () => {
            this.snackBar.open('Catégorie supprimée avec succès', 'Fermer', {
              duration: 3000
            });
            this.loadCategories();
          },
          error: (error) => {
            console.error('Error deleting category:', error);
            this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
              duration: 3000
            });
          }
        });
      }
    });
  }
}
