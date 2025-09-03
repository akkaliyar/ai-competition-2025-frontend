import React, { useState, useMemo } from 'react';
import { Search, Download, Filter, Eye, EyeOff } from 'lucide-react';

interface StructuredTableViewProps {
  data: any;
  fileName: string;
  fileType: string;
  onClose: () => void;
}

interface TableData {
  id: string;
  name: string;
  headers: string[];
  data: any[];
  rowCount: number;
  columnCount: number;
  confidence: number;
  source: string;
}

const StructuredTableView: React.FC<StructuredTableViewProps> = ({
  data,
  fileName,
  fileType,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [showOnlyValues, setShowOnlyValues] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Parse data if it's a string, otherwise use as is
  const parsedData = useMemo(() => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error('Error parsing structured table data:', error);
        return null;
      }
    }
    return data;
  }, [data]);

  // Get available tables and filter/search them
  const { tables, filteredTables } = useMemo(() => {
    if (!parsedData) {
      return { tables: [], filteredTables: [] };
    }

    let availableTables: string[] = [];
    
    if (Array.isArray(parsedData)) {
      // If data is an array, treat each item as a table
      availableTables = parsedData.map((_, index) => `Table ${index + 1}`);
    } else if (typeof parsedData === 'object') {
      // If data is an object, get its keys as table names
      availableTables = Object.keys(parsedData);
    }

    // Filter tables based on search term
    const filtered = availableTables.filter(table => 
      table.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return { tables: availableTables, filteredTables: filtered };
  }, [parsedData, searchTerm]);

  // Set initial selected table
  useMemo(() => {
    if (tables.length > 0 && !selectedTable) {
      setSelectedTable(tables[0]);
    }
  }, [tables, selectedTable]);

  // Get current table data
  const currentTableData = useMemo(() => {
    if (!parsedData || !selectedTable) return null;

    let tableData: any[] = [];
    
    if (Array.isArray(parsedData)) {
      const tableIndex = tables.indexOf(selectedTable);
      if (tableIndex >= 0) {
        tableData = parsedData[tableIndex] || [];
      }
    } else if (typeof parsedData === 'object') {
      tableData = parsedData[selectedTable] || [];
    }

    // Sort data if sort column is set
    if (sortColumn && tableData.length > 0) {
      tableData = [...tableData].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return tableData;
  }, [parsedData, selectedTable, tables, sortColumn, sortDirection]);

  // Get table headers
  const tableHeaders = useMemo(() => {
    if (!currentTableData || currentTableData.length === 0) return [];
    
    const firstRow = currentTableData[0];
    if (typeof firstRow === 'object' && firstRow !== null) {
      return Object.keys(firstRow);
    }
    return [];
  }, [currentTableData]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    if (!currentTableData || currentTableData.length === 0) return;

    const headers = tableHeaders;
    const csvContent = [
      headers.join(','),
      ...currentTableData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_${selectedTable}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!parsedData) {
    return (
      <div className="structured-table-view">
        <div className="view-header">
          <h2>Structured Table View</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="error-message">
          <p>No structured data available for this file.</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="structured-table-view">
      <div className="view-header">
        <h2>Structured Table View</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="file-info">
        <h3>{fileName}</h3>
        <span className="file-type">{fileType}</span>
      </div>

      <div className="view-controls">
        <div className="search-controls">
          <input
            type="text"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-box"
          />
          
          {tables.length > 1 && (
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="table-selector"
            >
              {filteredTables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
          )}
        </div>

        <div className="action-controls">
          <button
            className={`toggle-btn ${showOnlyValues ? 'active' : ''}`}
            onClick={() => setShowOnlyValues(!showOnlyValues)}
          >
            {showOnlyValues ? 'Show All' : 'Values Only'}
          </button>
          
          <button className="export-btn" onClick={exportToCSV}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="table-container">
        {currentTableData && currentTableData.length > 0 ? (
          <>
            <div className="table-header">
              <h4>{selectedTable}</h4>
              <div className="table-stats">
                {currentTableData.length} rows × {tableHeaders.length} columns
              </div>
            </div>
            
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {tableHeaders.map(header => (
                      <th
                        key={header}
                        className="sortable"
                        onClick={() => handleSort(header)}
                      >
                        {header}
                        {sortColumn === header && (
                          <span className="sort-indicator">
                            {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentTableData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {tableHeaders.map(header => (
                        <td key={header} className="table-cell">
                          {showOnlyValues ? (
                            <span className="cell-value">{row[header] || ''}</span>
                          ) : (
                            <>
                              <span className="cell-header">{header}: </span>
                              <span className="cell-value">{row[header] || ''}</span>
                            </>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty-table">
            {tables.length === 0 ? (
              <div className="no-tables">
                <p>No structured tables found in this file.</p>
                <p>The file may not contain tabular data or the data format is not supported.</p>
              </div>
            ) : (
              <p>No data available for the selected table.</p>
            )}
          </div>
        )}
      </div>

      {parsedData && typeof parsedData === 'object' && (
        <div className="metadata-section">
          <h4>Processing Metadata</h4>
          <div className="metadata-grid">
            <div className="metadata-item">
              <span className="metadata-label">Data Type:</span>
              <span className="metadata-value">{Array.isArray(parsedData) ? 'Array' : 'Object'}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Total Tables:</span>
              <span className="metadata-value">{tables.length}</span>
            </div>
            {currentTableData && (
              <div className="metadata-item">
                <span className="metadata-label">Current Table Rows:</span>
                <span className="metadata-value">{currentTableData.length}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StructuredTableView;
