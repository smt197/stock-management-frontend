import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SaleService } from '../../../core/services/sale.service';
import { Sale } from '../../../core/models/sale.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './sale-detail.html',
  styleUrls: ['./sale-detail.scss']
})
export class SaleDetailComponent implements OnInit {
  sale: Sale | null = null;
  loading = true;
  displayedColumns: string[] = ['product_name', 'unit_price', 'quantity', 'subtotal', 'profit'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private saleService: SaleService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSale(+id);
    }
  }

  loadSale(id: number): void {
    this.loading = true;
    this.saleService.getSale(id).subscribe({
      next: (response) => {
        this.sale = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la vente:', error);
        this.snackBar.open('Erreur lors du chargement de la vente', 'Fermer', {
          duration: 3000
        });
        this.loading = false;
        this.router.navigate(['/sales']);
      }
    });
  }

  cancelSale(): void {
    if (!this.sale) return;

    if (confirm(`Êtes-vous sûr de vouloir annuler la vente ${this.sale.sale_number} ? Le stock sera remis.`)) {
      this.saleService.cancelSale(this.sale.id).subscribe({
        next: (response) => {
          this.snackBar.open(response.message, 'Fermer', { duration: 3000 });
          this.loadSale(this.sale!.id); // Reload to show updated status
        },
        error: (error) => {
          const message = error.error?.message || 'Erreur lors de l\'annulation';
          this.snackBar.open(message, 'Fermer', { duration: 5000 });
        }
      });
    }
  }

  printReceipt(): void {
    if (!this.sale) return;

    this.saleService.getReceipt(this.sale.id).subscribe({
      next: (response) => {
        const receipt = response.data;
        this.generateReceiptPdf(receipt);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la génération du reçu', 'Fermer', { duration: 3000 });
      }
    });
  }

  private generateReceiptPdf(receipt: any): void {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 200] // Receipt format (80mm width)
    });

    const pageWidth = 80;
    const margin = 5;
    let y = 10;

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('STOCK MANAGEMENT', pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Système de Gestion de Stock', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Separator
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    // Sale info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Reçu N° ${receipt.sale_number}`, pageWidth / 2, y, { align: 'center' });
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Date: ${receipt.sale_date}`, margin, y);
    y += 4;
    doc.text(`Client: ${receipt.customer_name}`, margin, y);
    y += 4;
    if (receipt.customer_phone) {
      doc.text(`Tél: ${receipt.customer_phone}`, margin, y);
      y += 4;
    }
    doc.text(`Vendeur: ${receipt.sold_by}`, margin, y);
    y += 5;

    // Separator
    doc.line(margin, y, pageWidth - margin, y);
    y += 3;

    // Items table
    const head = [['Article', 'Qté', 'P.U.', 'Total']];
    const body = receipt.items.map((item: any) => [
      item.product_name.substring(0, 18),
      item.quantity.toString(),
      this.formatNumber(item.unit_price),
      this.formatNumber(item.subtotal),
    ]);

    autoTable(doc, {
      head: head,
      body: body,
      startY: y,
      theme: 'plain',
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fontStyle: 'bold', fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 8, halign: 'center' },
        2: { cellWidth: 15, halign: 'right' },
        3: { cellWidth: 17, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 3 : y + 20;

    // Separator
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    // Totals
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', margin, y);
    doc.text(`${this.formatNumber(receipt.total_amount)} FCFA`, pageWidth - margin, y, { align: 'right' });
    y += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    const paymentLabels: any = {
      cash: 'Espèces', mobile_money: 'Mobile Money', card: 'Carte', credit: 'Crédit'
    };
    doc.text(`Paiement: ${paymentLabels[receipt.payment_method] || receipt.payment_method}`, margin, y);
    y += 4;
    doc.text(`Payé: ${this.formatNumber(receipt.amount_paid)} FCFA`, margin, y);
    y += 4;

    if (parseFloat(receipt.amount_due) > 0) {
      doc.text(`Reste dû: ${this.formatNumber(receipt.amount_due)} FCFA`, margin, y);
      y += 4;
    }

    if (receipt.change > 0) {
      doc.text(`Monnaie: ${this.formatNumber(receipt.change)} FCFA`, margin, y);
      y += 4;
    }

    y += 3;

    // Footer separator
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFontSize(8);
    doc.text('Merci pour votre achat !', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.setFontSize(6);
    doc.text(`Imprimé le ${new Date().toLocaleString('fr-FR')}`, pageWidth / 2, y, { align: 'center' });

    // Save
    doc.save(`recu-${receipt.sale_number}.pdf`);
    this.snackBar.open('Reçu téléchargé avec succès', 'Fermer', { duration: 3000 });
  }

  goBack(): void {
    this.router.navigate(['/sales']);
  }

  getPaymentMethodLabel(method: string): string {
    const labels: any = {
      'cash': 'Espèces',
      'mobile_money': 'Mobile Money',
      'card': 'Carte Bancaire',
      'credit': 'Crédit'
    };
    return labels[method] || method;
  }

  getPaymentStatusLabel(status: string): string {
    const labels: any = {
      'paid': 'Payé',
      'pending': 'En attente',
      'partial': 'Partiel'
    };
    return labels[status] || status;
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'completed': 'Complétée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    return status === 'completed' ? 'primary' : 'warn';
  }

  getPaymentStatusColor(status: string): string {
    const colors: any = {
      'paid': 'primary',
      'pending': 'warn',
      'partial': 'accent'
    };
    return colors[status] || 'basic';
  }

  canCancel(): boolean {
    return this.sale?.status === 'completed';
  }

  formatDate(date: string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getItemProfit(item: any): number {
    return (item.unit_price - item.cost_price) * item.quantity;
  }

  getItemMargin(item: any): number {
    if (item.unit_price === 0) return 0;
    return ((item.unit_price - item.cost_price) / item.unit_price) * 100;
  }

  getTotalQuantity(items: any[]): number {
    if (!items) return 0;
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  private formatNumber(val: any): string {
    if (val === null || val === undefined || isNaN(Number(val))) return '0';
    return parseFloat(val).toLocaleString('fr-FR').replace(/[\u202F\u00A0]/g, ' ');
  }
}
