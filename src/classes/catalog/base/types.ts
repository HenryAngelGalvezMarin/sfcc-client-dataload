// Tipos base para SFCC
// Generado automáticamente desde XSD metadata

export interface LocalizedString {
  value: string;
  locale?: string;
}

export interface CustomAttribute {
  attributeId: string;
  value: string | number | boolean;
  displayValue?: LocalizedString;
}

export interface ClassificationCategory {
  categoryId: string;  // Contenido del elemento
  catalogId?: string;  // Atributo catalog-id (opcional según XSD)
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface XMLGenerationOptions {
  includeXMLDeclaration?: boolean;
  indent?: string;
  encoding?: string;
}

// Enums basados en schema
export const OnlineFlag = {
  TRUE: 'true',
  FALSE: 'false'
} as const;

export const SearchableFlag = {
  TRUE: 'true',
  FALSE: 'false'
} as const;

export const AvailableFlag = {
  TRUE: 'true',
  FALSE: 'false'
} as const;

export type Images = {
  url: string;
  altText?: string;
  title?: string;
  width?: number;
  height?: number;
};

export type PageAttributes = {
  pageTitle?: string;
  pageDescription?: string;
  pageKeywords?: string;
}

export type StoreAttributes = {
  forcePriceFlag?: boolean;
  nonInventoryFlag?: boolean;
  nonRevenueFlag?: boolean;
  nonDiscountableFlag?: boolean;
};

export type OnlineFlag = typeof OnlineFlag[keyof typeof OnlineFlag];
export type SearchableFlag = typeof SearchableFlag[keyof typeof SearchableFlag];
export type AvailableFlag = typeof AvailableFlag[keyof typeof AvailableFlag];

// Tipos para variaciones de productos
export interface VariationAttribute {
  attributeId: string;
  displayName: LocalizedString;
  values: VariationAttributeValue[];
}

export interface VariationAttributeValue {
  value: string;
  displayValue: LocalizedString;
}

export interface ProductVariant {
  productId: string;
  attributeValues: Record<string, string>;
}
