import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedModule } from '../../../shared/shared.module';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ProductService } from '../../../core/services/product.service';
import { PurchaseOrder, Supplier, Product } from '../../../shared/models';

@Component({
  selector: 'app-purchase-order-form',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './purchase-order-form.html',
  styleUrls: ['./purchase-order-form.scss']
})
export class PurchaseOrderFormComponent implements OnInit {
  purchaseOrderForm: FormGroup;
  isEditMode = false;
  loading = false;
  suppliers: Supplier[] = [];
  products: Product[] = [];

  constructor(
    private fb: FormBuilder,
    private purchaseOrderService: PurchaseOrderService,
    private supplierService: SupplierService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<PurchaseOrderFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string; purchaseOrder?: PurchaseOrder }
  ) {
    this.isEditMode = data.mode === 'edit';

    this.purchaseOrderForm = this.fb.group({
      supplier_id: ['', Validators.required],
      order_date: [new Date(), Validators.required],
      expected_delivery_date: [''],
      notes: [''],
      items: this.fb.array([], Validators.required)
    });
  }

  ngOnInit() {
    this.loadSuppliers();
    this.loadProducts();

    if (this.isEditMode && this.data.purchaseOrder) {
      this.populateForm(this.data.purchaseOrder);
    } else {
      this.addItem(); // Add one empty item by default
    }
  }

  get items(): FormArray {
    return this.purchaseOrderForm.get('items') as FormArray;
  }

  loadSuppliers() {
    this.supplierService.getAll({ limit: 1000 }).subscribe({
      next: (response) => {
        this.suppliers = response.data;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      }
    });
  }

  loadProducts() {
    this.productService.getAll({ limit: 1000 }).subscribe({
      next: (response) => {
        this.products = response.data;
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  populateForm(purchaseOrder: PurchaseOrder) {
    this.purchaseOrderForm.patchValue({
      supplier_id: purchaseOrder.supplier_id,
      order_date: purchaseOrder.order_date,
      expected_delivery_date: purchaseOrder.expected_delivery_date,
      notes: purchaseOrder.notes
    });

    // Populate items
    purchaseOrder.items.forEach(item => {
      this.items.push(this.fb.group({
        product_id: [item.product_id, Validators.required],
        quantity_ordered: [item.quantity_ordered, [Validators.required, Validators.min(1)]],
        unit_price: [item.unit_price, [Validators.required, Validators.min(0)]]
      }));
    });
  }

  addItem() {
    this.items.push(this.fb.group({
      product_id: ['', Validators.required],
      quantity_ordered: [1, [Validators.required, Validators.min(1)]],
      unit_price: [0, [Validators.required, Validators.min(0)]]
    }));
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    } else {
      this.snackBar.open('Au moins un article est requis', 'Fermer', { duration: 3000 });
    }
  }

  onProductChange(index: number) {
    const item = this.items.at(index);
    const productId = item.get('product_id')?.value;
    const product = this.products.find(p => p.id === productId);

    if (product) {
      // Auto-fill unit price with product's cost price
      item.patchValue({
        unit_price: product.cost_price
      });
    }
  }

  calculateItemTotal(index: number): number {
    const item = this.items.at(index);
    const quantity = item.get('quantity_ordered')?.value || 0;
    const price = item.get('unit_price')?.value || 0;
    return quantity * price;
  }

  calculateTotal(): number {
    let total = 0;
    for (let i = 0; i < this.items.length; i++) {
      total += this.calculateItemTotal(i);
    }
    return total;
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSubmit() {
    if (this.purchaseOrderForm.invalid) {
      this.snackBar.open('Veuillez remplir tous les champs requis', 'Fermer', { duration: 3000 });
      return;
    }

    this.loading = true;
    const formValue = this.purchaseOrderForm.value;

    // Format dates
    const orderData = {
      ...formValue,
      order_date: this.formatDate(formValue.order_date),
      expected_delivery_date: formValue.expected_delivery_date
        ? this.formatDate(formValue.expected_delivery_date)
        : null
    };

    const request = this.isEditMode && this.data.purchaseOrder?.id
      ? this.purchaseOrderService.update(this.data.purchaseOrder.id, orderData)
      : this.purchaseOrderService.create(orderData);

    request.subscribe({
      next: (response) => {
        this.snackBar.open(
          this.isEditMode ? 'Commande modifiée avec succès' : 'Commande créée avec succès',
          'Fermer',
          { duration: 3000 }
        );
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error saving purchase order:', error);
        this.snackBar.open(
          error.error?.message || 'Erreur lors de l\'enregistrement',
          'Fermer',
          { duration: 3000 }
        );
        this.loading = false;
      }
    });
  }

  private formatDate(date: any): string {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  }
}
