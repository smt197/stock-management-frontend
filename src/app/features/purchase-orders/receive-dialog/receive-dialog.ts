import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedModule } from '../../../shared/shared.module';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { PurchaseOrder, PurchaseOrderItem } from '../../../shared/models';

@Component({
  selector: 'app-receive-dialog',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './receive-dialog.html',
  styleUrls: ['./receive-dialog.scss']
})
export class ReceiveDialogComponent implements OnInit {
  receiveForm: FormGroup;
  loading = false;
  purchaseOrder: PurchaseOrder;

  constructor(
    private fb: FormBuilder,
    public purchaseOrderService: PurchaseOrderService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ReceiveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { purchaseOrder: PurchaseOrder }
  ) {
    this.purchaseOrder = data.purchaseOrder;

    this.receiveForm = this.fb.group({
      actual_delivery_date: [new Date(), Validators.required],
      items: this.fb.array([])
    });
  }

  ngOnInit() {
    this.initializeItems();
  }

  get items(): FormArray {
    return this.receiveForm.get('items') as FormArray;
  }

  initializeItems() {
    this.purchaseOrder.items.forEach(item => {
      const remainingQty = item.quantity_ordered - item.quantity_received;
      if (remainingQty > 0) {
        this.items.push(this.fb.group({
          item_id: [item.id],
          product_name: [item.product?.name || 'N/A'],
          quantity_ordered: [item.quantity_ordered],
          quantity_received: [item.quantity_received],
          remaining_quantity: [remainingQty],
          quantity_to_receive: [remainingQty, [Validators.required, Validators.min(1), Validators.max(remainingQty)]],
          receive: [true] // Checkbox to select items to receive
        }));
      }
    });
  }

  getRemainingQuantity(index: number): number {
    const item = this.items.at(index);
    return item.get('remaining_quantity')?.value || 0;
  }

  getQuantityToReceive(index: number): number {
    const item = this.items.at(index);
    return item.get('quantity_to_receive')?.value || 0;
  }

  selectAll() {
    this.items.controls.forEach(control => {
      control.patchValue({ receive: true });
    });
  }

  unselectAll() {
    this.items.controls.forEach(control => {
      control.patchValue({ receive: false });
    });
  }

  receiveAllRemaining() {
    this.items.controls.forEach(control => {
      const remainingQty = control.get('remaining_quantity')?.value;
      control.patchValue({
        receive: true,
        quantity_to_receive: remainingQty
      });
    });
  }

  hasSelectedItems(): boolean {
    return this.items.controls.some(control => control.get('receive')?.value === true);
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSubmit() {
    if (this.receiveForm.invalid) {
      this.snackBar.open('Veuillez corriger les erreurs', 'Fermer', { duration: 3000 });
      return;
    }

    if (!this.hasSelectedItems()) {
      this.snackBar.open('Veuillez sélectionner au moins un article à recevoir', 'Fermer', { duration: 3000 });
      return;
    }

    this.loading = true;

    // Build receive data only for selected items
    const selectedItems = this.items.controls
      .filter(control => control.get('receive')?.value === true)
      .map(control => ({
        item_id: control.get('item_id')?.value,
        quantity_received: control.get('quantity_to_receive')?.value
      }));

    const receiveData = {
      items: selectedItems,
      actual_delivery_date: this.formatDate(this.receiveForm.get('actual_delivery_date')?.value)
    };

    if (this.purchaseOrder.id) {
      this.purchaseOrderService.receive(this.purchaseOrder.id, receiveData).subscribe({
        next: (response) => {
          this.snackBar.open('Réception enregistrée avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error receiving items:', error);
          this.snackBar.open(
            error.error?.message || 'Erreur lors de la réception',
            'Fermer',
            { duration: 3000 }
          );
          this.loading = false;
        }
      });
    }
  }

  private formatDate(date: any): string {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  }
}
