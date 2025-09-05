import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ProcessedFile } from '../types/ProcessedFile';
import { API_BASE_URL } from '../config/api';

interface DashboardProps {
  files: ProcessedFile[];
  onRefresh: () => void;
}

interface DashboardStats {
  totalFiles: number;
  imageFiles: number;
  pdfFiles: number;
  excelFiles: number;
  totalSize: number;
  recentActivity: ProcessedFile[];
  // Bill analytics
  totalInvoices: number;
  totalAmount: number;
  averageAmount: number;
  todayBills: number;
  todayAmount: number;
  processedToday: number;
}

const Dashboard: React.FC<DashboardProps> = ({ files, onRefresh }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [dashboardFiles, setDashboardFiles] = useState<ProcessedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch files from API
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/files`);
      
      // Handle multiple response formats
      let filesData = [];
      if (response.data.success && response.data.data) {
        // Format: { success: true, data: [...] }
        filesData = response.data.data;
      } else if (response.data.status && response.data.data) {
        // Format: { status: true, data: [...] }
        filesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Direct array format
        filesData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Single file or object format
        filesData = [response.data];
      }
      
      // Map API response to ProcessedFile format
      const mappedFiles = filesData.map((file: any) => ({
        id: file.id,
        fileName: file.fileName,
        fileSize: typeof file.fileSize === 'string' ? parseInt(file.fileSize) : file.fileSize,
        processedStatus: file.processedStatus,
        processedDate: file.processedDate,
        invoiceNo: file.invoiceNo,
        date: file.date,
        createdAt: file.createdAt || file.processedDate || new Date().toISOString(), // Use processedDate as fallback
        fileType: file.fileType, // Will be inferred if missing
        // Map invoice data to jsonResponse
        jsonResponse: {
          id: file.id,
          invoiceNo: file.invoiceNo,
          date: file.date,
          shopName: file.shopName,
          shopAddress: file.shopAddress,
          phone: file.phone,
          patientName: file.patientName,
          patientPhone: file.patientPhone,
          prescribedBy: file.prescribedBy,
          doctorName: file.doctorName,
          doctorSpecialization: file.doctorSpecialization,
          doctorPhone: file.doctorPhone,
          items: file.items,
          totalQty: file.totalQty,
          subTotal: file.subTotal,
          lessDiscount: file.lessDiscount,
          otherAdj: file.otherAdj,
          roundOff: file.roundOff,
          grandTotal: file.grandTotal,
          amountInWords: file.amountInWords,
          message: file.message,
          termsAndConditions: file.termsAndConditions
        }
      }));
      
      
      setDashboardFiles(mappedFiles);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setDashboardFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateStats = useCallback(() => {
    // Use dashboardFiles from API call instead of props files
    const filesToUse = dashboardFiles.length > 0 ? dashboardFiles : files;
    
    
    // Safety check for files array
    if (!filesToUse || filesToUse.length === 0) {
      setStats({
        totalFiles: 0,
        imageFiles: 0,
        pdfFiles: 0,
        excelFiles: 0,
        totalSize: 0,
        recentActivity: [],
        totalInvoices: 0,
        totalAmount: 0,
        averageAmount: 0,
        todayBills: 0,
        todayAmount: 0,
        processedToday: 0
      });
      return;
    }

    const now = new Date();
    const timeRanges = {
      day: 1,
      week: 7,
      month: 30,
      all: Number.MAX_SAFE_INTEGER
    };

    const daysToFilter = timeRanges[selectedTimeRange];
    const filteredFiles = filesToUse.filter(file => {
      const fileDate = new Date(file.processedDate || file.createdAt);
      const daysDiff = (now.getTime() - fileDate.getTime()) / (1000 * 3600 * 24);
      return daysDiff <= daysToFilter;
    });

    // Calculate bill analytics
    const invoiceFiles = filteredFiles.filter(f => f.jsonResponse && f.jsonResponse.grandTotal);
    
    const totalAmount = invoiceFiles.reduce((sum, file) => {
      const amount = parseFloat(file.jsonResponse?.grandTotal || '0');
      return sum + amount;
    }, 0);
    
    // Today's analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayFiles = filteredFiles.filter(file => {
      const fileDate = new Date(file.processedDate || file.createdAt);
      fileDate.setHours(0, 0, 0, 0);
      return fileDate.getTime() === today.getTime();
    });
    
    const todayInvoiceFiles = todayFiles.filter(f => f.jsonResponse && f.jsonResponse.grandTotal);
    const todayAmount = todayInvoiceFiles.reduce((sum, file) => {
      const amount = parseFloat(file.jsonResponse?.grandTotal || '0');
      return sum + amount;
    }, 0);

    const newStats: DashboardStats = {
      totalFiles: filteredFiles.length,
      imageFiles: filteredFiles.filter(f => getFileTypeFromName(f) === 'image').length,
      pdfFiles: filteredFiles.filter(f => getFileTypeFromName(f) === 'pdf').length,
      excelFiles: filteredFiles.filter(f => getFileTypeFromName(f) === 'excel').length,
      totalSize: filteredFiles.reduce((sum, file) => sum + (typeof file.fileSize === 'string' ? parseInt(file.fileSize) : file.fileSize), 0),
      recentActivity: filteredFiles.slice(0, 5),
      // Bill analytics
      totalInvoices: invoiceFiles.length,
      totalAmount: totalAmount,
      averageAmount: invoiceFiles.length > 0 ? totalAmount / invoiceFiles.length : 0,
      todayBills: todayInvoiceFiles.length,
      todayAmount: todayAmount,
      processedToday: todayFiles.length
    };

    setStats(newStats);
  }, [files, dashboardFiles, selectedTimeRange]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Fetch data when component mounts
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Enhanced refresh function that fetches fresh data
  const handleRefresh = useCallback(() => {
    fetchDashboardData();
    onRefresh(); // Also call the parent refresh function
  }, [fetchDashboardData, onRefresh]);

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Helper function to determine file type from filename if fileType is missing
  const getFileTypeFromName = (file: ProcessedFile): string => {
    if (file.fileType) return file.fileType;
    
    const fileName = file.fileName || file.originalName || file.filename || '';
    const extension = fileName.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return 'image';
      case 'pdf':
        return 'pdf';
      case 'xlsx':
      case 'xls':
      case 'csv':
        return 'excel';
      default:
        return 'image'; // Default to image for unknown types
    }
  };

  const getFileTypeStats = () => {
    if (!stats) return [];
    
    return [
      { type: 'Images', count: stats.imageFiles || 0, color: '#e74c3c', emoji: '🖼️' },
      { type: 'PDFs', count: stats.pdfFiles || 0, color: '#e67e22', emoji: '📕' },
      { type: 'Excel', count: stats.excelFiles || 0, color: '#27ae60', emoji: '📊' }
    ].filter(item => item.count > 0);
  };

  const getProcessingSuccessRate = (): number => {
    if (!files || files.length === 0) return 0;
    // Assume successful if file has parsed content
    const successfulFiles = files.filter(f => f.parsedContent && Object.keys(f.parsedContent).length > 0);
    return Math.round((successfulFiles.length / files.length) * 100);
  };

  if (!stats) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h2>📊 Analytics Dashboard</h2>
            <p>Comprehensive overview of your file processing activities</p>
          </div>
          <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
        {error ? (
          <div className="error-message">
            <p>❌ {error}</p>
            <button onClick={handleRefresh} className="retry-btn">
              🔄 Retry
            </button>
          </div>
        ) : (
          <div className="loading">Loading dashboard...</div>
        )}
      </div>
    );
  }

  // Show empty state if no files
  if (stats.totalFiles === 0) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h2>📊 Analytics Dashboard</h2>
            <p>Comprehensive overview of your file processing activities</p>
          </div>
          <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
        
        {/* Basic Analytics - Always Show */}
        <div className="stats-summary">
          <div className="summary-card total">
            <div className="summary-icon">📁</div>
            <div className="summary-content">
              <h3>0</h3>
              <p>Total Files Processed</p>
            </div>
          </div>

          <div className="summary-card size">
            <div className="summary-icon">💾</div>
            <div className="summary-content">
              <h3>0 Bytes</h3>
              <p>Total Data Processed</p>
            </div>
          </div>

          <div className="summary-card invoices">
            <div className="summary-icon">🧾</div>
            <div className="summary-content">
              <h3>0</h3>
              <p>Total Invoices</p>
            </div>
          </div>

          <div className="summary-card amount">
            <div className="summary-icon">💰</div>
            <div className="summary-content">
              <h3>₹0.00</h3>
              <p>Total Amount</p>
            </div>
          </div>
        </div>

        {/* Daily Report Section */}
        <div className="dashboard-section">
          <h3>📅 Daily Bill Report</h3>
          <div className="daily-report">
            <div className="report-card">
              <div className="report-icon">📊</div>
              <div className="report-content">
                <h4>Today's Processing</h4>
                <p>Files Processed: <strong>0</strong></p>
                <p>Bills Generated: <strong>0</strong></p>
                <p>Total Amount: <strong>₹0.00</strong></p>
              </div>
            </div>
            <div className="report-card">
              <div className="report-icon">📈</div>
              <div className="report-content">
                <h4>Processing Status</h4>
                <p>Success Rate: <strong>0%</strong></p>
                <p>Average Amount: <strong>₹0.00</strong></p>
                <p>Last Updated: <strong>Never</strong></p>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>📊 Analytics Dashboard</h2>
          <p>Comprehensive overview of your file processing activities</p>
        </div>
        
        <div className="time-range-selector">
          <label>Time Range:</label>
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="time-select"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="all">All Time</option>
          </select>
          <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-summary">
        <div className="summary-card total">
          <div className="summary-icon">📁</div>
          <div className="summary-content">
            <h3>{stats.totalFiles.toLocaleString()}</h3>
            <p>Total Files Processed</p>
          </div>
        </div>

        <div className="summary-card size">
          <div className="summary-icon">💾</div>
          <div className="summary-content">
            <h3>{formatFileSize(stats.totalSize)}</h3>
            <p>Total Data Processed</p>
          </div>
        </div>

        <div className="summary-card invoices">
          <div className="summary-icon">🧾</div>
          <div className="summary-content">
            <h3>{stats.totalInvoices}</h3>
            <p>Total Invoices</p>
          </div>
        </div>

        <div className="summary-card amount">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <h3>{formatCurrency(stats.totalAmount)}</h3>
            <p>Total Amount</p>
          </div>
        </div>
      </div>

      {/* Daily Bill Report */}
      <div className="dashboard-section">
        <h3>📅 Daily Bill Report</h3>
        <div className="daily-report">
          <div className="report-card">
            <div className="report-icon">📊</div>
            <div className="report-content">
              <h4>Today's Processing</h4>
              <p>Files Processed: <strong>{stats.processedToday}</strong></p>
              <p>Bills Generated: <strong>{stats.todayBills}</strong></p>
              <p>Total Amount: <strong>{formatCurrency(stats.todayAmount)}</strong></p>
            </div>
          </div>
          <div className="report-card">
            <div className="report-icon">📈</div>
            <div className="report-content">
              <h4>Processing Status</h4>
              <p>Success Rate: <strong>{getProcessingSuccessRate()}%</strong></p>
              <p>Average Amount: <strong>{formatCurrency(stats.averageAmount)}</strong></p>
              <p>Last Updated: <strong>{new Date().toLocaleTimeString()}</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* File Type Distribution */}
      <div className="dashboard-section">
        <h3>📈 File Type Distribution</h3>
        <div className="file-type-chart">
          {getFileTypeStats().map((item, idx) => (
            <div key={idx} className="chart-item">
              <div className="chart-bar">
                <div 
                  className="chart-fill"
                  style={{ 
                    width: `${(item.count / stats.totalFiles) * 100}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
              <div className="chart-label">
                <span className="chart-emoji">{item.emoji}</span>
                <span className="chart-text">{item.type}</span>
                <span className="chart-count">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="dashboard-section">
        <h3>🕒 Recent Activity</h3>
        <div className="activity-list">
          {stats.recentActivity.length > 0 ? (
            stats.recentActivity.map(file => (
              <div key={file.id} className="activity-item">
                <div className="activity-icon">
                  {getFileTypeFromName(file) === 'image' ? '🖼️' : 
                   getFileTypeFromName(file) === 'pdf' ? '📕' : '📊'}
                </div>
                <div className="activity-content">
                  <div className="activity-main">
                    <span className="activity-name">{file.fileName || file.originalName || file.filename || 'Unknown File'}</span>
                    <span className="activity-type">{getFileTypeFromName(file).toUpperCase()}</span>
                  </div>
                  <div className="activity-details">
                    <span>{formatFileSize(typeof file.fileSize === 'string' ? parseInt(file.fileSize) : file.fileSize)}</span>
                    <span>•</span>
                    <span>{new Date(file.processedDate || file.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{new Date(file.processedDate || file.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="activity-status">
                  {file.parsedContent ? (
                    <span className="status-success">✅ Processed</span>
                  ) : (
                    <span className="status-pending">⏳ Processing</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              <p>No files processed in the selected time range.</p>
            </div>
          )}
        </div>
      </div>

      {/* Processing Insights */}
      <div className="dashboard-section">
        <h3>💡 Processing Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>🎯 Most Common File Type</h4>
            <p>
              {stats.imageFiles >= stats.pdfFiles && stats.imageFiles >= stats.excelFiles ? '🖼️ Images' :
               stats.pdfFiles >= stats.excelFiles ? '📕 PDFs' : '📊 Excel Files'}
            </p>
          </div>
          
          <div className="insight-card">
            <h4>📦 Average File Size</h4>
            <p>{formatFileSize(stats.totalSize / Math.max(stats.totalFiles, 1))}</p>
          </div>
          
          <div className="insight-card">
            <h4>🕐 Peak Processing Time</h4>
            <p>Most files uploaded in the {getCurrentPeakHour()}</p>
          </div>
        </div>
      </div>
    </div>
  );

  function getCurrentPeakHour(): string {
    // Check if files array is empty
    if (!files || files.length === 0) {
      return 'No data';
    }
    
    const hours = files.map(file => new Date(file.createdAt).getHours());
    const hourCounts: { [key: number]: number } = {};
    
    hours.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    // Check if hourCounts is empty
    const hourKeys = Object.keys(hourCounts);
    if (hourKeys.length === 0) {
      return 'No data';
    }
    
    // Use reduce with initial value to prevent errors
    const peakHour = hourKeys.reduce((a, b) => 
      hourCounts[parseInt(a)] > hourCounts[parseInt(b)] ? a : b, hourKeys[0]
    );
    
    const hour = parseInt(peakHour);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    
    return `${displayHour}:00 ${period}`;
  }
};

export default Dashboard;

