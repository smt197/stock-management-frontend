import { Component, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { AuthService } from '../../../core/services/auth.service';
import { PurchaseOrder } from '../../../shared/models';
import { PurchaseOrderFormComponent } from '../purchase-order-form/purchase-order-form';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ReceiveDialogComponent } from '../receive-dialog/receive-dialog';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-purchase-order-list',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule],
  templateUrl: './purchase-order-list.html',
  styleUrls: ['./purchase-order-list.scss']
})
export class PurchaseOrderListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'reference',
    'supplier',
    'order_date',
    'expected_delivery_date',
    'status',
    'total_amount',
    'actions'
  ];

  dataSource = new MatTableDataSource<PurchaseOrder>([]);
  totalRecords = signal(0);
  loading = signal(true);

  pageIndex = 0;
  pageSize = 10;
  searchTerm = '';
  private searchSubject = new Subject<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private purchaseOrderService: PurchaseOrderService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadPurchaseOrders();

    // Écouter les changements de recherche avec debounce
    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe((searchTerm) => {
        this.searchTerm = searchTerm;
        this.pageIndex = 0; // Réinitialiser à la première page lors d'une recherche
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadPurchaseOrders();
      });
  }

  ngAfterViewInit() {
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }

    setTimeout(() => {
      if (this.paginator) {
        this.paginator.page.subscribe((event: PageEvent) => {
          this.pageIndex = event.pageIndex;
          this.pageSize = event.pageSize;
          this.loadPurchaseOrders();
        });
      }
    }, 0);
  }

  loadPurchaseOrders() {
    this.loading.set(true);
    const params: any = {
      page: this.pageIndex + 1,
      limit: this.pageSize
    };

    // Ajouter le terme de recherche s'il existe
    if (this.searchTerm && this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    this.purchaseOrderService.getAll(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalRecords.set(response.total || 0);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading purchase orders:', error);
        this.snackBar.open('Erreur lors du chargement des commandes', 'Fermer', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue);
  }

  addPurchaseOrder() {
    const dialogRef = this.dialog.open(PurchaseOrderFormComponent, {
      width: '1200px',
      maxHeight: '90vh',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPurchaseOrders();
      }
    });
  }

  editPurchaseOrder(purchaseOrder: PurchaseOrder) {
    const dialogRef = this.dialog.open(PurchaseOrderFormComponent, {
      width: '1200px',
      maxHeight: '90vh',
      data: { mode: 'edit', purchaseOrder }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPurchaseOrders();
      }
    });
  }

  viewPurchaseOrder(purchaseOrder: PurchaseOrder) {
    this.router.navigate(['/purchase-orders', purchaseOrder.id]);
  }

  receivePurchaseOrder(purchaseOrder: PurchaseOrder) {
    const dialogRef = this.dialog.open(ReceiveDialogComponent, {
      width: '1000px',
      maxHeight: '90vh',
      data: { purchaseOrder }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPurchaseOrders();
      }
    });
  }

  deletePurchaseOrder(purchaseOrder: PurchaseOrder) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer la commande',
        message: `Êtes-vous sûr de vouloir supprimer la commande "${purchaseOrder.reference}" ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && purchaseOrder.id) {
        this.purchaseOrderService.delete(purchaseOrder.id).subscribe({
          next: () => {
            this.snackBar.open('Commande supprimée avec succès', 'Fermer', { duration: 3000 });
            this.loadPurchaseOrders();
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

  canReceive(purchaseOrder: PurchaseOrder): boolean {
    return ['pending', 'confirmed', 'partially_received'].includes(purchaseOrder.status);
  }

  canEdit(purchaseOrder: PurchaseOrder): boolean {
    return !['received', 'cancelled'].includes(purchaseOrder.status);
  }

  canDelete(purchaseOrder: PurchaseOrder): boolean {
    return purchaseOrder.status !== 'received';
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }
}
