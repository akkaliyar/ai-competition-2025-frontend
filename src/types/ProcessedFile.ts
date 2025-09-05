// Invoice Item Interface
export interface InvoiceItem {
  sNo: number;
  itemDescription: string;
  pack: string;
  mrp: number;
  batchNo: string;
  exp: string;
  qty: number;
  rate: number;
  amount: number;
}

// Invoice Data Interface
export interface InvoiceData {
  id: number;
  invoiceNo: string;
  date: string;
  shopName: string;
  shopAddress: string;
  phone: string[];
  patientName: string;
  patientPhone: string;
  prescribedBy: string;
  doctorName?: string;
  doctorSpecialization?: string;
  doctorPhone?: string;
  items: InvoiceItem[];
  totalQty: number;
  subTotal: string;
  lessDiscount: string;
  otherAdj: string;
  roundOff: string;
  grandTotal: string;
  amountInWords: string;
  message: string;
  termsAndConditions: string[];
}

export interface ProcessedFile {
  id: number;
  fileName: string; // Updated to match API response
  filename?: string; // Keep for backward compatibility
  originalName?: string; // Keep for backward compatibility
  fileType?: 'image' | 'pdf' | 'excel';
  fileSize: number | string; // API returns string, but we need number for calculations
  processedStatus: string; // New field from API
  processedDate?: string; // New field from API
  invoiceNo?: string; // New field from API
  date?: string; // New field from API
  parsedContent?: any;
  structuredTableData?: any;
  extractedText?: string;
  createdAt: string;
  updatedAt?: string;
  
  // New fields for JSON response and key-value data
  jsonResponse?: InvoiceData; // Updated to use InvoiceData type
  keyValueData?: Record<string, any>; // Structured key-value format
  processingStatus?: string;
  processingDurationMs?: number;
  characterCount?: number;
  wordCount?: number;
  lineCount?: number;
  hasStructuredData?: boolean;
  tableCount?: number;
  averageConfidence?: number;
  mimeType?: string;
  showFormattedJson?: boolean; // For JSON view formatting toggle
  showStructuredData?: boolean; // For generic structured data view toggle
  showSimpleFormat?: boolean; // For simple format view toggle
  showEnhancedText?: boolean; // For enhanced text view toggle
  structuredDocumentData?: InvoiceData; // Updated to use InvoiceData type
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

