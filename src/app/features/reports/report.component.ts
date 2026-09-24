import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedModule } from '../../shared/shared.module';
import { Category } from '../../shared/models/category.model';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';
import { StockMovementService } from '../../core/services/stock-movement.service';
import { ReportService } from '../../core/services/report.service';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
  reportForm: FormGroup;
  categories: Category[] = [];
  loading = false;
  reportGenerated = false;

  reportData: any[] = [];
  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = [];
  columnHeaders: { [key: string]: string } = {};
  reportTitle = '';
  reportSummary: any = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('reportTable') reportTable!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private productService: ProductService,
    private stockMovementService: StockMovementService,
    private reportService: ReportService,
    private snackBar: MatSnackBar
  ) {
    this.reportForm = this.fb.group({
      reportType: ['', Validators.required],
      dateRange: this.fb.group({
        start: [null],
        end: [null]
      }),
      categoryId: [null]
    });
  }

  get dateRangeGroup(): FormGroup {
    return this.reportForm.get('dateRange') as FormGroup;
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (response) => this.categories = response.data || [],
      error: () => this.snackBar.open('Erreur lors du chargement des catégories.', 'Fermer', { duration: 3000 })
    });
  }

  generateReport(): void {
    if (this.reportForm.invalid) {
      return;
    }

    this.loading = true;
    this.reportGenerated = false;
    this.reportData = [];
    this.reportSummary = null;

    const formValue = this.reportForm.value;
    const params: any = {};

    if (formValue.dateRange.start) {
      params.date_from = formValue.dateRange.start.toISOString().split('T')[0];
    }
    if (formValue.dateRange.end) {
      params.date_to = formValue.dateRange.end.toISOString().split('T')[0];
    }
    if (formValue.categoryId) {
      params.category_id = formValue.categoryId;
    }

    const reportType = formValue.reportType;

    switch (reportType) {
      case 'stock':
        this.reportTitle = 'Rapport de Stock Actuel';
        this.productService.getAll({ ...params, limit: 10000, page: 1 }).subscribe({
          next: (response: any) => this.handleProductResponse(response),
          error: () => this.handleError()
        });
        break;
      case 'low_stock':
        this.reportTitle = 'Rapport de Stock Faible';
        this.reportService.getLowStockReport(params).subscribe({
          next: (response: any) => this.handleLowStockResponse(response),
          error: () => this.handleError()
        });
        break;
      case 'movements':
        this.reportTitle = 'Rapport des Mouvements de Stock';
        this.stockMovementService.getAll({ ...params, limit: 10000, page: 1 }).subscribe({
          next: (response: any) => this.handleMovementResponse(response),
          error: () => this.handleError()
        });
        break;
      case 'sales':
        this.reportTitle = 'Rapport des Ventes';
        this.reportService.getSalesReport(params).subscribe({
          next: (response: any) => this.handleSalesResponse(response),
          error: () => this.handleError()
        });
        break;
      case 'top_products':
        this.reportTitle = 'Top Produits Vendus';
        this.reportService.getTopProducts({ ...params, limit: 10 }).subscribe({
          next: (response: any) => this.handleTopProductsResponse(response),
          error: () => this.handleError()
        });
        break;
      case 'profit':
        this.reportTitle = 'Rapport de Rentabilité';
        this.reportService.getProfitReport(params).subscribe({
          next: (response: any) => this.handleProfitResponse(response),
          error: () => this.handleError()
        });
        break;
      case 'inventory_value':
        this.reportTitle = 'Valeur du Stock';
        this.reportService.getInventoryValue(params).subscribe({
          next: (response: any) => this.handleInventoryValueResponse(response),
          error: () => this.handleError()
        });
        break;
    }
  }

  formatMoney(amount: any): string {
    if (amount === null || amount === undefined || isNaN(Number(amount))) return '0 FCFA';
    const num = parseFloat(amount);
    const formatted = num.toLocaleString('fr-FR').replace(/[\u202F\u00A0]/g, ' ');
    return `${formatted} FCFA`;
  }

  private handleProductResponse(response: any): void {
    this.columnHeaders = {
      name: 'Nom',
      sku: 'SKU',
      categoryName: 'Catégorie',
      quantity: 'Quantité',
      min_quantity: 'Stock Min',
      unit_price: 'Prix Unitaire',
      status: 'Statut',
    };
    this.displayedColumns = Object.keys(this.columnHeaders);
    this.reportData = response.data.map((p: any) => ({
      name: p.name,
      sku: p.sku,
      categoryName: p.category?.name || 'N/A',
      quantity: p.quantity,
      min_quantity: p.min_quantity,
      unit_price: this.formatMoney(p.unit_price),
      status: p.status === 'active' ? 'Actif' : 'Inactif',
    }));
    this.finalizeReport();
  }

  private handleLowStockResponse(response: any): void {
    this.columnHeaders = {
      name: 'Nom',
      sku: 'SKU',
      category: 'Catégorie',
      quantity: 'Quantité',
      min_quantity: 'Stock Min',
      stock_value: 'Valeur Stock',
      is_out_of_stock: 'Rupture',
    };
    this.displayedColumns = Object.keys(this.columnHeaders);
    this.reportData = response.data.map((p: any) => ({
      name: p.name,
      sku: p.sku,
      category: p.category || 'N/A',
      quantity: p.quantity,
      min_quantity: p.min_quantity,
      stock_value: this.formatMoney(p.stock_value),
      is_out_of_stock: p.is_out_of_stock ? '🔴 Oui' : '🟢 Non',
    }));
    if (response.summary) {
      this.reportSummary = {
        'Produits en stock faible': response.summary.total_low_stock,
        'Produits en rupture': response.summary.total_out_of_stock,
        'Valeur à risque': this.formatMoney(response.summary.total_value_at_risk),
      };
    }
    this.finalizeReport();
  }

  private handleMovementResponse(response: any): void {
    this.columnHeaders = {
      productName: 'Produit',
      type: 'Type',
      quantity: 'Quantité',
      userName: 'Utilisateur',
      date: 'Date',
    };
    this.displayedColumns = Object.keys(this.columnHeaders);
    this.reportData = response.data.map((m: any) => ({
      productName: m.product?.name || 'N/A',
      type: m.type === 'in' ? '📥 Entrée' : m.type === 'out' ? '📤 Sortie' : '🔄 Ajustement',
      quantity: m.quantity,
      userName: m.user?.name || 'N/A',
      date: new Date(m.created_at).toLocaleString('fr-FR'),
    }));
    this.finalizeReport();
  }

  private handleSalesResponse(response: any): void {
    this.columnHeaders = {
      sale_number: 'N° Vente',
      sale_date: 'Date',
      customer_name: 'Client',
      total_amount: 'Total',
      total_profit: 'Profit',
      payment_method: 'Paiement',
      payment_status: 'Statut Paiement',
    };
    this.displayedColumns = Object.keys(this.columnHeaders);

    const paymentLabels: any = {
      cash: 'Espèces', mobile_money: 'Mobile Money', card: 'Carte', credit: 'Crédit'
    };
    const statusLabels: any = {
      paid: '✅ Payé', pending: '⏳ En attente', partial: '⚠️ Partiel'
    };

    this.reportData = response.data.map((s: any) => ({
      sale_number: s.sale_number,
      sale_date: new Date(s.sale_date).toLocaleDateString('fr-FR'),
      customer_name: s.customer_name || 'Client Comptoir',
      total_amount: this.formatMoney(s.total_amount),
      total_profit: this.formatMoney(s.total_profit),
      payment_method: paymentLabels[s.payment_method] || s.payment_method,
      payment_status: statusLabels[s.payment_status] || s.payment_status,
    }));

    if (response.summary) {
      this.reportSummary = {
        'Nombre de ventes': response.summary.total_sales,
        'Chiffre d\'affaires': this.formatMoney(response.summary.total_revenue),
        'Profit total': this.formatMoney(response.summary.total_profit),
        'Vente moyenne': this.formatMoney(response.summary.average_sale),
        'Marge moyenne': `${parseFloat(response.summary.average_profit_margin).toFixed(1)}%`,
      };
    }
    this.finalizeReport();
  }

  private handleTopProductsResponse(response: any): void {
    this.columnHeaders = {
      product_name: 'Produit',
      product_sku: 'SKU',
      total_quantity: 'Qté Vendue',
      total_revenue: 'CA Généré',
      total_profit: 'Profit',
    };
    this.displayedColumns = Object.keys(this.columnHeaders);
    this.reportData = response.data.map((p: any) => ({
      product_name: p.product_name,
      product_sku: p.product_sku,
      total_quantity: p.total_quantity,
      total_revenue: this.formatMoney(p.total_revenue),
      total_profit: this.formatMoney(p.total_profit),
    }));
    this.finalizeReport();
  }

  private handleProfitResponse(response: any): void {
    this.columnHeaders = {
      product_name: 'Produit',
      product_sku: 'SKU',
      total_quantity: 'Qté Vendue',
      total_revenue: 'CA',
      total_cost: 'Coût',
      total_profit: 'Profit',
      margin_percentage: 'Marge %',
    };
    this.displayedColumns = Object.keys(this.columnHeaders);
    this.reportData = response.data.map((p: any) => ({
      product_name: p.product_name,
      product_sku: p.product_sku,
      total_quantity: p.total_quantity,
      total_revenue: this.formatMoney(p.total_revenue),
      total_cost: this.formatMoney(p.total_cost),
      total_profit: this.formatMoney(p.total_profit),
      margin_percentage: `${p.margin_percentage}%`,
    }));

    if (response.summary) {
      this.reportSummary = {
        'CA Total': this.formatMoney(response.summary.total_revenue),
        'Coût Total': this.formatMoney(response.summary.total_cost),
        'Profit Total': this.formatMoney(response.summary.total_profit),
        'Marge Globale': `${response.summary.overall_margin}%`,
      };
    }
    this.finalizeReport();
  }

  private handleInventoryValueResponse(response: any): void {
    this.columnHeaders = {
      category: 'Catégorie',
      product_count: 'Nb Produits',
      total_quantity: 'Qté Totale',
      cost_value: 'Valeur (Coût)',
      sale_value: 'Valeur (Vente)',
      potential_profit: 'Profit Potentiel',
    };
    this.displayedColumns = Object.keys(this.columnHeaders);
    this.reportData = response.data.map((c: any) => ({
      category: c.category,
      product_count: c.product_count,
      total_quantity: c.total_quantity,
      cost_value: this.formatMoney(c.cost_value),
      sale_value: this.formatMoney(c.sale_value),
      potential_profit: this.formatMoney(c.potential_profit),
    }));

    if (response.summary) {
      this.reportSummary = {
        'Total Produits': response.summary.total_products,
        'Quantité Totale': response.summary.total_quantity,
        'Valeur (Coût d\'achat)': this.formatMoney(response.summary.total_cost_value),
        'Valeur (Prix de vente)': this.formatMoney(response.summary.total_sale_value),
        'Profit Potentiel': this.formatMoney(response.summary.total_potential_profit),
      };
    }
    this.finalizeReport();
  }

  private handleError(): void {
    this.loading = false;
    this.snackBar.open('Erreur lors de la génération du rapport.', 'Fermer', { duration: 3000 });
  }

  private finalizeReport(): void {
    this.dataSource.data = this.reportData;
    this.dataSource.paginator = this.paginator;
    this.loading = false;
    this.reportGenerated = true;
  }

  exportToExcel(): void {
    // Remap data to have headers as keys for a cleaner export
    const excelData = this.reportData.map(row => {
      const newRow: { [key: string]: any } = {};
      this.displayedColumns.forEach(col => {
        newRow[this.columnHeaders[col]] = row[col];
      });
      return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, this.reportTitle);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.slugify(fileName)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  exportToPdf(): void {
    const doc = new jsPDF();
    const head = [this.displayedColumns.map(col => this.columnHeaders[col])];
    const body = this.reportData.map(row => this.displayedColumns.map(col => row[col]));

    autoTable(doc, {
      head: head,
      body: body,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [25, 118, 210] },
      didDrawPage: (data: any) => {
        // Header
        doc.setFontSize(16);
        doc.setTextColor(40);
        doc.text(this.reportTitle, data.settings.margin.left, 15);
      }
    });

    doc.save(`${this.slugify(this.reportTitle)}.pdf`);
  }

  get summaryKeys(): string[] {
    return this.reportSummary ? Object.keys(this.reportSummary) : [];
  }

  private slugify(text: string): string {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
}
