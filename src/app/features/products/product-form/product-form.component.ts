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
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { Product, ProductCreateDto, ProductUpdateDto } from '../../../shared/models/product.model';
import { Category } from '../../../shared/models/category.model';
import { Supplier } from '../../../shared/models/supplier.model';

@Component({
  selector: 'app-product-form',
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
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEditMode: boolean = false;
  categories: Category[] = [];
  suppliers: Supplier[] = [];
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ProductFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit', product?: Product }
  ) {
    this.isEditMode = data.mode === 'edit';
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      sku: ['', [Validators.required, Validators.maxLength(50)]],
      barcode: [''],
      category_id: [null, Validators.required],
      supplier_id: [null],
      unit_price: [0, [Validators.required, Validators.min(0)]],
      cost_price: [0, [Validators.required, Validators.min(0)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      min_quantity: [0, [Validators.required, Validators.min(0)]],
      max_quantity: [null],
      image_url: [''],
      status: ['active', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadSuppliers();

    if (this.isEditMode && this.data.product) {
      this.productForm.patchValue({
        name: this.data.product.name,
        description: this.data.product.description,
        sku: this.data.product.sku,
        barcode: this.data.product.barcode,
        category_id: this.data.product.category_id,
        supplier_id: this.data.product.supplier_id,
        unit_price: this.data.product.unit_price,
        cost_price: this.data.product.cost_price,
        quantity: this.data.product.quantity,
        min_quantity: this.data.product.min_quantity,
        max_quantity: this.data.product.max_quantity,
        image_url: this.data.product.image_url,
        status: this.data.product.status
      });
    }
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (response: any) => {
        this.categories = response.data || [];
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadSuppliers(): void {
    this.supplierService.getAll().subscribe({
      next: (response: any) => {
        this.suppliers = response.data || [];
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      return;
    }

    this.loading = true;
    const formValue = this.productForm.value;

    if (this.isEditMode && this.data.product) {
      const updateData: ProductUpdateDto = { ...formValue, id: this.data.product.id };
      this.productService.update(this.data.product.id, updateData).subscribe({
        next: () => {
          this.snackBar.open('Produit mis à jour avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error updating product:', error);
          this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
          this.loading = false;
        }
      });
    } else {
      const createData: ProductCreateDto = formValue;
      this.productService.create(createData).subscribe({
        next: () => {
          this.snackBar.open('Produit créé avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error creating product:', error);
          this.snackBar.open('Erreur lors de la création', 'Fermer', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
