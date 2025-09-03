import React, { useState } from 'react';
import jsPDF from 'jspdf';

// Optional jsPDF AutoTable - gracefully handles missing dependency
declare module 'jspdf' {
  interface jsPDF {
    autoTable?: (options: any) => jsPDF;
  }
}

// Try to import jspdf-autotable, but handle if it's not installed
let autoTableAvailable = false;
try {
  require('jspdf-autotable');
  autoTableAvailable = true;
} catch (error) {
  console.warn('jspdf-autotable not installed - PDF export will use basic formatting');
}

interface InvoiceTableProps {
  data: any;
  fileName: string;
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({ data, fileName }) => {
  const [selectedTable, setSelectedTable] = useState<number>(0);

  const formatColumnHeader = (header: string): string => {
    const headerMappings: { [key: string]: string } = {
      'Serial_Number': 'S.No.',
      'Product_Description': 'Product Description',
      'Batch_Number': 'Batch No.',
      'Quantity': 'Qty',
      'Unit_Price': 'Unit Price',
      'Total_Amount': 'Total Amount',
      'HSN_Code': 'HSN Code',
      'GST_Details': 'GST %',
      'Discount': 'Discount',
      'Expiry_Date': 'Expiry Date',
      'Calculated_Total': 'Calc. Total'
    };
    
    return headerMappings[header] || header.replace(/_/g, ' ');
  };

  const formatCellValue = (value: any, header: string): React.ReactNode => {
    if (!value) return '-';
    
    const stringValue = String(value);
    
    switch (header) {
      case 'Unit_Price':
      case 'Total_Amount':
      case 'Calculated_Total':
        return <span className="currency-value">{stringValue}</span>;
        
      case 'GST_Details':
        if (stringValue.includes('%')) {
          return <span className="gst-percentage">{stringValue}</span>;
        }
        if (stringValue.includes('₹')) {
          return <span className="gst-amount">{stringValue}</span>;
        }
        return stringValue;
        
      case 'HSN_Code':
        return <span className="hsn-code">{stringValue}</span>;
        
      case 'Batch_Number':
        return <span className="batch-number">{stringValue}</span>;
        
      case 'Quantity':
        return <span className="quantity">{stringValue}</span>;
        
      case 'Product_Description':
        return <span className="product-name" title={stringValue}>
          {stringValue.length > 30 ? `${stringValue.substring(0, 30)}...` : stringValue}
        </span>;
        
      default:
        return stringValue;
    }
  };

  const exportInvoiceTableToPDF = (table: any, headers: string[], tableIndex: number) => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text(`Invoice Table - ${fileName}`, 14, 20);
      
      // Add metadata
      doc.setFontSize(10);
      let yPos = 35;
      
      if (table.invoiceMetadata) {
        const metadata = table.invoiceMetadata;
        doc.text(`Items: ${metadata.totalItems}`, 14, yPos);
        doc.text(`Total Amount: ${metadata.formattedTotalAmount}`, 70, yPos);
        
        let xPos = 130;
        if (metadata.hasGSTDetails) {
          doc.text('GST: Yes', xPos, yPos);
          xPos += 25;
        }
        if (metadata.hasBatchNumbers) {
          doc.text('Batch: Yes', xPos, yPos);
          xPos += 30;
        }
        if (metadata.hasHSNCodes) {
          doc.text('HSN: Yes', xPos, yPos);
        }
        
        yPos += 15;
      }

      if (autoTableAvailable && doc.autoTable) {
        // Enhanced PDF with AutoTable

        // Prepare table data
        const tableHeaders = headers.map(formatColumnHeader);
        const tableData = table.rows.map((row: any) => 
          headers.map((header: string) => {
            const value = row[header] || '';
            return String(value).replace(/₹/g, 'Rs '); // PDF-friendly currency
          })
        );

        // Create the enhanced table
        doc.autoTable({
          startY: yPos,
          head: [tableHeaders],
          body: tableData,
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 2
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { top: 10, right: 14, bottom: 10, left: 14 },
          tableWidth: 'wrap'
        });

        // Add summary if available
        if (table.invoiceMetadata) {
          const finalY = (doc as any).lastAutoTable?.finalY || yPos + 100;
          doc.setFontSize(12);
          doc.text('Summary:', 14, finalY + 15);
          doc.setFontSize(10);
          doc.text(`Total Items: ${table.invoiceMetadata.totalItems}`, 14, finalY + 25);
          doc.text(`Grand Total: ${table.invoiceMetadata.formattedTotalAmount}`, 14, finalY + 35);
        }

      } else {
        // Basic PDF without AutoTable
        
        // Add headers
        doc.setFontSize(9);
        const startX = 14;
        let currentX = startX;
        const columnWidth = 25;
        
        headers.forEach((header: string, index: number) => {
          const headerText = formatColumnHeader(header);
          doc.text(headerText, currentX, yPos);
          currentX += columnWidth;
        });
        
        yPos += 10;
        
        // Add data rows
        doc.setFontSize(8);
        table.rows.slice(0, 20).forEach((row: any, rowIndex: number) => { // Limit rows to fit on page
          currentX = startX;
          headers.forEach((header: string) => {
            const value = String(row[header] || '').replace(/₹/g, 'Rs ');
            const displayValue = value.length > 15 ? value.substring(0, 12) + '...' : value;
            doc.text(displayValue, currentX, yPos);
            currentX += columnWidth;
          });
          yPos += 6;
          
          // Check if we need a new page
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
        });

        // Add summary
        if (table.invoiceMetadata) {
          yPos += 10;
          doc.setFontSize(10);
          doc.text(`Total Items: ${table.invoiceMetadata.totalItems}`, startX, yPos);
          doc.text(`Grand Total: ${table.invoiceMetadata.formattedTotalAmount}`, startX, yPos + 8);
        }
      }

      // Save the PDF
      const timestamp = new Date().getTime();
      doc.save(`invoice-table-${tableIndex + 1}-${timestamp}.pdf`);

    } catch (error) {
      console.error('❌ PDF export error:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const exportInvoiceTableToExcel = (table: any, headers: string[], tableIndex: number) => {
    try {
      // Create CSV content
      const csvHeaders = headers.map((header: string) => formatColumnHeader(header)).join(',');
      const csvRows = table.rows.map((row: any) => 
        headers.map((header: string) => {
          const value = row[header] || '';
          const stringValue = String(value).replace(/"/g, '""'); // Escape quotes
          return `"${stringValue}"`; // Wrap in quotes for CSV
        }).join(',')
      );
      
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `invoice-table-${tableIndex + 1}-${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
    } catch (error) {
      console.error('❌ Excel export error:', error);
      alert('Failed to export Excel. Please try again.');
    }
  };

  if (!data || !data.tables || data.tables.length === 0) {
    return (
      <div className="invoice-table-container">
        <div className="empty-state">
          <h3>📄 No Invoice Data Available</h3>
          <p>No structured table data found in the processed file.</p>
        </div>
      </div>
    );
  }

  const tables = data.tables;
  const currentTable = tables[selectedTable];

  if (!currentTable || !currentTable.rows || currentTable.rows.length === 0) {
    return (
      <div className="invoice-table-container">
        <div className="empty-state">
          <h3>📄 No Table Data Available</h3>
          <p>The selected table contains no data rows.</p>
        </div>
      </div>
    );
  }

  const headers = currentTable.headers || Object.keys(currentTable.rows[0]).filter(key => key !== 'rowNumber');

  return (
    <div className="invoice-table-container">
      <div className="invoice-header">
        <div className="invoice-title">
          <h3>🧾 Invoice Data: {fileName}</h3>
          {data.metadata && (
            <div className="extraction-info">
              <span className="ocr-engine">Engine: {data.metadata.ocrEngine || 'tesseract'}</span>
              <span className="confidence-badge">🎯 {data.metadata.confidence}% confidence</span>
            </div>
          )}
        </div>
        
        {tables.length > 1 && (
          <div className="table-selector">
            <label>Table: </label>
            <select 
              value={selectedTable} 
              onChange={(e) => setSelectedTable(Number(e.target.value))}
            >
              {tables.map((table: any, index: number) => (
                <option key={index} value={index}>
                  Table {index + 1} ({table.rows?.length || 0} items)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="table-metadata">
        <div className="table-stats">
          <span>📏 {currentTable.rowCount || currentTable.rows.length} items</span>
          <span>📊 {headers.length} columns</span>
          {currentTable.confidence && (
            <span className="table-confidence">🎯 {currentTable.confidence}% accuracy</span>
          )}
        </div>
        
        {currentTable.invoiceMetadata && (
          <div className="invoice-summary">
            <span className="total-amount">💰 {currentTable.invoiceMetadata.formattedTotalAmount}</span>
            <div className="feature-badges">
              {currentTable.invoiceMetadata.hasGSTDetails && <span className="feature-badge gst">🏷️ GST</span>}
              {currentTable.invoiceMetadata.hasBatchNumbers && <span className="feature-badge batch">📦 Batch</span>}
              {currentTable.invoiceMetadata.hasHSNCodes && <span className="feature-badge hsn">🔢 HSN</span>}
            </div>
          </div>
        )}
      </div>
      
      <div className="invoice-table-wrapper">
        <table className="invoice-data-table">
          <thead>
            <tr>
              {headers.map((header: string) => (
                <th key={header} className={`col-${header.toLowerCase()}`}>
                  {formatColumnHeader(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentTable.rows.map((row: any, index: number) => (
              <tr key={index} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                {headers.map((header: string) => (
                  <td key={header} className={`col-${header.toLowerCase()}`}>
                    {formatCellValue(row[header], header)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="export-actions">
        <button 
          onClick={() => exportInvoiceTableToPDF(currentTable, headers, selectedTable)}
          className="export-button primary"
        >
          📄 Export to PDF
        </button>
        <button 
          onClick={() => exportInvoiceTableToExcel(currentTable, headers, selectedTable)}
          className="export-button secondary"
        >
          📊 Export to Excel
        </button>
      </div>
    </div>
  );
};

export default InvoiceTable;
