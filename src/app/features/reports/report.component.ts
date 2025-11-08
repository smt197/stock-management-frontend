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

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('reportTable') reportTable!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private productService: ProductService,
    private stockMovementService: StockMovementService,
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

    const formValue = this.reportForm.value;
    const params: any = {
      limit: 10000, // Get all data for the report
      page: 1
    };

    if (formValue.dateRange.start) {
      params.start_date = formValue.dateRange.start.toISOString().split('T')[0];
    }
    if (formValue.dateRange.end) {
      params.end_date = formValue.dateRange.end.toISOString().split('T')[0];
    }
    if (formValue.categoryId) {
      params.category_id = formValue.categoryId;
    }

    const reportType = formValue.reportType;

    switch (reportType) {
      case 'stock':
        this.reportTitle = 'Rapport de Stock Actuel';
        this.productService.getAll(params).subscribe(this.handleProductResponse.bind(this));
        break;
      case 'low_stock':
        this.reportTitle = 'Rapport de Stock Faible';
        params.low_stock = true;
        this.productService.getAll(params).subscribe(this.handleProductResponse.bind(this));
        break;
      case 'movements':
        this.reportTitle = 'Rapport des Mouvements de Stock';
        this.stockMovementService.getAll(params).subscribe(this.handleMovementResponse.bind(this));
        break;
    }
  }

  private handleProductResponse(response: any): void {
    this.columnHeaders = {
      id: 'ID',
      name: 'Nom',
      sku: 'SKU',
      categoryName: 'Catégorie',
      supplierName: 'Fournisseur',
      quantity: 'Quantité',
      min_quantity: 'Stock Min',
      unit_price: 'Prix Unitaire',
      status: 'Statut',
    };
    this.displayedColumns = Object.keys(this.columnHeaders);
    this.reportData = response.data.map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      categoryName: p.category?.name || 'N/A',
      supplierName: p.supplier?.name || 'N/A',
      quantity: p.quantity,
      min_quantity: p.min_quantity,
      unit_price: `${p.unit_price} €`,
      status: p.status,
    }));
    this.finalizeReport();
  }

  private handleMovementResponse(response: any): void {
    this.columnHeaders = {
      id: 'ID',
      productName: 'Produit',
      type: 'Type',
      quantity: 'Quantité',
      userName: 'Utilisateur',
      date: 'Date',
    };
    this.displayedColumns = Object.keys(this.columnHeaders);
    this.reportData = response.data.map((m: any) => ({
      id: m.id,
      productName: m.product?.name || 'N/A',
      type: m.type,
      quantity: m.quantity,
      userName: m.user?.name || 'N/A',
      date: new Date(m.created_at).toLocaleString('fr-FR'),
    }));
    this.finalizeReport();
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

    (doc as any).autoTable({
      head: head,
      body: body,
      startY: 20,
      didDrawPage: (data: any) => {
        // Header
        doc.setFontSize(20);
        doc.setTextColor(40);
        doc.text(this.reportTitle, data.settings.margin.left, 15);
      }
    });

    doc.save(`${this.slugify(this.reportTitle)}.pdf`);
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
