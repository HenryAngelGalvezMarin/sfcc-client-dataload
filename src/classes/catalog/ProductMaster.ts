import { Product, type SFCCProduct } from "./Product";
import type {
  VariationAttribute,
  ProductVariant,
  XMLGenerationOptions,
} from "./base/types";

export interface SFCCProductMaster extends SFCCProduct {
  variationAttributes?: VariationAttribute[];
  variants?: ProductVariant[];
}

export class ProductMaster extends Product implements SFCCProductMaster {
  public variationAttributes: VariationAttribute[] = [];
  public variants: ProductVariant[] = [];

  constructor(data: Partial<SFCCProductMaster> & { productId: string }) {
    super(data);
    this.variationAttributes = data.variationAttributes || [];
    this.variants = data.variants || [];
  }

  /**
   * Genera XML válido para SFCC catalog incluyendo variaciones
   */
  toXML(options: XMLGenerationOptions = {}): string {
    let xml = super.toXML(options);

    // Si hay variaciones, insertarlas antes del cierre </product>
    if (this.variationAttributes.length > 0 && this.variants.length > 0) {
      const variationsXML = this.generateVariationsXML(options.indent || '  ');
      xml = xml.replace('</product>', `${variationsXML}\n</product>`);
    }

    return xml;
  }

  /**
   * Genera XML de variaciones
   */
  private generateVariationsXML(baseIndent: string): string {
    const indent = baseIndent;
    const indent2 = baseIndent + baseIndent;
    const indent3 = indent2 + baseIndent;
    const indent4 = indent3 + baseIndent;

    let xml = `\n${indent}<variations>`;

    // Attributes section
    xml += `\n${indent2}<attributes>`;

    this.variationAttributes.forEach(attr => {
      xml += `\n${indent3}<variation-attribute attribute-id="${this.escapeXML(attr.attributeId)}" variation-attribute-id="${this.escapeXML(attr.attributeId)}">`;
      xml += `\n${indent4}<display-name`;
      if (attr.displayName.locale) {
        xml += ` xml:lang="${attr.displayName.locale}"`;
      }
      xml += `>${this.escapeXML(attr.displayName.value)}</display-name>`;
      xml += `\n${indent4}<variation-attribute-values>`;

      attr.values.forEach(value => {
        xml += `\n${indent4}${baseIndent}<variation-attribute-value value="${this.escapeXML(value.value)}">`;
        xml += `<display-value`;
        if (value.displayValue.locale) {
          xml += ` xml:lang="${value.displayValue.locale}"`;
        }
        xml += `>${this.escapeXML(value.displayValue.value)}</display-value>`;
        xml += `</variation-attribute-value>`;
      });

      xml += `\n${indent4}</variation-attribute-values>`;
      xml += `\n${indent3}</variation-attribute>`;
    });

    xml += `\n${indent2}</attributes>`;

    // Variants section
    xml += `\n${indent2}<variants>`;
    this.variants.forEach(variant => {
      xml += `\n${indent3}<variant product-id="${this.escapeXML(variant.productId)}"/>`;
    });
    xml += `\n${indent2}</variants>`;

    xml += `\n${indent}</variations>`;
    return xml;
  }

  /**
   * Crea una instancia ProductMaster desde datos CSV/JSON raw
   */
  static fromRawData(data: Record<string, unknown>): ProductMaster {
    return new ProductMaster(data as Partial<SFCCProductMaster> & { productId: string });
  }

  /**
   * Agrega un atributo de variación
   */
  addVariationAttribute(attribute: VariationAttribute): void {
    const existingIndex = this.variationAttributes.findIndex(
      attr => attr.attributeId === attribute.attributeId
    );

    if (existingIndex >= 0) {
      this.variationAttributes[existingIndex] = attribute;
    } else {
      this.variationAttributes.push(attribute);
    }
  }

  /**
   * Agrega una variante
   */
  addVariant(variant: ProductVariant): void {
    const existingIndex = this.variants.findIndex(
      v => v.productId === variant.productId
    );

    if (existingIndex >= 0) {
      this.variants[existingIndex] = variant;
    } else {
      this.variants.push(variant);
    }
  }

  /**
   * Obtiene valores únicos para un atributo de variación específico
   */
  getVariationValues(attributeId: string): string[] {
    return [...new Set(this.variants.map(v => v.attributeValues[attributeId]).filter(Boolean))];
  }
}
