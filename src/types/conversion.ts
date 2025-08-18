// Tipos para la conversión de Excel/CSV a XML

export interface ColumnMapping {
  sourceColumn: string;
  targetPath: string; // xpath-like path en el XML
  targetElement: string;
  targetAttribute?: string;
  transformation?: TransformationType;
  defaultValue?: string;
  required: boolean;
  dataType: 'string' | 'number' | 'boolean' | 'date';
  validation?: ValidationRule;
}

export type TransformationType =
  | 'none'
  | 'uppercase'
  | 'lowercase'
  | 'trim'
  | 'date-iso'
  | 'date-salesforce'
  | 'boolean-yn'
  | 'boolean-10'
  | 'number-decimal'
  | 'number-integer';

export interface ValidationRule {
  type: 'regex' | 'enum' | 'range' | 'length';
  pattern?: string;
  allowedValues?: string[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

export interface ConversionConfig {
  name: string;
  description?: string;
  xsdSchema: string; // Referencia al XSD usado
  rootElement: string;
  namespace?: string;
  columnMappings: ColumnMapping[];
  globalSettings: {
    encoding: string;
    indent: boolean;
    skipEmptyValues: boolean;
    validateData: boolean;
  };
}

export interface DataRow {
  [columnName: string]: string | number | boolean | null;
}

export interface ConversionResult {
  success: boolean;
  xmlContent?: string;
  errors: ConversionError[];
  warnings: ConversionWarning[];
  stats: {
    totalRows: number;
    processedRows: number;
    skippedRows: number;
    validationErrors: number;
  };
}

export interface ConversionError {
  row: number;
  column?: string;
  field?: string;
  message: string;
  type: 'validation' | 'transformation' | 'mapping' | 'xml';
}

export interface ConversionWarning {
  row: number;
  column?: string;
  field?: string;
  message: string;
  type: 'missing-data' | 'type-conversion' | 'default-value';
}

export interface FileUploadResult {
  success: boolean;
  data?: DataRow[];
  headers?: string[];
  errors?: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    totalRows: number;
  };
}

export interface MappingPreview {
  sourceColumn: string;
  sampleValues: (string | number | boolean | null)[];
  suggestedType: 'string' | 'number' | 'boolean' | 'date';
  suggestedElement: string;
  confidence: number; // 0-1, qué tan segura es la sugerencia
}
