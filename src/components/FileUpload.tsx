import React, { useState, useRef, useCallback } from 'react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  loading: boolean;
  error: string | null;
  success: string | null;
  onClearMessages: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  loading,
  error,
  success,
  onClearMessages
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFileTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];

  const handleFileSelect = useCallback((file: File) => {
    onClearMessages();
    
    if (!acceptedFileTypes.includes(file.type)) {
      alert('Please select a valid file type (Image, PDF, or Excel)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
  }, [acceptedFileTypes, onClearMessages]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleUpload = async () => {
    if (selectedFile) {
      await onFileUpload(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleContainerClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <section className="upload-section">
      <form className="upload-form" onSubmit={(e) => e.preventDefault()}>
        <div
          className={`file-input-container ${dragOver ? 'dragover' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleContainerClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="file-input"
            accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,.xlsx,.xls"
            onChange={handleFileInputChange}
            disabled={loading}
          />
          <div className="file-input-label">
            {dragOver ? (
              '📂 Drop your file here'
            ) : (
              '📁 Click to select or drag & drop a file'
            )}
          </div>
          <div className="file-input-hint">
            Supported formats: Images (JPG, PNG, GIF, BMP, WebP), PDF, Excel (XLSX, XLS)
            <br />
            Maximum file size: 10MB
          </div>
        </div>

        {selectedFile && (
          <div className="selected-file">
            ✅ Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            Processing file...
          </div>
        )}

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            ✅ {success}
          </div>
        )}

        <button
          type="button"
          className="upload-button"
          onClick={handleUpload}
          disabled={!selectedFile || loading}
        >
          {loading ? 'Processing...' : 'Upload and Process File'}
        </button>
      </form>
    </section>
  );
};

export default FileUpload;

