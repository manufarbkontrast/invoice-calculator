import ExcelJS from 'exceljs';
import { Invoice } from '../drizzle/schema';

export interface MonthSummary {
  month: string;
  invoices: Invoice[];
  totalUSD: number;
  totalEUR: number;
  totalInEUR: number;
}

/**
 * Generate Excel file for monthly invoice summary
 */
export async function generateMonthlyExcel(summary: MonthSummary, exchangeRate: number = 0.92): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Ausgaben ${summary.month}`);

  // Set column widths
  worksheet.columns = [
    { width: 5 },   // Nr.
    { width: 32 },  // Tool/Service
    { width: 35 },  // Firma
    { width: 15 },  // Betrag
    { width: 12 },  // Währung
    { width: 18 },  // Datum
    { width: 28 },  // Zeitraum
  ];

  // Title
  worksheet.mergeCells('A1:G1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `TOOL-AUSGABEN KALKULATION - ${summary.month.toUpperCase()}`;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF4285F4' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 25;

  // Header row
  const headers = ['Nr.', 'Tool/Service', 'Firma', 'Betrag', 'Währung', 'Datum', 'Zeitraum'];
  const headerRow = worksheet.getRow(3);
  headerRow.height = 22;
  
  headers.forEach((header, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = header;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4285F4' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
    };
  });

  // Data rows
  let rowIndex = 4;
  summary.invoices.forEach((invoice, idx) => {
    const row = worksheet.getRow(rowIndex);
    const amount = invoice.amount / 100; // Convert from cents
    
    row.getCell(1).value = idx + 1;
    row.getCell(2).value = invoice.toolName || 'Unknown';
    row.getCell(3).value = invoice.companyName || 'Unknown';
    row.getCell(4).value = amount;
    row.getCell(4).numFmt = '#,##0.00';
    row.getCell(5).value = invoice.currency;
    row.getCell(6).value = invoice.invoiceDate ? invoice.invoiceDate.toLocaleDateString('de-DE') : '';
    row.getCell(7).value = invoice.period || '';

    // Styling
    for (let col = 1; col <= 7; col++) {
      const cell = row.getCell(col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
      };
      
      if (col === 1 || col === 4 || col === 5 || col === 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    }
    
    rowIndex++;
  });

  // Summary section
  const summaryStartRow = rowIndex + 1;
  
  // USD Sum
  const usdRow = worksheet.getRow(summaryStartRow);
  usdRow.getCell(2).value = 'Summe USD:';
  usdRow.getCell(2).font = { bold: true };
  usdRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
  usdRow.getCell(4).value = summary.totalUSD / 100;
  usdRow.getCell(4).numFmt = '#,##0.00';
  usdRow.getCell(4).font = { bold: true };
  usdRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F3F3' } };
  usdRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
  usdRow.getCell(5).value = 'USD';
  usdRow.getCell(5).font = { bold: true };
  usdRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F3F3' } };
  usdRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };

  // EUR Sum
  const eurRow = worksheet.getRow(summaryStartRow + 1);
  eurRow.getCell(2).value = 'Summe EUR:';
  eurRow.getCell(2).font = { bold: true };
  eurRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
  eurRow.getCell(4).value = summary.totalEUR / 100;
  eurRow.getCell(4).numFmt = '#,##0.00';
  eurRow.getCell(4).font = { bold: true };
  eurRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F3F3' } };
  eurRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
  eurRow.getCell(5).value = 'EUR';
  eurRow.getCell(5).font = { bold: true };
  eurRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F3F3' } };
  eurRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };

  // Exchange rate
  const exchangeRow = worksheet.getRow(summaryStartRow + 3);
  exchangeRow.getCell(2).value = 'Wechselkurs USD→EUR:';
  exchangeRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
  exchangeRow.getCell(4).value = exchangeRate;
  exchangeRow.getCell(4).numFmt = '0.0000';
  exchangeRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
  exchangeRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
  exchangeRow.getCell(5).value = '(anpassbar)';
  exchangeRow.getCell(5).font = { italic: true, size: 9, color: { argb: 'FF666666' } };
  exchangeRow.getCell(5).alignment = { horizontal: 'left', vertical: 'middle' };

  // Total in EUR
  const totalRow = worksheet.getRow(summaryStartRow + 4);
  totalRow.getCell(2).value = 'GESAMTSUMME (EUR):';
  totalRow.getCell(2).font = { bold: true, size: 11, color: { argb: 'FFD32F2F' } };
  totalRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
  totalRow.getCell(4).value = summary.totalInEUR / 100;
  totalRow.getCell(4).numFmt = '#,##0.00';
  totalRow.getCell(4).font = { bold: true, size: 11, color: { argb: 'FFD32F2F' } };
  totalRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
  totalRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
  totalRow.getCell(4).border = {
    top: { style: 'medium', color: { argb: 'FFD32F2F' } },
    left: { style: 'medium', color: { argb: 'FFD32F2F' } },
    bottom: { style: 'medium', color: { argb: 'FFD32F2F' } },
    right: { style: 'medium', color: { argb: 'FFD32F2F' } }
  };
  totalRow.getCell(5).value = 'EUR';
  totalRow.getCell(5).font = { bold: true, size: 11, color: { argb: 'FFD32F2F' } };
  totalRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
  totalRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
  totalRow.getCell(5).border = {
    top: { style: 'medium', color: { argb: 'FFD32F2F' } },
    left: { style: 'medium', color: { argb: 'FFD32F2F' } },
    bottom: { style: 'medium', color: { argb: 'FFD32F2F' } },
    right: { style: 'medium', color: { argb: 'FFD32F2F' } }
  };

  // Instructions
  const instructionRow = summaryStartRow + 7;
  worksheet.mergeCells(`A${instructionRow}:G${instructionRow}`);
  const instrCell = worksheet.getCell(`A${instructionRow}`);
  instrCell.value = 'ANLEITUNG: Fügen Sie neue Zeilen oberhalb der Summenzeilen ein, um weitere Tools hinzuzufügen. Der Wechselkurs kann angepasst werden.';
  instrCell.font = { bold: true, size: 10, color: { argb: 'FF1A73E8' } };
  instrCell.alignment = { horizontal: 'left', vertical: 'middle' };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Generate DATEV-compatible CSV export
 * DATEV format for German accounting software
 */
export async function generateDatevExport(invoicesList: Invoice[], month: string): Promise<Buffer> {
  // DATEV CSV Header
  const headers = [
    'Umsatz (ohne Soll/Haben-Kz)',
    'Soll/Haben-Kennzeichen',
    'WKZ Umsatz',
    'Kurs',
    'Basis-Umsatz',
    'WKZ Basis-Umsatz',
    'Konto',
    'Gegenkonto (ohne BU-Schlüssel)',
    'BU-Schlüssel',
    'Belegdatum',
    'Belegfeld 1',
    'Belegfeld 2',
    'Skonto',
    'Buchungstext',
    'Postensperre',
    'Diverse Adressnummer',
    'Geschäftspartnerbank',
    'Sachverhalt',
    'Zinssperre',
    'Beleglink',
    'Beleginfo - Art 1',
    'Beleginfo - Inhalt 1',
    'Beleginfo - Art 2',
    'Beleginfo - Inhalt 2',
  ];

  const rows: string[] = [];
  rows.push(headers.join(';'));

  for (const invoice of invoicesList) {
    const amount = (invoice.amount / 100).toFixed(2).replace('.', ',');
    const date = invoice.invoiceDate 
      ? `${invoice.invoiceDate.getDate().toString().padStart(2, '0')}${(invoice.invoiceDate.getMonth() + 1).toString().padStart(2, '0')}`
      : '';
    
    const row = [
      amount,                              // Umsatz
      'S',                                 // Soll
      invoice.currency || 'EUR',           // Währung
      '',                                  // Kurs
      '',                                  // Basis-Umsatz
      '',                                  // WKZ Basis
      '4900',                              // Konto (Fremdleistungen)
      '70000',                             // Gegenkonto (Kreditor)
      '',                                  // BU-Schlüssel
      date,                                // Belegdatum
      invoice.fileName?.substring(0, 12) || '',  // Belegfeld 1
      '',                                  // Belegfeld 2
      '',                                  // Skonto
      `${invoice.toolName || ''} - ${invoice.companyName || ''}`.substring(0, 60), // Buchungstext
      '',                                  // Postensperre
      '',                                  // Adressnummer
      '',                                  // Geschäftspartnerbank
      '',                                  // Sachverhalt
      '',                                  // Zinssperre
      invoice.fileUrl || '',               // Beleglink
      'Lieferant',                         // Beleginfo Art 1
      invoice.companyName || '',           // Beleginfo Inhalt 1
      'Tool',                              // Beleginfo Art 2
      invoice.toolName || '',              // Beleginfo Inhalt 2
    ];
    
    rows.push(row.join(';'));
  }

  return Buffer.from(rows.join('\r\n'), 'utf-8');
}

/**
 * Generate PDF Report
 * Simple HTML-to-PDF report
 */
export async function generatePdfReport(invoicesList: Invoice[], projects: any[], month: string): Promise<Buffer> {
  const monthName = new Date(month + '-01').toLocaleDateString('de-DE', { 
    year: 'numeric', 
    month: 'long' 
  });

  const totalAmount = invoicesList.reduce((sum, inv) => sum + inv.amount, 0) / 100;
  const paidCount = invoicesList.filter(inv => inv.paymentStatus === 'paid').length;
  const pendingCount = invoicesList.filter(inv => inv.paymentStatus === 'pending').length;

  // Group by project
  const byProject: Record<string, { name: string; color: string; invoices: Invoice[]; total: number }> = {};
  for (const invoice of invoicesList) {
    const projectId = invoice.projectId?.toString() || 'none';
    const project = projects.find(p => p.id === invoice.projectId);
    
    if (!byProject[projectId]) {
      byProject[projectId] = {
        name: project?.name || 'Ohne Projekt',
        color: project?.color || '#666666',
        invoices: [],
        total: 0,
      };
    }
    byProject[projectId].invoices.push(invoice);
    byProject[projectId].total += invoice.amount;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #000; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #000; }
    .header h1 { font-size: 28px; font-weight: 600; margin-bottom: 8px; }
    .header p { color: #666; font-size: 14px; }
    .stats { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .stat { text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; flex: 1; margin: 0 10px; }
    .stat:first-child { margin-left: 0; }
    .stat:last-child { margin-right: 0; }
    .stat-value { font-size: 32px; font-weight: 600; }
    .stat-label { color: #666; font-size: 12px; text-transform: uppercase; margin-top: 4px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .color-dot { width: 12px; height: 12px; border-radius: 50%; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px; background: #000; color: #fff; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
    .amount { text-align: right; font-family: monospace; }
    .total-row { background: #f5f5f5; font-weight: 600; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Rechnungsreport</h1>
    <p>${monthName}</p>
  </div>
  
  <div class="stats">
    <div class="stat">
      <div class="stat-value">€${totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</div>
      <div class="stat-label">Gesamtausgaben</div>
    </div>
    <div class="stat">
      <div class="stat-value">${invoicesList.length}</div>
      <div class="stat-label">Rechnungen</div>
    </div>
    <div class="stat">
      <div class="stat-value">${paidCount}</div>
      <div class="stat-label">Bezahlt</div>
    </div>
    <div class="stat">
      <div class="stat-value">${pendingCount}</div>
      <div class="stat-label">Offen</div>
    </div>
  </div>

  ${Object.entries(byProject).map(([id, data]) => `
    <div class="section">
      <div class="section-title">
        <span class="color-dot" style="background: ${data.color}"></span>
        ${data.name}
        <span style="color: #666; font-weight: 400; font-size: 14px;">(€${(data.total / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })})</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Tool/Service</th>
            <th>Firma</th>
            <th>Datum</th>
            <th class="amount">Betrag</th>
          </tr>
        </thead>
        <tbody>
          ${data.invoices.map(inv => `
            <tr>
              <td>${inv.toolName || '—'}</td>
              <td>${inv.companyName || '—'}</td>
              <td>${inv.invoiceDate ? inv.invoiceDate.toLocaleDateString('de-DE') : '—'}</td>
              <td class="amount">€${(inv.amount / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('')}

  <div class="footer">
    <p>Erstellt am ${new Date().toLocaleDateString('de-DE')} · Invoice Calculator</p>
  </div>
</body>
</html>
  `;

  // For now, return HTML as PDF placeholder (in production use puppeteer or similar)
  // This creates a simple HTML file that can be printed as PDF
  return Buffer.from(html, 'utf-8');
}
