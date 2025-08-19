import { Product } from "./Product";
import { ProductMaster } from "./ProductMaster";
import type { VariationAttribute, ProductVariant } from "./base/types";
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
   * Crea productos master con variaciones desde CSV
   */
  static createProductMastersFromCSV(
    csvData: Record<string, string>[],
    mapping: CompanyMapping
  ): ProductMaster[] {
    if (!mapping.variationSettings?.enabled) {
      // Fallback al comportamiento actual sin variaciones
      return this.createProductsFromCSV(csvData, mapping).map(p =>
        ProductMaster.fromRawData({ ...p, productId: p.productId })
      );
    }

    const { variationSettings } = mapping;

    // 1. Agrupar por SKU_ABUELO (master identifier)
    const groupedData = this.groupByField(csvData, variationSettings.masterIdentifier);

    const masters: ProductMaster[] = [];

    // 2. Procesar cada grupo
    for (const [masterSku, variants] of groupedData) {
      const masterData = this.extractMasterData(variants, variationSettings, mapping);
      const master = new ProductMaster({ ...masterData, productId: masterSku });

      // 3. Extraer atributos de variación
      master.variationAttributes = this.extractVariationAttributes(variants, variationSettings);

      // 4. Crear variantes
      master.variants = this.extractVariants(variants, variationSettings);

      masters.push(master);
    }

    return masters;
  }

  /**
   * Valida múltiples productos y retorna errores
   */
  static validateProducts(products: (Product | ProductMaster)[]): {
    valid: (Product | ProductMaster)[];
    invalid: Array<{ product: Product | ProductMaster; errors: string[] }>;
  } {
    const valid: (Product | ProductMaster)[] = [];
    const invalid: Array<{ product: Product | ProductMaster; errors: string[] }> = [];

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
    products: (Product | ProductMaster)[],
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

  /**
   * Agrupa datos por un campo específico
   */
  private static groupByField(
    data: Record<string, string>[],
    field: string
  ): Map<string, Record<string, string>[]> {
    const groups = new Map<string, Record<string, string>[]>();

    data.forEach(row => {
      const key = row[field];
      if (key) {
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(row);
      }
    });

    return groups;
  }

  /**
   * Extrae datos del master desde las variantes
   */
  private static extractMasterData(
    variants: Record<string, string>[],
    variationSettings: NonNullable<CompanyMapping['variationSettings']>,
    mapping: CompanyMapping
  ): Record<string, unknown> {
    // Tomar el primer registro como base
    const baseVariant = variants[0];
    const masterRow: Record<string, string> = {};

    // Solo incluir campos del master según configuración
    variationSettings.grouping.masterFields.forEach(field => {
      if (baseVariant[field] !== undefined) {
        masterRow[field] = baseVariant[field];
      }
    });

    // Usar el ID del master como product-id
    masterRow[variationSettings.masterIdentifier] = baseVariant[variationSettings.masterIdentifier];

    // Procesar usando la lógica existente de mapeo
    const productData: Record<string, unknown> = {};
    const multipleHeaders: Record<string, { headers: string[]; value: string; }> = {};

    Object.entries(mapping.columnMappings).forEach(([mappedProperty, config]) => {
      if (config.multipleHeader) {
        multipleHeaders[mappedProperty] = {
          headers: mapping.headerMappings[mappedProperty]?.split(",").map(h => h.trim()) || [],
          value: "",
        };
      }
    });

    // Mapear headers CSV a propiedades del producto
    Object.entries(masterRow).forEach(([csvHeader, value]) => {
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

      mappedProperties.forEach((mappedProperty) => {
        const config = mapping.columnMappings[mappedProperty];
        if (config.multipleHeader) return;

        let transformedValue: unknown = value;
        if (config.dataType === "boolean" && mapping.transformations?.boolean) {
          const lowerValue = value.toLowerCase().trim();
          if (mapping.transformations.boolean.true.includes(lowerValue)) {
            transformedValue = true;
          } else if (mapping.transformations.boolean.false.includes(lowerValue)) {
            transformedValue = false;
          }
        }

        if (config.objectAttribute) {
          this.setNestedProperty(productData, config.objectAttribute, transformedValue, config, mappedProperty);
        }
      });
    });

    // Cargar valores default
    Object.entries(mapping.columnMappings).forEach(([mappedProperty, config]) => {
      if (!productData[mappedProperty] && config.defaultValue !== undefined && config.objectAttribute) {
        this.setNestedProperty(productData, config.objectAttribute, config.defaultValue, config, mappedProperty);
      }

      if (multipleHeaders[mappedProperty] && config.objectAttribute) {
        this.setNestedProperty(productData, config.objectAttribute, multipleHeaders[mappedProperty].value, config, mappedProperty);
      }
    });

    return productData;
  }

  /**
   * Extrae atributos de variación desde las variantes
   */
  private static extractVariationAttributes(
    variants: Record<string, string>[],
    variationSettings: NonNullable<CompanyMapping['variationSettings']>
  ): VariationAttribute[] {
    const attributes: VariationAttribute[] = [];

    Object.entries(variationSettings.variationAttributes).forEach(([attrId, config]) => {
      const uniqueValues = [...new Set(variants.map(v => v[config.csvColumn]))].filter(Boolean);

      if (uniqueValues.length > 0) {
        attributes.push({
          attributeId: attrId,
          displayName: { value: config.displayName, locale: 'x-default' },
          values: uniqueValues.map(value => ({
            value,
            displayValue: { value, locale: 'x-default' }
          }))
        });
      }
    });

    return attributes.sort((a, b) => {
      const orderA = variationSettings.variationAttributes[a.attributeId]?.sortOrder || 999;
      const orderB = variationSettings.variationAttributes[b.attributeId]?.sortOrder || 999;
      return orderA - orderB;
    });
  }

  /**
   * Extrae variantes desde los datos CSV
   */
  private static extractVariants(
    variants: Record<string, string>[],
    variationSettings: NonNullable<CompanyMapping['variationSettings']>
  ): ProductVariant[] {
    return variants.map(variant => ({
      productId: variant[variationSettings.variantIdentifier],
      attributeValues: Object.fromEntries(
        Object.entries(variationSettings.variationAttributes).map(([attrId, config]) => [
          attrId,
          variant[config.csvColumn] || ''
        ])
      )
    }));
  }
}
