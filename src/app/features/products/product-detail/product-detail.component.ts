import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ProductFormComponent } from '../product-form/product-form.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Location } from '@angular/common';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product = signal<Product | null>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private location: Location
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(+id);
    } else {
      this.snackBar.open('ID de produit invalide', 'Fermer', { duration: 3000 });
      this.goBack();
    }
  }

  loadProduct(id: number) {
    this.loading.set(true);
    this.productService.getById(id).subscribe({
      next: (response) => {
        this.product.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.snackBar.open('Erreur lors du chargement du produit', 'Fermer', { duration: 3000 });
        this.loading.set(false);
        this.goBack();
      }
    });
  }

  editProduct() {
    const product = this.product();
    if (!product) return;

    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '1200px',
      maxHeight: '90vh',
      data: { mode: 'edit', product }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && product.id) {
        this.loadProduct(product.id);
      }
    });
  }

  deleteProduct() {
    const product = this.product();
    if (!product) return;

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
      if (result && product.id) {
        this.productService.delete(product.id).subscribe({
          next: () => {
            this.snackBar.open('Produit supprimé avec succès', 'Fermer', { duration: 3000 });
            this.router.navigate(['/products']);
          },
          error: (error) => {
            this.snackBar.open('Erreur lors de la suppression du produit', 'Fermer', { duration: 3000 });
          }
        });
      }
    });
  }

  goBack() {
    this.location.back();
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'discontinued': return 'Arrêté';
      default: return status;
    }
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'active': return 'primary';
      case 'inactive': return 'warn';
      case 'discontinued': return 'accent';
      default: return '';
    }
  }

  isLowStock(): boolean {
    const product = this.product();
    return product ? product.quantity <= product.min_quantity : false;
  }

  getImageUrl(): string | null {
    const product = this.product();
    if (!product) return null;

    if (product.image) {
      return `http://localhost:8000/storage/${product.image}`;
    }
    return product.image_url || null;
  }
}
