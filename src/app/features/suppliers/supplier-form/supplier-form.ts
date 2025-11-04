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
import { SupplierService } from '../../../core/services/supplier.service';
import { Supplier, SupplierCreateDto, SupplierUpdateDto } from '../../../shared/models/supplier.model';

@Component({
  selector: 'app-supplier-form',
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
  templateUrl: './supplier-form.html',
  styleUrl: './supplier-form.scss',
})
export class SupplierForm implements OnInit {
  supplierForm: FormGroup;
  isEditMode: boolean = false;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SupplierForm>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit', supplier?: Supplier }
  ) {
    this.isEditMode = data.mode === 'edit';
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.email]],
      phone: [''],
      address: [''],
      city: [''],
      country: [''],
      website: [''],
      contact_person: [''],
      status: ['active', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.supplier) {
      this.supplierForm.patchValue({
        name: this.data.supplier.name,
        email: this.data.supplier.email,
        phone: this.data.supplier.phone,
        address: this.data.supplier.address,
        city: this.data.supplier.city,
        country: this.data.supplier.country,
        website: this.data.supplier.website,
        contact_person: this.data.supplier.contact_person,
        status: this.data.supplier.status
      });
    }
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      return;
    }

    this.loading = true;
    const formValue = this.supplierForm.value;

    if (this.isEditMode && this.data.supplier) {
      const updateData: SupplierUpdateDto = { ...formValue, id: this.data.supplier.id };
      this.supplierService.update(this.data.supplier.id, updateData).subscribe({
        next: () => {
          this.snackBar.open('Fournisseur mis à jour avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error updating supplier:', error);
          this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
          this.loading = false;
        }
      });
    } else {
      const createData: SupplierCreateDto = formValue;
      this.supplierService.create(createData).subscribe({
        next: () => {
          this.snackBar.open('Fournisseur créé avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error creating supplier:', error);
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
