// Tipos para los metadatos extraídos del XSD

export interface XSDAttribute {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface XSDElement {
  name: string;
  type: string;
  required: boolean;
  minOccurs: number;
  maxOccurs: number | 'unbounded';
  description?: string;
  attributes: XSDAttribute[];
  children: XSDElement[];
  isSimpleType: boolean;
  enumValues?: string[];
  pattern?: string;
  length?: {
    min?: number;
    max?: number;
  };
}

export interface XSDComplexType {
  name: string;
  description?: string;
  elements: XSDElement[];
  attributes: XSDAttribute[];
  baseType?: string;
}

export interface XSDSimpleType {
  name: string;
  description?: string;
  baseType: string;
  restrictions: {
    enumeration?: string[];
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minInclusive?: number;
    maxInclusive?: number;
  };
}

export interface XSDMetadata {
  targetNamespace: string;
  rootElement: string;
  version?: string;
  description?: string;
  elements: Record<string, XSDElement>;
  complexTypes: Record<string, XSDComplexType>;
  simpleTypes: Record<string, XSDSimpleType>;
  imports: string[];
  includes: string[];
}

export interface MappingRule {
  sourceColumn: string;
  targetElement: string;
  targetAttribute?: string;
  transformation?: 'uppercase' | 'lowercase' | 'trim' | 'date' | 'number' | 'boolean';
  defaultValue?: string;
  required: boolean;
}

export interface ConversionConfig {
  name: string;
  description?: string;
  xsdMetadata: XSDMetadata;
  mappingRules: MappingRule[];
  outputSettings: {
    rootElement: string;
    namespace?: string;
    encoding: string;
    indent: boolean;
  };
}
