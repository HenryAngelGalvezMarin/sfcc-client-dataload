import js2xmlparser from 'js2xmlparser';
import ConfigService, { type CompanyMapping } from './ConfigService';
import type { DataRow } from '../types/conversion';

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
  type: 'validation' | 'transformation' | 'xml';
}

export interface ConversionWarning {
  row: number;
  column?: string;
  message: string;
  type: 'default-value' | 'type-conversion' | 'mapping';
}

export class CompanyConversionService {
  private configService: ConfigService;

  constructor() {
    this.configService = ConfigService.getInstance();
  }

  /**
   * Convierte datos de Excel/CSV a XML usando la configuración de una empresa
   */
  async convertToXML(
    data: DataRow[],
    companyName: string,
    options: {
      validateData?: boolean;
      skipEmptyValues?: boolean;
      indent?: boolean;
    } = {}
  ): Promise<ConversionResult> {
    const errors: ConversionError[] = [];
    const warnings: ConversionWarning[] = [];
    const processedData: Record<string, unknown>[] = [];

    let processedRows = 0;
    let skippedRows = 0;
    let validationErrors = 0;

    try {
      // Cargar configuración de la empresa
      const companyMapping = await this.configService.loadCompanyMapping(companyName);

      // Obtener headers de los datos
      const headers = data.length > 0 ? Object.keys(data[0]) : [];

      // Mapear headers automáticamente
      const columnMappings = this.createColumnMappings(headers, companyMapping, warnings);

      // Procesar cada fila de datos
      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        const productData: Record<string, unknown> = {};
        let hasErrors = false;

        // Aplicar mapeos de columnas
        for (const [sourceColumn, mappingKey] of Object.entries(columnMappings)) {
          const mappingInfo = this.configService.getMappingInfo(companyMapping, mappingKey);
          if (!mappingInfo) continue;

          const rawValue = row[sourceColumn];

          try {
            // Transformar valor
            const transformedValue = this.configService.transformValue(
              companyMapping,
              rawValue,
              mappingInfo.dataType
            );

            // Validar campo requerido
            if (mappingInfo.required && (transformedValue === null || transformedValue === undefined || transformedValue === '')) {
              if (mappingInfo.defaultValue !== undefined) {
                productData[mappingKey] = mappingInfo.defaultValue;
                warnings.push({
                  row: rowIndex + 1,
                  column: sourceColumn,
                  message: `Campo requerido vacío, usando valor por defecto: ${mappingInfo.defaultValue}`,
                  type: 'default-value'
                });
              } else {
                errors.push({
                  row: rowIndex + 1,
                  column: sourceColumn,
                  field: mappingInfo.xmlElement,
                  message: `Campo requerido '${sourceColumn}' está vacío`,
                  type: 'validation'
                });
                hasErrors = true;
                validationErrors++;
              }
            } else if (transformedValue !== null && transformedValue !== undefined && transformedValue !== '') {
              productData[mappingKey] = transformedValue;
            } else if (!options.skipEmptyValues) {
              productData[mappingKey] = transformedValue;
            }

          } catch (error) {
            errors.push({
              row: rowIndex + 1,
              column: sourceColumn,
              field: mappingInfo.xmlElement,
              message: `Error procesando columna: ${error instanceof Error ? error.message : 'Error desconocido'}`,
              type: 'transformation'
            });
            hasErrors = true;
          }
        }

        // Agregar product-id como atributo si no existe
        if (!productData['product-id'] && productData['display-name']) {
          const productId = this.generateProductId(productData['display-name'] as string);
          productData['product-id'] = productId;
          warnings.push({
            row: rowIndex + 1,
            message: `Generando product-id automático: ${productId}`,
            type: 'default-value'
          });
        }

        if (hasErrors && options.validateData) {
          skippedRows++;
        } else {
          processedData.push(productData);
          processedRows++;
        }
      }

      // Generar XML en formato SFCC
      const xmlContent = this.generateSFCCXML(processedData, companyMapping, options);

      return {
        success: errors.length === 0,
        xmlContent,
        errors,
        warnings,
        stats: {
          totalRows: data.length,
          processedRows,
          skippedRows,
          validationErrors
        }
      };

    } catch (error) {
      errors.push({
        row: -1,
        message: `Error de configuración: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        type: 'xml'
      });

      return {
        success: false,
        errors,
        warnings,
        stats: {
          totalRows: data.length,
          processedRows: 0,
          skippedRows: data.length,
          validationErrors: 0
        }
      };
    }
  }

  /**
   * Crea mapeos automáticos de columnas basado en la configuración de la empresa
   */
  private createColumnMappings(
    headers: string[],
    companyMapping: CompanyMapping,
    warnings: ConversionWarning[]
  ): Record<string, string> {
    const mappings: Record<string, string> = {};
    const unmappedHeaders: string[] = [];

    for (const header of headers) {
      const mappingKey = this.configService.getColumnMapping(companyMapping, header);
      if (mappingKey) {
        mappings[header] = mappingKey;
      } else {
        unmappedHeaders.push(header);
      }
    }

    // Advertir sobre columnas no mapeadas
    if (unmappedHeaders.length > 0) {
      warnings.push({
        row: 0,
        message: `Columnas no mapeadas: ${unmappedHeaders.join(', ')}`,
        type: 'mapping'
      });
    }

    return mappings;
  }

  /**
   * Genera un product-id automático basado en el nombre del producto
   */
  private generateProductId(displayName: string): string {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50);
  }

  /**
   * Genera XML en formato SFCC
   */
  private generateSFCCXML(
    products: Record<string, unknown>[],
    companyMapping: CompanyMapping,
    options: { indent?: boolean } = {}
  ): string {
    const catalog = {
      '@': {
        'xmlns': 'http://www.demandware.com/xml/impex/catalog/2006-10-31',
        'catalog-id': companyMapping.catalog.catalogId
      },
      product: products.map(productData => {
        const product: Record<string, unknown> = {
          '@': {
            'product-id': productData['product-id']
          }
        };

        // Procesar cada campo según su configuración
        for (const [key, value] of Object.entries(productData)) {
          if (key === 'product-id') continue; // Ya lo tenemos como atributo

          const mappingInfo = companyMapping.columnMappings[key];
          if (!mappingInfo) continue;

          if (mappingInfo.xmlElement === 'display-name' || mappingInfo.xmlElement === 'short-description' || mappingInfo.xmlElement === 'long-description') {
            // Elementos con locale
            if (!product[mappingInfo.xmlElement]) {
              product[mappingInfo.xmlElement] = [];
            }
            (product[mappingInfo.xmlElement] as unknown[]).push({
              '@': { 'xml:lang': mappingInfo.locale || companyMapping.catalog.defaultLocale },
              '#': value
            });
          } else if (mappingInfo.xmlElement === 'price-table') {
            // Tabla de precios
            if (!product['price-tables']) {
              product['price-tables'] = {
                'price-table': {
                  '@': { 'currency': mappingInfo.currency || companyMapping.catalog.defaultCurrency },
                  'amount': []
                }
              };
            }
            (product['price-tables'] as Record<string, unknown>)['price-table'] = {
              '@': { 'currency': mappingInfo.currency || companyMapping.catalog.defaultCurrency },
              'amount': value
            };
          } else if (mappingInfo.xmlElement === 'classification-category') {
            // Categorías
            if (!product['classification-category']) {
              product['classification-category'] = [];
            }
            (product['classification-category'] as unknown[]).push({
              '@': {
                'catalog-id': mappingInfo.catalogId || companyMapping.catalog.catalogId,
                'category-id': value
              }
            });
          } else {
            // Elementos simples
            product[mappingInfo.xmlElement] = value;
          }
        }

        return product;
      })
    };

    const xmlOptions = {
      declaration: {
        encoding: 'UTF-8'
      },
      format: {
        doubleQuotes: true,
        indent: options.indent ? '  ' : '',
        newline: options.indent ? '\n' : ''
      }
    };

    return js2xmlparser.parse('catalog', catalog, xmlOptions);
  }
}

export default CompanyConversionService;
