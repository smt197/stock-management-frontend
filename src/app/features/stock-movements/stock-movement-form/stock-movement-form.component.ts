import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { StockMovementService } from '../../../core/services/stock-movement.service';
import { ProductService } from '../../../core/services/product.service';
import { StockMovementCreateDto } from '../../../shared/models/stock-movement.model';
import { Product } from '../../../shared/models/product.model';

@Component({
  selector: 'app-stock-movement-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatIconModule
  ],
  templateUrl: './stock-movement-form.component.html',
  styleUrl: './stock-movement-form.component.scss',
})
export class StockMovementFormComponent implements OnInit {
  movementForm: FormGroup;
  products: Product[] = [];
  loading: boolean = false;
  movementTypes = [
    { value: 'in', label: 'Entrée', icon: 'arrow_downward' },
    { value: 'out', label: 'Sortie', icon: 'arrow_upward' },
    { value: 'adjustment', label: 'Ajustement', icon: 'sync' }
  ];

  constructor(
    private fb: FormBuilder,
    private stockMovementService: StockMovementService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<StockMovementFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' }
  ) {
    this.movementForm = this.fb.group({
      product_id: [null, Validators.required],
      type: ['in', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      reference: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (response: any) => {
        this.products = response.data || [];
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.snackBar.open('Erreur lors du chargement des produits', 'Fermer', { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.movementForm.invalid) {
      return;
    }

    this.loading = true;
    const formValue: StockMovementCreateDto = this.movementForm.value;

    this.stockMovementService.create(formValue).subscribe({
      next: () => {
        this.snackBar.open('Mouvement de stock créé avec succès', 'Fermer', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error creating stock movement:', error);
        this.snackBar.open('Erreur lors de la création du mouvement', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getProductStock(productId: number): number {
    const product = this.products.find(p => p.id === productId);
    return product ? product.quantity : 0;
  }

  getSelectedProduct(): Product | undefined {
    const productId = this.movementForm.get('product_id')?.value;
    return this.products.find(p => p.id === productId);
  }
}
