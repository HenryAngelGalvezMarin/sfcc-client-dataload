import type {
  LocalizedString,
  CustomAttribute,
  ClassificationCategory,
  ValidationResult,
  XMLGenerationOptions,
  OnlineFlag,
  SearchableFlag,
  AvailableFlag
} from '../base/types';
import { OnlineFlag as OnlineFlagValues, SearchableFlag as SearchableFlagValues, AvailableFlag as AvailableFlagValues } from '../base/types';

// Interfaz Product basada en complexType.Product del XSD
export interface SFCCProduct {
  productId: string;
  displayName?: LocalizedString;
  shortDescription?: LocalizedString;
  longDescription?: LocalizedString;
  brand?: string;
  onlineFlag?: OnlineFlag;
  availableFlag?: AvailableFlag;
  searchableFlag?: SearchableFlag;
  taxClassId?: string;
  classificationCategory?: ClassificationCategory;
  customAttributes?: CustomAttribute[];
}

export class Product implements SFCCProduct {
  public productId: string;
  public displayName?: LocalizedString;
  public shortDescription?: LocalizedString;
  public longDescription?: LocalizedString;
  public brand?: string;
  public onlineFlag?: OnlineFlag;
  public availableFlag?: AvailableFlag;
  public searchableFlag?: SearchableFlag;
  public taxClassId?: string;
  public classificationCategory?: ClassificationCategory;
  public customAttributes?: CustomAttribute[];

  constructor(data: Partial<SFCCProduct> & { productId: string }) {
    this.productId = data.productId;
    this.displayName = data.displayName;
    this.shortDescription = data.shortDescription;
    this.longDescription = data.longDescription;
    this.brand = data.brand;
    this.onlineFlag = data.onlineFlag || OnlineFlagValues.TRUE;
    this.availableFlag = data.availableFlag || AvailableFlagValues.TRUE;
    this.searchableFlag = data.searchableFlag || SearchableFlagValues.TRUE;
    this.taxClassId = data.taxClassId;
    this.classificationCategory = data.classificationCategory;
    this.customAttributes = data.customAttributes || [];
  }

  /**
   * Valida el producto contra el schema SFCC
   */
  validate(): ValidationResult {
    const errors: ValidationResult['errors'] = [];

    // Validaciones requeridas
    if (!this.productId || this.productId.trim() === '') {
      errors.push({
        field: 'productId',
        message: 'Product ID es requerido',
        code: 'REQUIRED_FIELD'
      });
    }

    // Validar longitud de productId (máximo 100 caracteres según SFCC)
    if (this.productId && this.productId.length > 100) {
      errors.push({
        field: 'productId',
        message: 'Product ID no puede exceder 100 caracteres',
        code: 'MAX_LENGTH_EXCEEDED'
      });
    }

    // Validar caracteres válidos en productId
    if (this.productId && !/^[a-zA-Z0-9_-]+$/.test(this.productId)) {
      errors.push({
        field: 'productId',
        message: 'Product ID solo puede contener letras, números, guiones y guiones bajos',
        code: 'INVALID_CHARACTERS'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Genera XML válido para SFCC catalog
   */
  toXML(options: XMLGenerationOptions = {}): string {
    const { indent = '  ', includeXMLDeclaration = false } = options;
    let xml = '';

    if (includeXMLDeclaration) {
      xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
    }

    xml += `<product product-id="${this.escapeXML(this.productId)}">`;

    // Display name
    if (this.displayName) {
      xml += `\n${indent}<display-name`;
      if (this.displayName.locale) {
        xml += ` xml:lang="${this.displayName.locale}"`;
      }
      xml += `>${this.escapeXML(this.displayName.value)}</display-name>`;
    }

    // Short description
    if (this.shortDescription) {
      xml += `\n${indent}<short-description`;
      if (this.shortDescription.locale) {
        xml += ` xml:lang="${this.shortDescription.locale}"`;
      }
      xml += `>${this.escapeXML(this.shortDescription.value)}</short-description>`;
    }

    // Long description
    if (this.longDescription) {
      xml += `\n${indent}<long-description`;
      if (this.longDescription.locale) {
        xml += ` xml:lang="${this.longDescription.locale}"`;
      }
      xml += `>${this.escapeXML(this.longDescription.value)}</long-description>`;
    }

    // Brand
    if (this.brand) {
      xml += `\n${indent}<brand>${this.escapeXML(this.brand)}</brand>`;
    }

    // Flags
    if (this.onlineFlag) {
      xml += `\n${indent}<online-flag>${this.onlineFlag}</online-flag>`;
    }

    if (this.availableFlag) {
      xml += `\n${indent}<available-flag>${this.availableFlag}</available-flag>`;
    }

    if (this.searchableFlag) {
      xml += `\n${indent}<searchable-flag>${this.searchableFlag}</searchable-flag>`;
    }

    // Tax class
    if (this.taxClassId) {
      xml += `\n${indent}<tax-class-id>${this.escapeXML(this.taxClassId)}</tax-class-id>`;
    }

    // Classification category
    if (this.classificationCategory) {
      xml += `\n${indent}<classification-category`;
      if (this.classificationCategory.catalogId) {
        xml += ` catalog-id="${this.escapeXML(this.classificationCategory.catalogId)}"`;
      }
      xml += `>${this.escapeXML(this.classificationCategory.categoryId)}</classification-category>`;
    }

    // Custom attributes
    if (this.customAttributes && this.customAttributes.length > 0) {
      xml += `\n${indent}<custom-attributes>`;
      this.customAttributes.forEach(attr => {
        xml += `\n${indent}${indent}<custom-attribute attribute-id="${this.escapeXML(attr.attributeId)}">`;
        xml += `${this.escapeXML(String(attr.value))}`;
        xml += `</custom-attribute>`;
      });
      xml += `\n${indent}</custom-attributes>`;
    }

    xml += '\n</product>';
    return xml;
  }

  /**
   * Escapa caracteres especiales para XML
   */
  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Crea una instancia desde datos CSV/JSON raw
   */
  static fromRawData(data: Record<string, unknown>, mapping?: { catalog?: { catalogId?: string } }): Product {
    return new Product({
      productId: String(data.productId || data['product-id'] || ''),
      displayName: data.displayName ?
        (typeof data.displayName === 'object' && data.displayName !== null && 'value' in data.displayName ?
          data.displayName as LocalizedString :
          { value: String(data.displayName) }) : undefined,
      shortDescription: data.shortDescription ?
        (typeof data.shortDescription === 'object' && data.shortDescription !== null && 'value' in data.shortDescription ?
          data.shortDescription as LocalizedString :
          { value: String(data.shortDescription) }) : undefined,
      longDescription: data.longDescription ?
        (typeof data.longDescription === 'object' && data.longDescription !== null && 'value' in data.longDescription ?
          data.longDescription as LocalizedString :
          { value: String(data.longDescription) }) : undefined,
      brand: data.brand ? String(data.brand) : undefined,
      onlineFlag: data.online === true || data.online === 'true' ? OnlineFlagValues.TRUE : OnlineFlagValues.FALSE,
      searchableFlag: data.searchable === true || data.searchable === 'true' ? SearchableFlagValues.TRUE : SearchableFlagValues.FALSE,
      classificationCategory: data.category ? {
        categoryId: String(data.category),
        catalogId: mapping?.catalog?.catalogId || 'master-catalog'
      } : undefined
    });
  }
}
