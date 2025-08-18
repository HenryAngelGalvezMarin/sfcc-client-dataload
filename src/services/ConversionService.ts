import js2xmlparser from 'js2xmlparser';
import type {
  DataRow,
  ColumnMapping,
  ConversionConfig,
  ConversionResult,
  ConversionError,
  ConversionWarning,
  TransformationType,
  ValidationRule
} from '../types/conversion';

interface ProcessedXMLData {
  [key: string]: unknown;
}

export class ConversionService {
  /**
   * Convierte datos de Excel/CSV a XML usando la configuración de mapeo
   */
  static async convertToXML(
    data: DataRow[],
    config: ConversionConfig
  ): Promise<ConversionResult> {
    const errors: ConversionError[] = [];
    const warnings: ConversionWarning[] = [];
    const processedData: ProcessedXMLData[] = [];

    let processedRows = 0;
    let skippedRows = 0;
    let validationErrors = 0;

    // Procesar cada fila de datos
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      const processedRow: ProcessedXMLData = {};
      let hasErrors = false;

      // Procesar cada mapeo de columnas
      for (const mapping of config.columnMappings) {
        try {
          const value = row[mapping.sourceColumn];
          const processedValue = this.processValue(
            value,
            mapping,
            rowIndex,
            errors,
            warnings
          );

          if (processedValue !== null || !config.globalSettings.skipEmptyValues) {
            this.setNestedValue(processedRow, mapping.targetPath, processedValue);
          }

          // Validación de campos requeridos
          if (mapping.required && (processedValue === null || processedValue === '')) {
            errors.push({
              row: rowIndex + 1,
              column: mapping.sourceColumn,
              field: mapping.targetElement,
              message: `Campo requerido '${mapping.sourceColumn}' está vacío`,
              type: 'validation'
            });
            hasErrors = true;
            validationErrors++;
          }

        } catch (error) {
          errors.push({
            row: rowIndex + 1,
            column: mapping.sourceColumn,
            field: mapping.targetElement,
            message: `Error procesando columna: ${error instanceof Error ? error.message : 'Error desconocido'}`,
            type: 'transformation'
          });
          hasErrors = true;
        }
      }

      if (hasErrors && config.globalSettings.validateData) {
        skippedRows++;
      } else {
        processedData.push(processedRow);
        processedRows++;
      }
    }

    // Generar XML
    let xmlContent = '';
    try {
      const xmlData = {
        [config.rootElement]: processedData
      };

      const xmlOptions = {
        declaration: {
          encoding: config.globalSettings.encoding
        },
        format: {
          doubleQuotes: true,
          indent: config.globalSettings.indent ? '  ' : '',
          newline: config.globalSettings.indent ? '\n' : ''
        }
      };

      xmlContent = js2xmlparser.parse('catalog', xmlData, xmlOptions);

    } catch (error) {
      errors.push({
        row: -1,
        message: `Error generando XML: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        type: 'xml'
      });
    }

    return {
      success: errors.length === 0,
      xmlContent: xmlContent || undefined,
      errors,
      warnings,
      stats: {
        totalRows: data.length,
        processedRows,
        skippedRows,
        validationErrors
      }
    };
  }

  /**
   * Procesa un valor individual aplicando transformaciones y validaciones
   */
  private static processValue(
    value: string | number | boolean | null,
    mapping: ColumnMapping,
    rowIndex: number,
    errors: ConversionError[],
    warnings: ConversionWarning[]
  ): string | number | boolean | null {
    // Manejar valores vacíos
    if (value === null || value === undefined || value === '') {
      if (mapping.defaultValue !== undefined) {
        warnings.push({
          row: rowIndex + 1,
          column: mapping.sourceColumn,
          message: `Usando valor por defecto '${mapping.defaultValue}' para columna vacía`,
          type: 'default-value'
        });
        return mapping.defaultValue;
      }
      return null;
    }

    let processedValue: string | number | boolean = value;

    // Aplicar transformaciones
    if (mapping.transformation && mapping.transformation !== 'none') {
      processedValue = this.applyTransformation(processedValue, mapping.transformation);
    }

    // Conversión de tipos
    processedValue = this.convertDataType(processedValue, mapping.dataType, rowIndex, mapping.sourceColumn, warnings);

    // Validación
    if (mapping.validation) {
      const validationResult = this.validateValue(processedValue, mapping.validation);
      if (!validationResult.valid) {
        errors.push({
          row: rowIndex + 1,
          column: mapping.sourceColumn,
          field: mapping.targetElement,
          message: `Validación fallida: ${validationResult.message}`,
          type: 'validation'
        });
      }
    }

    return processedValue;
  }

  /**
   * Aplica transformaciones a un valor
   */
  private static applyTransformation(value: string | number | boolean, transformation: TransformationType): string | number | boolean {
    if (value === null || value === undefined) return value;

    const strValue = String(value);

    switch (transformation) {
      case 'uppercase':
        return strValue.toUpperCase();
      case 'lowercase':
        return strValue.toLowerCase();
      case 'trim':
        return strValue.trim();
      case 'date-iso':
        return this.formatDateISO(strValue);
      case 'date-salesforce':
        return this.formatDateSalesforce(strValue);
      case 'boolean-yn':
        return this.convertBooleanYN(value);
      case 'boolean-10':
        return this.convertBoolean10(value);
      case 'number-decimal': {
        const parsed = parseFloat(strValue);
        return isNaN(parsed) ? value : parsed;
      }
      case 'number-integer': {
        const parsed = parseInt(strValue, 10);
        return isNaN(parsed) ? value : parsed;
      }
      default:
        return value;
    }
  }

  /**
   * Convierte tipos de datos
   */
  private static convertDataType(
    value: string | number | boolean,
    targetType: string,
    rowIndex: number,
    columnName: string,
    warnings: ConversionWarning[]
  ): string | number | boolean {
    if (value === null || value === undefined) return value;

    try {
      switch (targetType) {
        case 'string':
          return String(value);
        case 'number': {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            warnings.push({
              row: rowIndex + 1,
              column: columnName,
              message: `No se pudo convertir '${value}' a número, usando valor original`,
              type: 'type-conversion'
            });
            return value;
          }
          return numValue;
        }
        case 'boolean':
          return this.convertToBoolean(value);
        case 'date':
          return this.convertToDate(value);
        default:
          return value;
      }
    } catch (error) {
      warnings.push({
        row: rowIndex + 1,
        column: columnName,
        message: `Error en conversión de tipo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        type: 'type-conversion'
      });
      return value;
    }
  }

  /**
   * Establece un valor en un objeto anidado usando dot notation
   */
  private static setNestedValue(obj: ProcessedXMLData, path: string, value: string | number | boolean | null): void {
    const keys = path.split('.');
    let current: Record<string, unknown> = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Valida un valor contra reglas de validación
   */
  private static validateValue(value: string | number | boolean | null, validation: ValidationRule): { valid: boolean; message?: string } {
    if (value === null || value === undefined) {
      return { valid: true }; // Los valores nulos se manejan en la validación de requeridos
    }

    const strValue = String(value);

    switch (validation.type) {
      case 'regex':
        if (validation.pattern) {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(strValue)) {
            return { valid: false, message: `No coincide con el patrón: ${validation.pattern}` };
          }
        }
        break;

      case 'enum':
        if (validation.allowedValues && !validation.allowedValues.includes(strValue)) {
          return {
            valid: false,
            message: `Valor no permitido. Valores válidos: ${validation.allowedValues.join(', ')}`
          };
        }
        break;

      case 'range': {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          if (validation.min !== undefined && numValue < validation.min) {
            return { valid: false, message: `Valor menor que el mínimo permitido: ${validation.min}` };
          }
          if (validation.max !== undefined && numValue > validation.max) {
            return { valid: false, message: `Valor mayor que el máximo permitido: ${validation.max}` };
          }
        }
        break;
      }

      case 'length':
        if (validation.minLength !== undefined && strValue.length < validation.minLength) {
          return { valid: false, message: `Longitud menor que el mínimo: ${validation.minLength}` };
        }
        if (validation.maxLength !== undefined && strValue.length > validation.maxLength) {
          return { valid: false, message: `Longitud mayor que el máximo: ${validation.maxLength}` };
        }
        break;
    }

    return { valid: true };
  }

  // Utilidades para conversiones de fecha
  private static formatDateISO(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  }

  private static formatDateSalesforce(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toISOString();
    } catch {
      return dateStr;
    }
  }

  // Utilidades para conversiones booleanas
  private static convertBooleanYN(value: string | number | boolean): string {
    const boolValue = this.convertToBoolean(value);
    return boolValue ? 'Y' : 'N';
  }

  private static convertBoolean10(value: string | number | boolean): string {
    const boolValue = this.convertToBoolean(value);
    return boolValue ? '1' : '0';
  }

  private static convertToBoolean(value: string | number | boolean): boolean {
    if (typeof value === 'boolean') return value;

    const strValue = String(value).toLowerCase().trim();
    const truthyValues = ['true', 'yes', 'y', '1', 'si', 'sí', 'on', 'enabled'];
    return truthyValues.includes(strValue);
  }

  private static convertToDate(value: string | number | boolean): string {
    try {
      const date = new Date(value as string);
      if (isNaN(date.getTime())) {
        return String(value);
      }
      return date.toISOString();
    } catch {
      return String(value);
    }
  }
}
