export interface ProcessedFile {
  id: number;
  filename: string;
  originalName: string;
  fileType: 'image' | 'pdf' | 'excel';
  fileSize: number;
  parsedContent?: any;
  structuredTableData?: any;
  extractedText?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExcelSheet {
  headers: string[];
  data: Record<string, any>[];
}

export interface ExcelData {
  type: 'spreadsheet';
  sheets: Record<string, ExcelSheet>;
  totalSheets: number;
}

export interface TextData {
  extractedText: string;
  type: 'text';
}

