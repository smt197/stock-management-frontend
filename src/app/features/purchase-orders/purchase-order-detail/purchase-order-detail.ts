import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { AuthService } from '../../../core/services/auth.service';
import { PurchaseOrder } from '../../../shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PurchaseOrderFormComponent } from '../purchase-order-form/purchase-order-form';
import { ReceiveDialogComponent } from '../receive-dialog/receive-dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-purchase-order-detail',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './purchase-order-detail.html',
  styleUrls: ['./purchase-order-detail.scss']
})
export class PurchaseOrderDetailComponent implements OnInit {
  purchaseOrder = signal<PurchaseOrder | null>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private purchaseOrderService: PurchaseOrderService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private location: Location
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPurchaseOrder(+id);
    } else {
      this.snackBar.open('ID de commande invalide', 'Fermer', { duration: 3000 });
      this.goBack();
    }
  }

  loadPurchaseOrder(id: number) {
    this.loading.set(true);
    this.purchaseOrderService.getById(id).subscribe({
      next: (response) => {
        this.purchaseOrder.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading purchase order:', error);
        this.snackBar.open('Erreur lors du chargement de la commande', 'Fermer', { duration: 3000 });
        this.loading.set(false);
        this.goBack();
      }
    });
  }

  goBack() {
    this.location.back();
  }

  editPurchaseOrder() {
    const dialogRef = this.dialog.open(PurchaseOrderFormComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { mode: 'edit', purchaseOrder: this.purchaseOrder() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.purchaseOrder()?.id) {
        this.loadPurchaseOrder(this.purchaseOrder()!.id!);
      }
    });
  }

  receivePurchaseOrder() {
    const dialogRef = this.dialog.open(ReceiveDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { purchaseOrder: this.purchaseOrder() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.purchaseOrder()?.id) {
        this.loadPurchaseOrder(this.purchaseOrder()!.id!);
      }
    });
  }

  deletePurchaseOrder() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer la commande',
        message: `Êtes-vous sûr de vouloir supprimer la commande "${this.purchaseOrder()?.reference}" ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.purchaseOrder()?.id) {
        this.purchaseOrderService.delete(this.purchaseOrder()!.id!).subscribe({
          next: () => {
            this.snackBar.open('Commande supprimée avec succès', 'Fermer', { duration: 3000 });
            this.router.navigate(['/purchase-orders']);
          },
          error: (error) => {
            this.snackBar.open(
              error.error?.message || 'Erreur lors de la suppression',
              'Fermer',
              { duration: 3000 }
            );
          }
        });
      }
    });
  }

  getStatusLabel(status: string): string {
    return this.purchaseOrderService.getStatusLabel(status);
  }

  getStatusColor(status: string): string {
    return this.purchaseOrderService.getStatusColor(status);
  }

  canReceive(): boolean {
    const order = this.purchaseOrder();
    return order ? ['pending', 'confirmed', 'partially_received'].includes(order.status) : false;
  }

  canEdit(): boolean {
    const order = this.purchaseOrder();
    return order ? !['received', 'cancelled'].includes(order.status) : false;
  }

  canDelete(): boolean {
    const order = this.purchaseOrder();
    return order ? order.status !== 'received' : false;
  }

  calculateItemTotal(quantityOrdered: number, unitPrice: number): number {
    return quantityOrdered * unitPrice;
  }

  getProgressPercentage(quantityReceived: number, quantityOrdered: number): number {
    return (quantityReceived / quantityOrdered) * 100;
  }
}
