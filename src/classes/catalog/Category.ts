import type { LocalizedString, ValidationResult, XMLGenerationOptions } from './base/types';

export interface SFCCCategory {
  categoryId: string;
  displayName?: LocalizedString;
  description?: LocalizedString;
  pageTitle?: LocalizedString;
  pageDescription?: LocalizedString;
  pageKeywords?: LocalizedString;
  onlineFlag?: boolean;
  parentCategoryId?: string;
  position?: number;
}

export class Category implements SFCCCategory {
  public categoryId: string;
  public displayName?: LocalizedString;
  public description?: LocalizedString;
  public pageTitle?: LocalizedString;
  public pageDescription?: LocalizedString;
  public pageKeywords?: LocalizedString;
  public onlineFlag?: boolean;
  public parentCategoryId?: string;
  public position?: number;

  constructor(data: Partial<SFCCCategory> & { categoryId: string }) {
    this.categoryId = data.categoryId;
    this.displayName = data.displayName;
    this.description = data.description;
    this.pageTitle = data.pageTitle;
    this.pageDescription = data.pageDescription;
    this.pageKeywords = data.pageKeywords;
    this.onlineFlag = data.onlineFlag !== false;
    this.parentCategoryId = data.parentCategoryId;
    this.position = data.position;
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

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toXML(options: XMLGenerationOptions = {}): string {
    const { indent = '  ' } = options;
    let xml = `<category category-id="${this.escapeXML(this.categoryId)}">`;

    if (this.displayName) {
      xml += `\n${indent}<display-name`;
      if (this.displayName.locale) {
        xml += ` xml:lang="${this.displayName.locale}"`;
      }
      xml += `>${this.escapeXML(this.displayName.value)}</display-name>`;
    }

    if (this.onlineFlag !== undefined) {
      xml += `\n${indent}<online-flag>${this.onlineFlag}</online-flag>`;
    }

    if (this.parentCategoryId) {
      xml += `\n${indent}<parent>${this.escapeXML(this.parentCategoryId)}</parent>`;
    }

    xml += '\n</category>';
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
}
