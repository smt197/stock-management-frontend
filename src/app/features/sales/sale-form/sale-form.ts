import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, startWith, debounceTime, switchMap } from 'rxjs/operators';

import { SaleService } from '../../../core/services/sale.service';
import { ProductService } from '../../../core/services/product.service';
import { CreateSaleRequest } from '../../../core/models/sale.model';

interface CartItem {
  product_id: number;
  product_name: string;
  product_sku: string;
  unit_price: number;
  available_stock: number;
  quantity: number;
  subtotal: number;
}

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatTableModule,
    MatCardModule,
    MatSnackBarModule,
  ],
  templateUrl: './sale-form.html',
  styleUrls: ['./sale-form.scss']
})
export class SaleFormComponent implements OnInit {
  saleForm: FormGroup;
  productSearchControl = this.fb.control('');

  cartItems: CartItem[] = [];
  displayedColumns: string[] = ['product_name', 'unit_price', 'quantity', 'subtotal', 'actions'];

  filteredProducts: Observable<any[]>;
  availableProducts: any[] = [];

  loading = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.saleForm = this.fb.group({
      customer_name: [''],
      customer_phone: [''],
      payment_method: ['cash', Validators.required],
      amount_paid: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });

    this.filteredProducts = this.productSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => this._filterProducts(value || ''))
    );
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts({ limit: 1000, status: 'active' }).subscribe({
      next: (response) => {
        this.availableProducts = response.data.filter((p: any) => p.quantity > 0);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits:', error);
        this.snackBar.open('Erreur lors du chargement des produits', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  private _filterProducts(value: string): Observable<any[]> {
    if (!value || typeof value !== 'string') {
      return of(this.availableProducts.slice(0, 10));
    }

    const filterValue = value.toLowerCase();
    const filtered = this.availableProducts.filter(product =>
      product.name.toLowerCase().includes(filterValue) ||
      product.sku.toLowerCase().includes(filterValue) ||
      (product.barcode && product.barcode.toLowerCase().includes(filterValue))
    );

    return of(filtered.slice(0, 10));
  }

  displayProductFn(product: any): string {
    return product ? `${product.name} (${product.sku})` : '';
  }

  addProductToCart(product: any): void {
    if (!product || !product.id) {
      return;
    }

    // Vérifier si le produit est déjà dans le panier
    const existingItem = this.cartItems.find(item => item.product_id === product.id);

    if (existingItem) {
      // Vérifier le stock disponible
      if (existingItem.quantity < existingItem.available_stock) {
        existingItem.quantity++;
        existingItem.subtotal = existingItem.unit_price * existingItem.quantity;
        this.snackBar.open(`Quantité augmentée: ${product.name}`, 'Fermer', { duration: 2000 });
      } else {
        this.snackBar.open(`Stock insuffisant pour ${product.name}`, 'Fermer', { duration: 3000 });
      }
    } else {
      // Ajouter un nouveau produit
      this.cartItems.push({
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        unit_price: product.unit_price,
        available_stock: product.quantity,
        quantity: 1,
        subtotal: product.unit_price
      });
      this.snackBar.open(`Produit ajouté: ${product.name}`, 'Fermer', { duration: 2000 });
    }

    // Réinitialiser le champ de recherche
    this.productSearchControl.setValue('');

    // Mettre à jour le montant payé par défaut
    if (this.saleForm.get('amount_paid')?.value === 0) {
      this.saleForm.patchValue({ amount_paid: this.getTotalAmount() });
    }
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity < 1) {
      this.removeFromCart(item);
      return;
    }

    if (newQuantity > item.available_stock) {
      this.snackBar.open(
        `Stock insuffisant. Disponible: ${item.available_stock}`,
        'Fermer',
        { duration: 3000 }
      );
      return;
    }

    item.quantity = newQuantity;
    item.subtotal = item.unit_price * item.quantity;
  }

  removeFromCart(item: CartItem): void {
    const index = this.cartItems.indexOf(item);
    if (index > -1) {
      this.cartItems.splice(index, 1);
      this.snackBar.open('Produit retiré du panier', 'Fermer', { duration: 2000 });
    }
  }

  getTotalAmount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  }

  getAmountDue(): number {
    const total = this.getTotalAmount();
    const paid = this.saleForm.get('amount_paid')?.value || 0;
    return Math.max(0, total - paid);
  }

  getChange(): number {
    const total = this.getTotalAmount();
    const paid = this.saleForm.get('amount_paid')?.value || 0;
    return Math.max(0, paid - total);
  }

  getPaymentStatus(): 'paid' | 'pending' | 'partial' {
    const total = this.getTotalAmount();
    const paid = this.saleForm.get('amount_paid')?.value || 0;

    if (paid >= total) {
      return 'paid';
    } else if (paid > 0) {
      return 'partial';
    } else {
      return 'pending';
    }
  }

  onSubmit(): void {
    if (this.cartItems.length === 0) {
      this.snackBar.open('Veuillez ajouter au moins un produit', 'Fermer', { duration: 3000 });
      return;
    }

    if (this.saleForm.invalid) {
      this.snackBar.open('Veuillez remplir tous les champs requis', 'Fermer', { duration: 3000 });
      return;
    }

    this.submitting = true;

    const saleData: CreateSaleRequest = {
      customer_name: this.saleForm.value.customer_name || undefined,
      customer_phone: this.saleForm.value.customer_phone || undefined,
      payment_method: this.saleForm.value.payment_method,
      payment_status: this.getPaymentStatus(),
      amount_paid: this.saleForm.value.amount_paid,
      notes: this.saleForm.value.notes || undefined,
      items: this.cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    };

    this.saleService.createSale(saleData).subscribe({
      next: (response) => {
        this.snackBar.open(response.message || 'Vente créée avec succès', 'Fermer', { duration: 3000 });
        this.router.navigate(['/sales', response.data.id]);
      },
      error: (error) => {
        const message = error.error?.message || 'Erreur lors de la création de la vente';
        this.snackBar.open(message, 'Fermer', { duration: 5000 });
        this.submitting = false;
      }
    });
  }

  cancel(): void {
    if (confirm('Voulez-vous vraiment annuler ? Les données non enregistrées seront perdues.')) {
      this.router.navigate(['/sales']);
    }
  }
}
