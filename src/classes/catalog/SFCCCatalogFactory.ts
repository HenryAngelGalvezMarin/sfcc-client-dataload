import { Product } from "./Product";
import type { CompanyMapping } from "../../types/company";

export class SFCCCatalogFactory {
  /**
   * Crea un producto desde una fila CSV usando mapping de empresa
   */
  static createProductFromCSV(
    csvRow: Record<string, string>,
    mapping: CompanyMapping
  ): Product {
    const productData: Record<string, unknown> = {};
    const multipleHeaders: Record<
      string,
      {
        headers: string[];
        value: string;
      }
    > = {};

    Object.entries(mapping.columnMappings).forEach(
      ([mappedProperty, config]) => {
        if (config.multipleHeader) {
          multipleHeaders[mappedProperty] = {
            headers: mapping.headerMappings[mappedProperty]
              .split(",")
              .map((h) => h.trim()),
            value: "",
          };
        }
      }
    );

    // Mapear headers CSV a propiedades del producto
    Object.entries(csvRow).forEach(([csvHeader, value]) => {
      // Obtener TODAS las propiedades que mapean a este csvHeader
      const mappedProperties = this.getAllColumnMappings(mapping, csvHeader);

      Object.entries(multipleHeaders).forEach(([, element]) => {
        if (element.headers.includes(csvHeader)) {
          if (!element.value) {
            element.value += String(value);
          } else {
            element.value = element.value + ", " + String(value);
          }
        }
      });

      // Procesar cada propiedad que mapea a este csvHeader
      mappedProperties.forEach((mappedProperty) => {
        const config = mapping.columnMappings[mappedProperty];

        if (config.multipleHeader) {
          return;
        }

        // Aplicar transformaciones
        let transformedValue: unknown = value;

        if (config.dataType === "boolean" && mapping.transformations?.boolean) {
          const lowerValue = value.toLowerCase().trim();
          if (mapping.transformations.boolean.true.includes(lowerValue)) {
            transformedValue = true;
          } else if (
            mapping.transformations.boolean.false.includes(lowerValue)
          ) {
            transformedValue = false;
          }
        }

        if (config.objectAttribute) {
          this.setNestedProperty(
            productData,
            config.objectAttribute,
            transformedValue,
            config,
            mappedProperty
          );
        }
      });
    });

    // Cargar los demas attributes default
    Object.entries(mapping.columnMappings).forEach(
      ([mappedProperty, config]) => {
        if (
          !productData[mappedProperty] &&
          config.defaultValue !== undefined &&
          config.objectAttribute
        ) {
          this.setNestedProperty(
            productData,
            config.objectAttribute,
            config.defaultValue,
            config,
            mappedProperty
          );
        }

        if (multipleHeaders[mappedProperty] && config.objectAttribute) {
          this.setNestedProperty(
            productData,
            config.objectAttribute,
            multipleHeaders[mappedProperty].value,
            config,
            mappedProperty
          );
        }
      }
    );

    return Product.fromRawData(productData);
  }

  /**
   * Crea múltiples productos desde datos CSV
   */
  static createProductsFromCSV(
    csvData: Record<string, string>[],
    mapping: CompanyMapping
  ): Product[] {
    return csvData.map((row) => this.createProductFromCSV(row, mapping));
  }

  /**
   * Valida múltiples productos y retorna errores
   */
  static validateProducts(products: Product[]): {
    valid: Product[];
    invalid: Array<{ product: Product; errors: string[] }>;
  } {
    const valid: Product[] = [];
    const invalid: Array<{ product: Product; errors: string[] }> = [];

    products.forEach((product) => {
      const validation = product.validate();
      if (validation.isValid) {
        valid.push(product);
      } else {
        invalid.push({
          product,
          errors: validation.errors.map(
            (err) => `${err.field}: ${err.message}`
          ),
        });
      }
    });

    return { valid, invalid };
  }

  /**
   * Genera XML de catálogo completo desde productos válidos
   */
  static generateCatalogXML(
    products: Product[],
    catalogConfig: CompanyMapping["catalog"]
  ): string {
    const validProducts = products.filter((p) => p.validate().isValid);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml +=
      '<catalog xmlns="http://www.demandware.com/xml/impex/catalog/2006-10-31" ';
    xml += `catalog-id="${catalogConfig.catalogId}">\n`;

    // Header
    xml += "  <header>\n";
    if (catalogConfig.defaultLocale) {
      xml += `    <default-locale>${catalogConfig.defaultLocale}</default-locale>\n`;
    }
    if (catalogConfig.defaultCurrency) {
      xml += `    <default-currency>${catalogConfig.defaultCurrency}</default-currency>\n`;
    }
    if (catalogConfig.imageSettings) {
      xml += "    <image-settings>\n";
      xml += `      <internal-location base-path="${catalogConfig.imageSettings.internalLocation.basePath}"/>\n`;
      xml += "      <view-types>\n";
      catalogConfig.imageSettings.viewTypes.forEach((viewType) => {
        xml += `        <view-type>${viewType}</view-type>\n`;
      });
      xml += "      </view-types>\n";
      xml += `      <variation-attribute-id>${catalogConfig.imageSettings.variationAttributeId}</variation-attribute-id>\n`;
      xml += `      <alt-pattern>${catalogConfig.imageSettings.altPattern}</alt-pattern>\n`;
      xml += `      <title-pattern>${catalogConfig.imageSettings.titlePattern}</title-pattern>\n`;
      xml += "    </image-settings>\n";
    }
    xml += "  </header>\n\n";

    // Products
    validProducts.forEach((product) => {
      xml +=
        "  " +
        product.toXML({ indent: "    " }).replace(/\n/g, "\n  ") +
        "\n\n";
    });

    xml += "</catalog>";
    return xml;
  }

  static getColumnMapping(
    mapping: CompanyMapping,
    header: string
  ): string | null {
    for (const [key, value] of Object.entries(mapping.headerMappings)) {
      if (value === header) {
        return key;
      }
    }

    return null;
  }

  /**
   * Obtiene TODAS las propiedades que mapean a un header específico
   */
  static getAllColumnMappings(
    mapping: CompanyMapping,
    header: string
  ): string[] {
    const matches: string[] = [];

    for (const [key, value] of Object.entries(mapping.headerMappings)) {
      if (value === header) {
        matches.push(key);
      }
    }

    return matches;
  }

  /**
   * Establece una propiedad anidada en un objeto usando dot notation
   */
  private static setNestedProperty(
    obj: Record<string, unknown>,
    path: string,
    value: unknown,
    config: Record<string, unknown>,
    mappedProperty: string
  ): void {
    const keys = path.split(".");
    let current = obj;

    // Navegar hasta el penúltimo nivel
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    const finalKey = keys[keys.length - 1];

    // Manejar casos especiales
    if (path === "customAttributes") {
      // Para custom attributes, crear array si no existe y agregar el atributo
      if (!Array.isArray(current[finalKey])) {
        current[finalKey] = [];
      }
      (current[finalKey] as unknown[]).push({
        attributeId: mappedProperty,
        value: value,
      });
    } else if (
      path.includes("displayName") ||
      path.includes("shortDescription") ||
      path.includes("longDescription")
    ) {
      // Para strings localizados
      current[finalKey] = {
        value: String(value),
        locale: config.locale || "x-default",
      };
    } else {
      // Caso general
      current[finalKey] = value;
    }
  }
}
