import React, { useMemo } from 'react';
import jsPDF from 'jspdf';

// Optional Material-UI DataGrid - gracefully handles missing dependency
let DataGrid: any = null;
let GridColDef: any = null;
let GridToolbar: any = null;

let muiAvailable = false;
try {
  const mui = require('@mui/x-data-grid');
  DataGrid = mui.DataGrid;
  GridColDef = mui.GridColDef;
  GridToolbar = mui.GridToolbar;
  muiAvailable = true;
} catch (error) {
  console.warn('Material-UI DataGrid not installed - using fallback table');
}

interface MaterialInvoiceTableProps {
  data: any[];
  fileName: string;
  metadata?: any;
}

const MaterialInvoiceTable: React.FC<MaterialInvoiceTableProps> = ({ data, fileName, metadata }) => {
  
  // Define columns as per specification
  const columns = useMemo(() => {
    const standardColumns = [
      {
        field: 'Product',
        headerName: 'Product',
        width: 250,
        flex: 1,
        minWidth: 200,
        sortable: true,
        filterable: true
      },
      {
        field: 'Batch',
        headerName: 'Batch',
        width: 120,
        align: 'center' as const,
        headerAlign: 'center' as const,
        fontFamily: 'monospace'
      },
      {
        field: 'HSN',
        headerName: 'HSN',
        width: 100,
        align: 'center' as const,
        headerAlign: 'center' as const,
        fontFamily: 'monospace'
      },
      {
        field: 'Qty',
        headerName: 'Qty',
        width: 80,
        type: 'number',
        align: 'right' as const,
        headerAlign: 'right' as const
      },
      {
        field: 'MRP',
        headerName: 'MRP',
        width: 100,
        type: 'number',
        align: 'right' as const,
        headerAlign: 'right' as const,
        valueFormatter: (params: any) => {
          if (typeof params.value === 'number') {
            return `₹${params.value.toFixed(2)}`;
          }
          return params.value || '';
        }
      },
      {
        field: 'Rate',
        headerName: 'Rate',
        width: 100,
        type: 'number',
        align: 'right' as const,
        headerAlign: 'right' as const,
        valueFormatter: (params: any) => {
          if (typeof params.value === 'number') {
            return `₹${params.value.toFixed(2)}`;
          }
          return params.value || '';
        }
      },
      {
        field: 'Amount',
        headerName: 'Amount',
        width: 120,
        type: 'number',
        align: 'right' as const,
        headerAlign: 'right' as const,
        valueFormatter: (params: any) => {
          if (typeof params.value === 'number') {
            return `₹${params.value.toFixed(2)}`;
          }
          return params.value || '';
        }
      },
      {
        field: 'SGST',
        headerName: 'SGST',
        width: 100,
        type: 'number',
        align: 'right' as const,
        headerAlign: 'right' as const,
        valueFormatter: (params: any) => {
          if (typeof params.value === 'number') {
            return `₹${params.value.toFixed(2)}`;
          }
          return params.value || '';
        }
      },
      {
        field: 'CGST',
        headerName: 'CGST',
        width: 100,
        type: 'number',
        align: 'right' as const,
        headerAlign: 'right' as const,
        valueFormatter: (params: any) => {
          if (typeof params.value === 'number') {
            return `₹${params.value.toFixed(2)}`;
          }
          return params.value || '';
        }
      }
    ];

    return standardColumns;
  }, []);

  // Prepare rows with IDs for DataGrid
  const rows = useMemo(() => {
    return data.map((row, index) => ({
      id: index,
      ...row,
      // Ensure numeric fields are numbers
      Qty: typeof row.Qty === 'string' ? parseFloat(row.Qty) || 0 : row.Qty || 0,
      MRP: typeof row.MRP === 'string' ? parseFloat(row.MRP) || 0 : row.MRP || 0,
      Rate: typeof row.Rate === 'string' ? parseFloat(row.Rate) || 0 : row.Rate || 0,
      Amount: typeof row.Amount === 'string' ? parseFloat(row.Amount) || 0 : row.Amount || 0,
      SGST: typeof row.SGST === 'string' ? parseFloat(row.SGST) || 0 : row.SGST || 0,
      CGST: typeof row.CGST === 'string' ? parseFloat(row.CGST) || 0 : row.CGST || 0,
    }));
  }, [data]);

  // Export PDF function matching specification
  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text(`Invoice Table - ${fileName}`, 14, 20);
      
      // Add metadata
      if (metadata) {
        doc.setFontSize(10);
        doc.text(`Items: ${rows.length}`, 14, 35);
        doc.text(`OCR Engine: ${metadata.ocrEngine}`, 70, 35);
        doc.text(`Confidence: ${metadata.confidence?.toFixed(1)}%`, 130, 35);
      }

      // Calculate totals
      const totals = rows.reduce((acc, row) => ({
        totalAmount: acc.totalAmount + (row.Amount || 0),
        totalSGST: acc.totalSGST + (row.SGST || 0),
        totalCGST: acc.totalCGST + (row.CGST || 0)
      }), { totalAmount: 0, totalSGST: 0, totalCGST: 0 });

      // Create table data
      const headers = ['Product', 'Batch', 'HSN', 'Qty', 'MRP', 'Rate', 'Amount', 'SGST', 'CGST'];
      const tableData = rows.map(row => [
        row.Product || '',
        row.Batch || '',
        row.HSN || '',
        row.Qty || '',
        `Rs ${(row.MRP || 0).toFixed(2)}`,
        `Rs ${(row.Rate || 0).toFixed(2)}`,
        `Rs ${(row.Amount || 0).toFixed(2)}`,
        `Rs ${(row.SGST || 0).toFixed(2)}`,
        `Rs ${(row.CGST || 0).toFixed(2)}`
      ]);

      // Add table using basic text positioning
      const startY = 50;
      const columnWidths = [60, 30, 25, 20, 25, 25, 30, 25, 25];
      let currentY = startY;

      // Headers
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      let currentX = 14;
      headers.forEach((header, index) => {
        doc.text(header, currentX, currentY);
        currentX += columnWidths[index];
      });
      
      currentY += 8;
      
      // Data rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      tableData.forEach(row => {
        if (currentY > 280) {
          doc.addPage();
          currentY = 20;
        }
        
        currentX = 14;
        row.forEach((cell, index) => {
          const displayText = String(cell).length > 15 ? String(cell).substring(0, 12) + '...' : String(cell);
          doc.text(displayText, currentX, currentY);
          currentX += columnWidths[index];
        });
        currentY += 6;
      });

      // Add totals
      currentY += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Totals:', 14, currentY);
      doc.text(`Amount: Rs ${totals.totalAmount.toFixed(2)}`, 14, currentY + 8);
      doc.text(`SGST: Rs ${totals.totalSGST.toFixed(2)}`, 70, currentY + 8);
      doc.text(`CGST: Rs ${totals.totalCGST.toFixed(2)}`, 120, currentY + 8);
      
      const grandTotal = totals.totalAmount + totals.totalSGST + totals.totalCGST;
      doc.text(`Grand Total: Rs ${grandTotal.toFixed(2)}`, 14, currentY + 16);

      // Save the PDF
      const timestamp = new Date().getTime();
      doc.save(`invoice-${timestamp}.pdf`);

    } catch (error) {
      console.error('❌ PDF export error:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>📄 No Invoice Data Available</h3>
        <p>No structured table data found in the processed file.</p>
      </div>
    );
  }

  if (muiAvailable && DataGrid) {
    // Render Material-UI DataGrid
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '16px'
        }}>
          <div>
            <h3>🧾 Invoice Data - {fileName}</h3>
            {metadata && (
              <div style={{ fontSize: '0.9em', color: '#666', marginTop: '8px' }}>
                <span style={{ marginRight: '16px' }}>Engine: {metadata.ocrEngine}</span>
                <span style={{ 
                  background: '#d4edda', 
                  color: '#155724', 
                  padding: '4px 8px', 
                  borderRadius: '4px' 
                }}>
                  🎯 {metadata.confidence?.toFixed(1)}% confidence
                </span>
              </div>
            )}
          </div>
          
          <button 
            onClick={exportPDF}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9em',
              fontWeight: '500'
            }}
          >
            📄 Export PDF
          </button>
        </div>

        <div style={{ height: 500, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
            checkboxSelection
            disableSelectionOnClick
            components={{
              Toolbar: GridToolbar,
            }}
            sx={{
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #e0e0e0',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f5f5f5',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #dee2e6',
              }
            }}
          />
        </div>

        {/* Summary */}
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          borderTop: '1px solid #dee2e6' 
        }}>
          <h4>📊 Summary</h4>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <span>📋 Total Items: {rows.length}</span>
            <span>💰 Total Amount: ₹{rows.reduce((sum, row) => sum + (row.Amount || 0), 0).toFixed(2)}</span>
            <span>🏷️ Total SGST: ₹{rows.reduce((sum, row) => sum + (row.SGST || 0), 0).toFixed(2)}</span>
            <span>🏷️ Total CGST: ₹{rows.reduce((sum, row) => sum + (row.CGST || 0), 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback HTML table
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '16px'
      }}>
        <div>
          <h3>🧾 Invoice Data - {fileName}</h3>
          <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: '0.9em' }}>
            Material-UI not available - using fallback table
          </p>
          {metadata && (
            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '8px' }}>
              <span style={{ marginRight: '16px' }}>Engine: {metadata.ocrEngine}</span>
              <span style={{ 
                background: '#d4edda', 
                color: '#155724', 
                padding: '4px 8px', 
                borderRadius: '4px' 
              }}>
                🎯 {metadata.confidence?.toFixed(1)}% confidence
              </span>
            </div>
          )}
        </div>
        
        <button 
          onClick={exportPDF}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9em',
            fontWeight: '500'
          }}
        >
          📄 Export PDF
        </button>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #dee2e6', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              {columns.map((col) => (
                <th key={col.field} style={{ 
                  padding: '12px 8px', 
                  textAlign: col.align || 'left',
                  borderBottom: '2px solid #dee2e6',
                  fontWeight: '600',
                  color: '#495057'
                }}>
                  {col.headerName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} style={{ 
                background: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
              }}>
                {columns.map((col) => (
                  <td key={col.field} style={{ 
                    padding: '10px 8px',
                    borderBottom: '1px solid #dee2e6',
                    textAlign: col.align || 'left',
                    fontFamily: col.fontFamily || 'inherit'
                  }}>
                    {col.valueFormatter ? 
                      col.valueFormatter({ value: row[col.field] }) : 
                      (row[col.field] || '')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        borderTop: '1px solid #dee2e6' 
      }}>
        <h4>📊 Summary</h4>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <span>📋 Total Items: {rows.length}</span>
          <span>💰 Total Amount: ₹{rows.reduce((sum, row) => sum + (row.Amount || 0), 0).toFixed(2)}</span>
          <span>🏷️ Total SGST: ₹{rows.reduce((sum, row) => sum + (row.SGST || 0), 0).toFixed(2)}</span>
          <span>🏷️ Total CGST: ₹{rows.reduce((sum, row) => sum + (row.CGST || 0), 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default MaterialInvoiceTable;
