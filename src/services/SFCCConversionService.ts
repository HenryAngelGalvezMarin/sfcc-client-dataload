import { SFCCCatalogFactory } from '../classes/catalog/SFCCCatalogFactory';
import type { Product } from '../classes/catalog/Product';
import type { CompanyMapping } from '../types/company';
import type { DataRow, ConversionResult, ConversionWarning } from '../types/conversion';

/**
 * Servicio de conversión mejorado que usa las clases SFCC
 * para garantizar XML válido y compatible con el schema oficial
 */
export class SFCCConversionService {
  /**
   * Convierte datos CSV a XML de catálogo SFCC usando clases tipadas
   */
  static async convertToSFCCCatalog(
    csvData: DataRow[],
    companyMapping: CompanyMapping
  ): Promise<ConversionResult> {
    const startTime = performance.now();

    try {
      // 1. Detectar columnas no mapeadas
      const warnings: ConversionWarning[] = [];
      if (csvData.length > 0) {
        const headers = Object.keys(csvData[0]);
        const mappedHeaders = Object.keys(companyMapping.columnMappings);
        const unmappedHeaders = headers.filter(header => !mappedHeaders.includes(header));

        if (unmappedHeaders.length > 0) {
          warnings.push({
            row: 0,
            message: `Columnas no mapeadas (serán ignoradas): ${unmappedHeaders.join(', ')}`,
            type: 'missing-data'
          });
        }
      }

      // 2. Crear productos desde CSV usando Factory
      console.log(`🏭 Procesando ${csvData.length} filas de datos...`);
      const products = SFCCCatalogFactory.createProductsFromCSV(
        csvData as Record<string, string>[],
        companyMapping
      );

      // 3. Validar productos
      console.log('✅ Validando productos...');
      const { valid, invalid } = SFCCCatalogFactory.validateProducts(products);

      // 4. Generar errores para productos inválidos
      const errors = invalid.map((item: { errors: string[] }, index: number) => ({
        row: index + 1,
        column: 'product-id',
        field: 'product',
        message: item.errors.join(', '),
        type: 'validation' as const
      }));

      // 5. Generar XML solo con productos válidos
      let xmlContent = '';
      if (valid.length > 0) {
        console.log(`📄 Generando XML para ${valid.length} productos válidos...`);
        xmlContent = SFCCCatalogFactory.generateCatalogXML(valid, companyMapping.catalog);
      }

      const endTime = performance.now();
      console.log(`⚡ Conversión completada en ${(endTime - startTime).toFixed(2)}ms`);

      return {
        success: errors.length === 0,
        xmlContent: xmlContent || undefined,
        errors,
        warnings,
        stats: {
          totalRows: csvData.length,
          processedRows: valid.length,
          skippedRows: invalid.length,
          validationErrors: invalid.length
        }
      };

    } catch (error) {
      return {
        success: false,
        errors: [{
          row: -1,
          message: `Error en conversión SFCC: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          type: 'xml' as const
        }],
        warnings: [],
        stats: {
          totalRows: csvData.length,
          processedRows: 0,
          skippedRows: csvData.length,
          validationErrors: 1
        }
      };
    }
  }

  /**
   * Valida un producto individual y retorna detalles específicos
   */
  static validateSingleProduct(productData: Record<string, string>, mapping: CompanyMapping) {
    try {
      const product = SFCCCatalogFactory.createProductFromCSV(productData, mapping);
      const validation = product.validate();

      return {
        isValid: validation.isValid,
        product: validation.isValid ? product : null,
        errors: validation.errors,
        xmlPreview: validation.isValid ? product.toXML({ indent: '  ' }) : null
      };
    } catch (error) {
      return {
        isValid: false,
        product: null,
        errors: [{
          field: 'general',
          message: `Error creando producto: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          code: 'CREATION_ERROR'
        }],
        xmlPreview: null
      };
    }
  }

  /**
   * Genera vista previa de XML para un subconjunto de datos
   */
  static generatePreview(csvData: DataRow[], mapping: CompanyMapping, maxItems = 3): string {
    try {
      const sampleData = csvData.slice(0, maxItems) as Record<string, string>[];
      const products = SFCCCatalogFactory.createProductsFromCSV(sampleData, mapping);
      const { valid } = SFCCCatalogFactory.validateProducts(products);

      if (valid.length === 0) {
        return '<!-- No hay productos válidos para mostrar vista previa -->';
      }

      return SFCCCatalogFactory.generateCatalogXML(valid, mapping.catalog);
    } catch (error) {
      return `<!-- Error generando vista previa: ${error instanceof Error ? error.message : 'Error desconocido'} -->`;
    }
  }

  /**
   * Obtiene estadísticas detalladas de calidad de datos
   */
  static getDataQualityStats(csvData: DataRow[], mapping: CompanyMapping) {
    try {
      const products = SFCCCatalogFactory.createProductsFromCSV(
        csvData as Record<string, string>[],
        mapping
      );

      const { valid, invalid } = SFCCCatalogFactory.validateProducts(products);

      // Analizar tipos de errores
      const errorsByType: Record<string, number> = {};
      invalid.forEach((item: { errors: string[] }) => {
        item.errors.forEach((error: string) => {
          errorsByType[error] = (errorsByType[error] || 0) + 1;
        });
      });

      // Estadísticas de campos
      const fieldStats: Record<string, { filled: number; empty: number }> = {};
      csvData.forEach(row => {
        Object.entries(mapping.headerMappings).forEach(([csvHeader, mappedField]) => {
          if (!fieldStats[mappedField]) {
            fieldStats[mappedField] = { filled: 0, empty: 0 };
          }

          const value = (row as Record<string, string>)[csvHeader];
          if (value && value.trim() !== '') {
            fieldStats[mappedField].filled++;
          } else {
            fieldStats[mappedField].empty++;
          }
        });
      });

      return {
        summary: {
          total: csvData.length,
          valid: valid.length,
          invalid: invalid.length,
          validationRate: Math.round((valid.length / csvData.length) * 100)
        },
        errorsByType,
        fieldStats,
        validProducts: valid.slice(0, 5).map((p: Product) => ({
          productId: p.productId,
          displayName: p.displayName?.value,
          brand: p.brand
        }))
      };
    } catch {
      return {
        summary: { total: 0, valid: 0, invalid: 0, validationRate: 0 },
        errorsByType: { 'Error de análisis': 1 },
        fieldStats: {},
        validProducts: []
      };
    }
  }
}
