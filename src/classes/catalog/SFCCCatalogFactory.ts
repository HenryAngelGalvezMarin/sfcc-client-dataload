import { Product } from './Product';
import type { CompanyMapping } from '../../types/company';

export class SFCCCatalogFactory {
  /**
   * Crea un producto desde una fila CSV usando mapping de empresa
   */
  static createProductFromCSV(csvRow: Record<string, string>, mapping: CompanyMapping): Product {
    const productData: Record<string, unknown> = {};

    // Mapear headers CSV a propiedades del producto
    Object.entries(csvRow).forEach(([csvHeader, value]) => {
      const mappedProperty = mapping.headerMappings[csvHeader];
      if (mappedProperty && mapping.columnMappings[mappedProperty]) {
        const config = mapping.columnMappings[mappedProperty];

        // Aplicar transformaciones
        let transformedValue: unknown = value;

        if (config.dataType === 'boolean' && mapping.transformations?.boolean) {
          const lowerValue = value.toLowerCase().trim();
          if (mapping.transformations.boolean.true.includes(lowerValue)) {
            transformedValue = true;
          } else if (mapping.transformations.boolean.false.includes(lowerValue)) {
            transformedValue = false;
          }
        }

        // Asignar valor transformado
        if (mappedProperty === 'product-id') {
          productData.productId = transformedValue;
        } else if (mappedProperty === 'display-name') {
          productData.displayName = {
            value: String(transformedValue),
            locale: config.locale
          };
        } else if (mappedProperty === 'description') {
          productData.longDescription = {
            value: String(transformedValue),
            locale: config.locale
          };
        } else if (mappedProperty === 'brand') {
          productData.brand = String(transformedValue);
        } else if (mappedProperty === 'category') {
          productData.classificationCategory = {
            categoryId: String(transformedValue),
            catalogId: config.catalogId || mapping.catalog.catalogId
          };
        } else if (mappedProperty === 'online') {
          productData.onlineFlag = transformedValue === true ? 'true' : 'false';
        }
      }
    });

    return Product.fromRawData(productData, mapping);
  }

  /**
   * Crea múltiples productos desde datos CSV
   */
  static createProductsFromCSV(csvData: Record<string, string>[], mapping: CompanyMapping): Product[] {
    return csvData.map(row => this.createProductFromCSV(row, mapping));
  }

  /**
   * Valida múltiples productos y retorna errores
   */
  static validateProducts(products: Product[]): { valid: Product[]; invalid: Array<{ product: Product; errors: string[] }> } {
    const valid: Product[] = [];
    const invalid: Array<{ product: Product; errors: string[] }> = [];

    products.forEach(product => {
      const validation = product.validate();
      if (validation.isValid) {
        valid.push(product);
      } else {
        invalid.push({
          product,
          errors: validation.errors.map(err => `${err.field}: ${err.message}`)
        });
      }
    });

    return { valid, invalid };
  }

  /**
   * Genera XML de catálogo completo desde productos válidos
   */
  static generateCatalogXML(products: Product[], catalogConfig: CompanyMapping['catalog']): string {
    const validProducts = products.filter(p => p.validate().isValid);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<catalog xmlns="http://www.demandware.com/xml/impex/catalog/2006-10-31" ';
    xml += `catalog-id="${catalogConfig.catalogId}">\n`;

    // Header
    xml += '  <header>\n';
    if (catalogConfig.defaultLocale) {
      xml += `    <default-locale>${catalogConfig.defaultLocale}</default-locale>\n`;
    }
    if (catalogConfig.defaultCurrency) {
      xml += `    <default-currency>${catalogConfig.defaultCurrency}</default-currency>\n`;
    }
    xml += '  </header>\n\n';

    // Products
    validProducts.forEach(product => {
      xml += '  ' + product.toXML({ indent: '    ' }).replace(/\n/g, '\n  ') + '\n\n';
    });

    xml += '</catalog>';
    return xml;
  }
}
