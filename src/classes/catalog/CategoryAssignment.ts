import type { ValidationResult, XMLGenerationOptions } from './base/types';

export interface SFCCCategoryAssignment {
  categoryId: string;
  productId: string;
  position?: number;
  primary?: boolean;
}

export class CategoryAssignment implements SFCCCategoryAssignment {
  public categoryId: string;
  public productId: string;
  public position?: number;
  public primary?: boolean;

  constructor(data: SFCCCategoryAssignment) {
    this.categoryId = data.categoryId;
    this.productId = data.productId;
    this.position = data.position;
    this.primary = data.primary;
  }

  validate(): ValidationResult {
    const errors: ValidationResult['errors'] = [];

    if (!this.categoryId || this.categoryId.trim() === '') {
      errors.push({
        field: 'categoryId',
        message: 'Category ID es requerido',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!this.productId || this.productId.trim() === '') {
      errors.push({
        field: 'productId',
        message: 'Product ID es requerido',
        code: 'REQUIRED_FIELD'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toXML(options: XMLGenerationOptions = {}): string {
    const { indent = '  ' } = options;
    let xml = `<category-assignment category-id="${this.escapeXML(this.categoryId)}" product-id="${this.escapeXML(this.productId)}">`;

    if (this.position !== undefined) {
      xml += `\n${indent}<position>${this.position}</position>`;
    }

    if (this.primary !== undefined) {
      xml += `\n${indent}<primary-flag>${this.primary}</primary-flag>`;
    }

    xml += '\n</category-assignment>';
    return xml;
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static fromRawData(data: Record<string, unknown>): CategoryAssignment {
    return new CategoryAssignment({
      categoryId: String(data.categoryId || data['category-id'] || ''),
      productId: String(data.productId || data['product-id'] || ''),
      position: data.position ? Number(data.position) : undefined,
      primary: data.primary === true || data.primary === 'true'
    });
  }
}
