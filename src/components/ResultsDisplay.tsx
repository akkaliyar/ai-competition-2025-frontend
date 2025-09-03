import React, { useState } from 'react';
import axios from 'axios';
import { ProcessedFile } from '../types/ProcessedFile';
import DataTable from './DataTable';
import StructuredTableView from './StructuredTableView';

const API_BASE_URL = 'http://localhost:3001/api';

interface ResultsDisplayProps {
  files: ProcessedFile[];
  onRefresh: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ files, onRefresh }) => {
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'originalName' | 'fileType' | 'fileSize'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'pdf' | 'excel'>('all');
  const [loadingFileDetails, setLoadingFileDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [showStructuredView, setShowStructuredView] = useState(false);

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

  const getFileIcon = (fileType: string): string => {
    switch (fileType) {
      case 'image': return '🖼️';
      case 'pdf': return '📕';
      case 'excel': return '📊';
      default: return '📄';
    }
  };

  const getFileTypeLabel = (fileType: string): string => {
    switch (fileType) {
      case 'image': return 'Image/OCR';
      case 'pdf': return 'PDF Document';
      case 'excel': return 'Excel Spreadsheet';
      default: return 'Unknown';
    }
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
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching file details:', error);
      throw new Error('Failed to load file details');
    }
  };

  // Handle viewing file details
  const handleViewFileDetails = async (file: ProcessedFile) => {
    setLoadingFileDetails(true);
    setDetailsError(null);
    
    try {
      // If file already has parsedContent, use it directly
      if (file.parsedContent) {
        setSelectedFile(file);
      } else {
        // Otherwise, fetch full details from server
        const fullFileData = await fetchFileDetails(file.id);
        if (fullFileData) {
          setSelectedFile(fullFileData);
        } else {
          setDetailsError('Failed to load file details');
        }
      }
    } catch (error) {
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
          <h2>File Details: {selectedFile.originalName}</h2>
        </div>
        
        {/* View Toggle Buttons */}
        <div className="view-toggle-controls">
          <button
            className={`toggle-btn ${!showStructuredView ? 'active' : ''}`}
            onClick={() => setShowStructuredView(false)}
          >
            📋 Raw Data View
          </button>
          <button
            className={`toggle-btn ${showStructuredView ? 'active' : ''}`}
            onClick={() => {
              if (selectedFile.structuredTableData) {
                setShowStructuredView(true);
              } else if (selectedFile.parsedContent) {
                // If no structured data, try to use parsedContent as fallback
                setShowStructuredView(true);
              } else {
                // If no structured data, try to fetch it or show a message
                alert('Structured table data is not available for this file. The file may need to be reprocessed.');
              }
            }}
          >
            📊 Structured Table View
            {!selectedFile.structuredTableData && (
              <span style={{ fontSize: '0.8em', marginLeft: '8px', opacity: 0.7 }}>
                (No data)
              </span>
            )}
          </button>
        </div>

        {showStructuredView && selectedFile.structuredTableData ? (
          <StructuredTableView
            data={selectedFile.structuredTableData}
            fileName={selectedFile.originalName}
            fileType={selectedFile.fileType}
            onClose={() => {
              setSelectedFile(null);
              setDetailsError(null);
              setShowStructuredView(false);
            }}
          />
        ) : selectedFile.parsedContent ? (
          <DataTable 
            data={selectedFile.parsedContent}
            fileName={selectedFile.originalName}
            fileType={selectedFile.fileType}
          />
        ) : (
          <div className="data-table-container">
            <div className="tab-content">
              <div className="empty-state">
                <div className="empty-icon">⚠️</div>
                <h3>No Processed Data Available</h3>
                <p>This file has been uploaded but processing data is not available.</p>
                <p>The file might still be processing or there was an issue during processing.</p>
              </div>
            </div>
          </div>
        )}
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
                    {getFileIcon(file.fileType)}
                  </div>
                  <div className="file-info">
                    <h3 className="file-name" title={file.originalName}>
                      {file.originalName}
                    </h3>
                    <span className="file-type">{getFileTypeLabel(file.fileType)}</span>
                  </div>
                </div>
                
                <div className="card-details">
                  <div className="detail-row">
                    <span className="detail-label">Size:</span>
                    <span className="detail-value">{formatFileSize(file.fileSize)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Processed:</span>
                    <span className="detail-value">{formatDate(file.createdAt)}</span>
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
                  <button 
                    className="preview-btn"
                    onClick={() => handleViewFileDetails(file)}
                    disabled={loadingFileDetails}
                  >
                    📋 View Data
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
