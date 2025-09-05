import React, { useState } from 'react';
import axios from 'axios';
import { ProcessedFile, InvoiceData } from '../types/ProcessedFile';

import { API_BASE_URL } from '../config/api';

interface ResultsDisplayProps {
  files: ProcessedFile[];
  onRefresh: () => void;
  loading?: boolean;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ files, onRefresh, loading = false }) => {
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'originalName' | 'fileType' | 'fileSize'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'pdf' | 'excel'>('all');
  const [loadingFileDetails, setLoadingFileDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [showStructuredView, setShowStructuredView] = useState<'json' | false>(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to check if data is in invoice format
  const isInvoiceData = (data: any): data is InvoiceData => {
    return data && 
           typeof data === 'object' && 
           'invoiceNo' in data && 
           'items' in data && 
           Array.isArray(data.items) &&
           'grandTotal' in data;
  };

  // Render invoice data in a structured format
  const renderInvoiceData = (invoiceData: InvoiceData, fileInfo?: ProcessedFile) => {
    return (
      <div className="invoice-display">
        <div className="invoice-header">
          <h3>📋 Invoice</h3>
          <div className="invoice-info">
            {/* File Information */}
            {fileInfo && (
              <>
                <div className="info-row">
                  <span className="label">File Name:</span>
                  <span className="value">{fileInfo.fileName || fileInfo.originalName || fileInfo.filename || 'Unknown'}</span>
                </div>
                <div className="info-row">
                  <span className="label">File Size:</span>
                  <span className="value">{formatFileSize(typeof fileInfo.fileSize === 'string' ? parseInt(fileInfo.fileSize) : fileInfo.fileSize)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Processed Status:</span>
                  <span className="value">{fileInfo.processedStatus || 'Unknown'}</span>
                </div>
                <div className="info-row">
                  <span className="label">File Type:</span>
                  <span className="value">{getFileTypeLabel(fileInfo.fileType, fileInfo.fileName || fileInfo.originalName || fileInfo.filename)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Processed Date:</span>
                  <span className="value">{formatDate(fileInfo.processedDate || fileInfo.createdAt)}</span>
                </div>
              </>
            )}
            <div className="info-row">
              <span className="label">Invoice No:</span>
              <span className="value">{invoiceData.invoiceNo}</span>
            </div>
            <div className="info-row">
              <span className="label">Date:</span>
              <span className="value">{invoiceData.date}</span>
            </div>
            <div className="info-row">
              <span className="label">Shop Name:</span>
              <span className="value">{invoiceData.shopName}</span>
            </div>
            {invoiceData.shopAddress && (
              <div className="info-row">
                <span className="label">Address:</span>
                <span className="value">{invoiceData.shopAddress}</span>
              </div>
            )}
            {invoiceData.phone && invoiceData.phone.length > 0 && (
              <div className="info-row">
                <span className="label">Phone:</span>
                <span className="value">{invoiceData.phone.join(', ')}</span>
              </div>
            )}
            <div className="info-row">
              <span className="label">Patient Name:</span>
              <span className="value">{invoiceData.patientName}</span>
            </div>
            {invoiceData.patientPhone && (
              <div className="info-row">
                <span className="label">Patient Phone:</span>
                <span className="value">{invoiceData.patientPhone}</span>
              </div>
            )}
            {invoiceData.prescribedBy && (
              <div className="info-row">
                <span className="label">Prescribed By:</span>
                <span className="value">{invoiceData.prescribedBy}</span>
              </div>
            )}
          </div>
        </div>

        <div className="invoice-items">
          <h4>🛒 Items</h4>
          <div className="items-table">
            <div className="table-header">
              <div className="col-sno">S.No</div>
              <div className="col-description">Item Description</div>
              <div className="col-pack">Pack</div>
              <div className="col-mrp">MRP</div>
              <div className="col-batch">Batch No</div>
              <div className="col-exp">Exp</div>
              <div className="col-qty">Qty</div>
              <div className="col-rate">Rate</div>
              <div className="col-amount">Amount</div>
            </div>
            {invoiceData.items.map((item, index) => (
              <div key={index} className="table-row">
                <div className="col-sno">{item.sNo}</div>
                <div className="col-description">{item.itemDescription}</div>
                <div className="col-pack">{item.pack}</div>
                <div className="col-mrp">₹{item.mrp.toFixed(2)}</div>
                <div className="col-batch">{item.batchNo}</div>
                <div className="col-exp">{item.exp}</div>
                <div className="col-qty">{item.qty}</div>
                <div className="col-rate">₹{item.rate.toFixed(2)}</div>
                <div className="col-amount">₹{item.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="invoice-summary">
          <h4>💰 Summary</h4>
          <div className="summary-details">
            <div className="summary-row">
              <span className="label">Total Qty:</span>
              <span className="value">{invoiceData.totalQty}</span>
            </div>
            <div className="summary-row">
              <span className="label">Sub Total:</span>
              <span className="value">₹{parseFloat(invoiceData.subTotal).toFixed(2)}</span>
            </div>
            {parseFloat(invoiceData.lessDiscount) > 0 && (
              <div className="summary-row">
                <span className="label">Less Discount:</span>
                <span className="value">₹{parseFloat(invoiceData.lessDiscount).toFixed(2)}</span>
              </div>
            )}
            {parseFloat(invoiceData.otherAdj) > 0 && (
              <div className="summary-row">
                <span className="label">Other Adjustment:</span>
                <span className="value">₹{parseFloat(invoiceData.otherAdj).toFixed(2)}</span>
              </div>
            )}
            {parseFloat(invoiceData.roundOff) > 0 && (
              <div className="summary-row">
                <span className="label">Round Off:</span>
                <span className="value">₹{parseFloat(invoiceData.roundOff).toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row total-row">
              <span className="label">Grand Total:</span>
              <span className="value">₹{parseFloat(invoiceData.grandTotal).toFixed(2)}</span>
            </div>
            {invoiceData.amountInWords && (
              <div className="summary-row">
                <span className="label">Amount in Words:</span>
                <span className="value">{invoiceData.amountInWords}</span>
              </div>
            )}
            {invoiceData.message && (
              <div className="summary-row">
                <span className="label">Message:</span>
                <span className="value">{invoiceData.message}</span>
              </div>
            )}
          </div>
        </div>

        {invoiceData.termsAndConditions && invoiceData.termsAndConditions.length > 0 && (
          <div className="invoice-terms">
            <h4>📝 Terms & Conditions</h4>
            <ul>
              {invoiceData.termsAndConditions.map((term, index) => (
                <li key={index}>{term}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const getFileIcon = (fileType?: string, fileName?: string): string => {
    // If fileType is provided and valid, use it
    if (fileType && fileType !== 'unknown') {
    switch (fileType) {
      case 'image': return '🖼️';
      case 'pdf': return '📕';
      case 'excel': return '📊';
      }
    }
    
    // Otherwise, infer from filename
    if (fileName) {
      const extension = fileName.toLowerCase().split('.').pop();
      switch (extension) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'webp':
          return '🖼️';
        case 'pdf':
          return '📕';
        case 'xlsx':
        case 'xls':
        case 'csv':
          return '📊';
        default:
          return '📄';
      }
    }
    
    return '📄';
  };

  const getFileTypeLabel = (fileType?: string, fileName?: string): string => {
    // If fileType is provided and valid, use it
    if (fileType && fileType !== 'unknown') {
    switch (fileType) {
      case 'image': return 'Image/OCR';
      case 'pdf': return 'PDF Document';
      case 'excel': return 'Excel Spreadsheet';
      }
    }
    
    // Otherwise, infer from filename
    if (fileName) {
      const extension = fileName.toLowerCase().split('.').pop();
      switch (extension) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'webp':
          return 'Image/OCR';
        case 'pdf':
          return 'PDF Document';
        case 'xlsx':
        case 'xls':
        case 'csv':
          return 'Excel Spreadsheet';
        default:
          return 'Document';
      }
    }
    
    return 'Document';
  };

  const sortFiles = (files: ProcessedFile[]): ProcessedFile[] => {
    return [...files].sort((a, b) => {
      let aValue: any = a[sortBy === 'date' ? 'createdAt' : sortBy];
      let bValue: any = b[sortBy === 'date' ? 'createdAt' : sortBy];

      if (sortBy === 'date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortBy === 'originalName') {
        aValue = (aValue || '').toLowerCase();
        bValue = (bValue || '').toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filterFiles = (files: ProcessedFile[]): ProcessedFile[] => {
    if (filterType === 'all') return files;
    return files.filter(file => file.fileType === filterType);
  };

  const filteredAndSortedFiles = sortFiles(filterFiles(files));

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: typeof sortBy): string => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↗️' : '↘️';
  };







  // Fetch full file details including parsedContent
  const fetchFileDetails = async (fileId: number): Promise<ProcessedFile | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/files/${fileId}`);
      
      // Handle multiple response formats
      let fileData = null;
      if (response.data.success && response.data.data) {
        // Format: { success: true, data: {...} }
        fileData = response.data.data;
      } else if (response.data.status && response.data.data) {
        // Format: { status: true, data: {...} }
        fileData = response.data.data;
      } else if (response.data && typeof response.data === 'object' && 'invoiceNo' in response.data) {
        // Direct invoice data format
        fileData = response.data;
      } else if (response.data) {
        // Direct data format
        fileData = response.data;
      }
      
      return fileData;
    } catch (error) {
      console.error('Error fetching file details:', error);
      return null;
    }
  };

  // Handle viewing file details
  const handleViewFileDetails = async (file: ProcessedFile) => {
    setLoadingFileDetails(true);
    setDetailsError(null);
    
    try {
      // If file already has parsedContent, use it directly
      if (file.parsedContent) {
        // Initialize with structured data view
        setSelectedFile({
          ...file,
          showFormattedJson: false,
          showStructuredData: true,
          showSimpleFormat: false,
          showEnhancedText: false
        });
      } else {
        // Otherwise, fetch full details from server
        const fullFileData = await fetchFileDetails(file.id);
        
        if (fullFileData) {
          // Check if the fetched data is invoice data and store it properly
          const enhancedFileData = {
            ...fullFileData,
            showFormattedJson: false,
            showStructuredData: true, // Set to true by default
            showSimpleFormat: false,
            showEnhancedText: false
          };
          
          // If the fetched data is invoice data, store it in structuredDocumentData
          if (isInvoiceData(fullFileData)) {
            enhancedFileData.structuredDocumentData = fullFileData;
            enhancedFileData.jsonResponse = fullFileData;
          }
          
          setSelectedFile(enhancedFileData);
        } else {
          setDetailsError('Failed to load file details');
        }
      }
    } catch (error) {
      console.error('Error in handleViewFileDetails:', error);
      setDetailsError(error instanceof Error ? error.message : 'Failed to load file details');
    } finally {
      setLoadingFileDetails(false);
    }
  };

  // Handle loading state
  if (loadingFileDetails) {
    return (
      <div className="results-display">
        <div className="data-table-container">
          <div className="tab-content">
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading file details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (detailsError) {
    return (
      <div className="results-display">
        <div className="data-table-container">
          <div className="tab-content">
            <div className="empty-state">
              <div className="empty-icon">❌</div>
              <h3>Error Loading File Details</h3>
              <p>{detailsError}</p>
              <button 
                className="back-btn"
                onClick={() => {
                  setDetailsError(null);
                  setSelectedFile(null);
                }}
                style={{ marginTop: '20px' }}
              >
                ← Back to Results
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedFile) {
    return (
      <div className="results-display">
        <div className="file-detail-header">
          <button 
            className="back-btn"
            onClick={() => {
              setSelectedFile(null);
              setDetailsError(null);
              setShowStructuredView(false);
            }}
          >
            ← Back to Results
          </button>
          <h2>{selectedFile.fileName || selectedFile.originalName || selectedFile.filename || 'Unknown File'}</h2>
        </div>
        
        {/* View Toggle Buttons */}
        <div className="view-toggle-controls">
          <button
            className={`toggle-btn ${!showStructuredView ? 'active' : ''}`}
            onClick={() => setShowStructuredView(false)}
          >
            📄 Raw API Data
          </button>

          <button
            className={`toggle-btn ${showStructuredView === 'json' ? 'active' : ''}`}
            onClick={() => setShowStructuredView('json')}
          >
            🔍 Invoice
          </button>

        </div>

                 {showStructuredView === 'json' ? (
           <div className="data-table-container">
             <div className="tab-content">
               <div className="json-content">
                  <div className="formatted-json-content">
                    {(() => {
                      return null;
                    })()}
                    {selectedFile.structuredDocumentData ? (
                      <div className="formatted-text-section">
                        <div className="text-preview">
                          {renderInvoiceData(selectedFile.structuredDocumentData, selectedFile)}
                        </div>
                      </div>
                    ) : selectedFile.jsonResponse ? (
                      <div className="formatted-text-section">
                        <div className="text-preview">
                          {renderInvoiceData(selectedFile.jsonResponse, selectedFile)}
                        </div>
                      </div>
                    ) : isInvoiceData(selectedFile) ? (
                      <div className="formatted-text-section">
                        <div className="text-preview">
                          {renderInvoiceData(selectedFile as InvoiceData, selectedFile)}
                        </div>
                      </div>
                    ) : (
                      <div className="formatted-text-section">
                        <div className="text-preview">
                          <p className="enhanced-text-description">
                            ❌ No invoice data available to display
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
               </div>
             </div>
           </div>
        ) : (
          <div className="data-table-container">
            <div className="tab-content">
              <div className="json-content">
                <div className="formatted-json-content">
                  <pre className="json-display">
                    {JSON.stringify((() => {
                      // Remove frontend-added objects to show only original API response
                      const { structuredDocumentData, jsonResponse, showFormattedJson, showStructuredData, showSimpleFormat, showEnhancedText, ...originalData } = selectedFile;
                      return originalData;
                    })(), null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show loading state when fetching data
  if (loading) {
    return (
      <div className="results-display">
        <div className="results-header">
          <div className="header-content">
            <h2>📋 Processing Results</h2>
            <p>Loading files...</p>
          </div>
        </div>
        <div className="data-table-container">
          <div className="tab-content">
            <div className="loading">
              <div className="spinner"></div>
              <p>Fetching latest results...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="results-display">
      <div className="results-header">
        <div className="header-content">
          <h2>📋 Processing Results</h2>
          <p>{files.length} file{files.length !== 1 ? 's' : ''} processed</p>
        </div>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={onRefresh}
            title="Refresh results"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>No files processed yet</h3>
          <p>Upload some files using the Upload tab to see results here.</p>
        </div>
      ) : (
        <>
          {/* Filters and Controls */}
          <div className="results-controls">
            <div className="filter-section">
              <label>Filter by type:</label>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value as any)}
                className="filter-select"
              >
                <option value="all">All Files ({files.length})</option>
                <option value="image">Images ({files.filter(f => f.fileType === 'image').length})</option>
                <option value="pdf">PDFs ({files.filter(f => f.fileType === 'pdf').length})</option>
                <option value="excel">Excel ({files.filter(f => f.fileType === 'excel').length})</option>
              </select>
            </div>
            
            <div className="sort-section">
              <span>Sort by:</span>
              <button 
                className={`sort-btn ${sortBy === 'date' ? 'active' : ''}`}
                onClick={() => handleSort('date')}
              >
                Date {getSortIcon('date')}
              </button>
              <button 
                className={`sort-btn ${sortBy === 'originalName' ? 'active' : ''}`}
                onClick={() => handleSort('originalName')}
              >
                Name {getSortIcon('originalName')}
              </button>
              <button 
                className={`sort-btn ${sortBy === 'fileType' ? 'active' : ''}`}
                onClick={() => handleSort('fileType')}
              >
                Type {getSortIcon('fileType')}
              </button>
              <button 
                className={`sort-btn ${sortBy === 'fileSize' ? 'active' : ''}`}
                onClick={() => handleSort('fileSize')}
              >
                Size {getSortIcon('fileSize')}
              </button>
            </div>
          </div>

          {/* Results Grid */}
          <div className="results-grid">
            {filteredAndSortedFiles.map((file) => (
              <div key={file.id} className="result-card">
                <div className="card-header">
                  <div className="file-icon">
                    {getFileIcon(file.fileType, file.fileName || file.originalName || file.filename)}
                  </div>
                  <div className="file-info">
                    <h3 className="file-name" title={file.fileName || file.originalName || file.filename || 'Unknown File'}>
                      {file.fileName || file.originalName || file.filename || 'Unknown File'}
                    </h3>
                    <span className="file-type">{getFileTypeLabel(file.fileType, file.fileName || file.originalName || file.filename)}</span>
                  </div>
                </div>
                
                <div className="card-details">
                  <div className="detail-row">
                    <span className="detail-label">Size:</span>
                    <span className="detail-value">{formatFileSize(typeof file.fileSize === 'string' ? parseInt(file.fileSize) : file.fileSize)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Processed:</span>
                    <span className="detail-value">{formatDate(file.processedDate || file.createdAt)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value status-success">
                      ✅ Processed
                    </span>
                  </div>
                  {file.extractedText && (
                    <div className="detail-row">
                      <span className="detail-label">Text:</span>
                      <span className="detail-value">
                        {file.extractedText.substring(0, 50)}
                        {file.extractedText.length > 50 ? '...' : ''}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="card-actions">
                  <button 
                    className="view-btn"
                    onClick={() => handleViewFileDetails(file)}
                    disabled={loadingFileDetails}
                  >
                    👁️ View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ResultsDisplay;
