import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import ResultsDisplay from './components/ResultsDisplay';
import Dashboard from './components/Dashboard';
import { ProcessedFile } from './types/ProcessedFile';

const API_BASE_URL = 'http://localhost:3001/api';

function App() {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'results' | 'dashboard'>('upload');

  // Load existing files on component mount
  useEffect(() => {
    loadExistingFiles();
  }, []);

  const loadExistingFiles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/files`);
      if (response.data.success) {
        setProcessedFiles(response.data.data);
      }
    } catch (error) {
      console.error('Error loading existing files:', error);
    }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const newFile = response.data.data;
        setProcessedFiles(prev => [newFile, ...prev]);
        setSuccess(`File "${file.name}" processed successfully!`);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const tabs = [
    { id: 'upload', label: 'Upload Files', icon: '📤' },
    { id: 'results', label: 'Results', icon: '📋' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' }
  ];

  return (
    <div className="container">
      <header className="header">
        <h1>🗂️ AI CRM File Processor</h1>
        <p>Upload images, PDFs, or Excel files for automatic content extraction and processing</p>
      </header>

      {/* Tab Navigation */}
      <div className="main-tabs">
        <div className="tab-navigation-main">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`main-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="main-tab-content">
        {activeTab === 'upload' && (
          <FileUpload 
            onFileUpload={handleFileUpload}
            loading={loading}
            error={error}
            success={success}
            onClearMessages={clearMessages}
          />
        )}

        {activeTab === 'results' && (
          <ResultsDisplay 
            files={processedFiles}
            onRefresh={loadExistingFiles}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard 
            files={processedFiles}
            onRefresh={loadExistingFiles}
          />
        )}
      </div>
    </div>
  );
}

export default App;
