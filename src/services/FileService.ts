import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { FileUploadResult, DataRow, MappingPreview } from '../types/conversion';

export class FileService {
  /**
   * Procesa un archivo CSV usando PapaParse
   */
  static async processCSVFile(file: File): Promise<FileUploadResult> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transform: (value: string) => value.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            resolve({
              success: false,
              errors: results.errors.map(err => `Línea ${err.row}: ${err.message}`),
              fileInfo: {
                name: file.name,
                size: file.size,
                type: file.type,
                totalRows: 0
              }
            });
            return;
          }

          const data = results.data as DataRow[];
          const headers = results.meta.fields || [];

          resolve({
            success: true,
            data,
            headers,
            fileInfo: {
              name: file.name,
              size: file.size,
              type: file.type,
              totalRows: data.length
            }
          });
        },
        error: (error) => {
          resolve({
            success: false,
            errors: [error.message],
            fileInfo: {
              name: file.name,
              size: file.size,
              type: file.type,
              totalRows: 0
            }
          });
        }
      });
    });
  }

  /**
   * Procesa un archivo Excel usando SheetJS
   */
  static async processExcelFile(file: File): Promise<FileUploadResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // Usar la primera hoja por defecto
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convertir a JSON con headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null
      }) as (string | number | null)[][];

      if (jsonData.length === 0) {
        return {
          success: false,
          errors: ['El archivo Excel está vacío'],
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type,
            totalRows: 0
          }
        };
      }

      // Primera fila como headers
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);

      // Convertir a formato de objetos
      const data: DataRow[] = dataRows.map(row => {
        const rowObj: DataRow = {};
        headers.forEach((header, index) => {
          if (header && header.trim()) {
            rowObj[header.trim()] = row[index] || null;
          }
        });
        return rowObj;
      });

      return {
        success: true,
        data,
        headers: headers.filter(h => h && h.trim()),
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
          totalRows: data.length
        }
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Error procesando Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`],
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
          totalRows: 0
        }
      };
    }
  }

  /**
   * Detecta automáticamente el tipo de archivo y lo procesa
   */
  static async processFile(file: File): Promise<FileUploadResult> {
    const extension = file.name.toLowerCase().split('.').pop();

    switch (extension) {
      case 'csv':
        return this.processCSVFile(file);
      case 'xlsx':
      case 'xls':
        return this.processExcelFile(file);
      default:
        return {
          success: false,
          errors: [`Tipo de archivo no soportado: ${extension}. Use CSV o Excel (.xlsx, .xls)`],
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type,
            totalRows: 0
          }
        };
    }
  }

  /**
   * Analiza las columnas y sugiere mapeos automáticos
   */
  static generateMappingPreview(data: DataRow[], headers: string[]): MappingPreview[] {
    return headers.map(header => {
      const sampleValues = data.slice(0, 5).map(row => row[header]);
      const suggestedType = this.detectDataType(sampleValues);
      const suggestedElement = this.suggestElementMapping(header);

      return {
        sourceColumn: header,
        sampleValues,
        suggestedType,
        suggestedElement: suggestedElement.element,
        confidence: suggestedElement.confidence
      };
    });
  }

  /**
   * Detecta el tipo de dato basado en una muestra de valores
   */
  private static detectDataType(values: (string | number | boolean | null)[]): 'string' | 'number' | 'boolean' | 'date' {
    const nonNullValues = values.filter(v => v !== null && v !== '');

    if (nonNullValues.length === 0) return 'string';

    // Detectar booleanos
    const booleanPattern = /^(true|false|yes|no|y|n|1|0|si|no)$/i;
    if (nonNullValues.every(v => booleanPattern.test(String(v)))) {
      return 'boolean';
    }

    // Detectar números
    if (nonNullValues.every(v => !isNaN(Number(v)))) {
      return 'number';
    }

    // Detectar fechas
    const datePattern = /^\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}/;
    if (nonNullValues.some(v => datePattern.test(String(v)))) {
      return 'date';
    }

    return 'string';
  }

  /**
   * Sugiere un mapeo de elemento basado en el nombre de la columna
   */
  private static suggestElementMapping(columnName: string): { element: string; confidence: number } {
    const name = columnName.toLowerCase().trim();

    // Mapeos comunes para Salesforce B2C
    const mappings = [
      { patterns: ['product.id', 'productid', 'sku', 'id'], element: 'product', attribute: 'product-id', confidence: 0.9 },
      { patterns: ['product.name', 'productname', 'name', 'title'], element: 'display-name', confidence: 0.8 },
      { patterns: ['description', 'desc', 'long.description'], element: 'long-description', confidence: 0.8 },
      { patterns: ['short.description', 'short.desc', 'summary'], element: 'short-description', confidence: 0.8 },
      { patterns: ['price', 'cost', 'amount'], element: 'custom-attribute', attribute: 'price', confidence: 0.7 },
      { patterns: ['category', 'cat', 'category.id'], element: 'category-assignment', confidence: 0.7 },
      { patterns: ['brand', 'manufacturer'], element: 'brand', confidence: 0.8 },
      { patterns: ['online', 'active', 'enabled'], element: 'online-flag', confidence: 0.8 },
      { patterns: ['searchable'], element: 'searchable-flag', confidence: 0.9 },
      { patterns: ['image', 'img', 'picture'], element: 'image', confidence: 0.7 },
      { patterns: ['ean', 'ean13'], element: 'ean', confidence: 0.9 },
      { patterns: ['upc'], element: 'upc', confidence: 0.9 }
    ];

    for (const mapping of mappings) {
      for (const pattern of mapping.patterns) {
        if (name.includes(pattern) || pattern.includes(name)) {
          return { element: mapping.element, confidence: mapping.confidence };
        }
      }
    }

    return { element: 'custom-attribute', confidence: 0.3 };
  }

  /**
   * Valida que un archivo sea válido antes de procesarlo
   */
  static validateFile(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      errors.push('El archivo es demasiado grande (máximo 10MB)');
    }

    // Validar tipo
    const extension = file.name.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx', 'xls'].includes(extension || '')) {
      errors.push('Tipo de archivo no soportado. Use CSV o Excel (.xlsx, .xls)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
