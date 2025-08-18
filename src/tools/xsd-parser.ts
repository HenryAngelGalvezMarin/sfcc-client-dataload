import { XMLParser } from 'fast-xml-parser';
import { readFileSync } from 'fs';
import { XSDMetadata, XSDElement, XSDComplexType, XSDSimpleType, XSDAttribute } from '../types/xsd-metadata';

// Tipos para elementos XSD parseados
interface ParsedXSDElement {
  [key: string]: unknown;
  '@_name'?: string;
  '@_type'?: string;
  '@_minOccurs'?: string;
  '@_maxOccurs'?: string;
  '@_use'?: string;
  '@_default'?: string;
}

export class XSDParser {
  private parser: XMLParser;
  private xsdContent: any;
  private targetNamespace: string = '';
  private elementFormDefault: string = 'unqualified';

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true
    });
  }

  /**
   * Parsea un archivo XSD y genera metadatos estructurados
   */
  public parseXSD(xsdFilePath: string): XSDMetadata {
    try {
      const xsdContent = readFileSync(xsdFilePath, 'utf-8');
      return this.parseXSDContent(xsdContent);
    } catch (error) {
      throw new Error(`Error leyendo archivo XSD: ${error}`);
    }
  }

  /**
   * Parsea contenido XSD desde string
   */
  public parseXSDContent(xsdContent: string): XSDMetadata {
    this.xsdContent = this.parser.parse(xsdContent);

    // Buscar el elemento schema con diferentes namespaces
    const schema = this.xsdContent['xs:schema'] ||
                   this.xsdContent['xsd:schema'] ||
                   this.xsdContent.schema;

    if (!schema) {
      console.log('Contenido parseado:', JSON.stringify(this.xsdContent, null, 2));
      throw new Error('No se encontró elemento schema en el XSD');
    }

    this.targetNamespace = schema['@_targetNamespace'] || '';
    this.elementFormDefault = schema['@_elementFormDefault'] || 'unqualified';

    const metadata: XSDMetadata = {
      targetNamespace: this.targetNamespace,
      rootElement: this.findRootElement(schema),
      version: schema['@_version'],
      description: this.extractDocumentation(schema),
      elements: {},
      complexTypes: {},
      simpleTypes: {},
      imports: this.extractImports(schema),
      includes: this.extractIncludes(schema)
    };

    // Procesar elementos globales
    this.processGlobalElements(schema, metadata);

    // Procesar tipos complejos
    this.processComplexTypes(schema, metadata);

    // Procesar tipos simples
    this.processSimpleTypes(schema, metadata);

    return metadata;
  }

  private findRootElement(schema: Record<string, unknown>): string {
    const elements = this.ensureArray(
      schema['xs:element'] || schema['xsd:element'] || schema.element || []
    );
    // El primer elemento global suele ser el root
    return elements.length > 0 ? (elements[0] as Record<string, unknown>)['@_name'] as string || '' : '';
  }

  private extractDocumentation(element: Record<string, unknown>): string | undefined {
    const annotation = element['xs:annotation'] || element['xsd:annotation'] || element.annotation;
    if (!annotation) return undefined;

    const documentation = (annotation as Record<string, unknown>)['xs:documentation'] ||
                         (annotation as Record<string, unknown>)['xsd:documentation'] ||
                         (annotation as Record<string, unknown>).documentation;
    if (!documentation) return undefined;

    return typeof documentation === 'string' ? documentation : (documentation as Record<string, unknown>)['#text'] as string;
  }

  private extractImports(schema: Record<string, unknown>): string[] {
    const imports = this.ensureArray(
      schema['xs:import'] || schema['xsd:import'] || schema.import || []
    );
    return imports.map((imp: Record<string, unknown>) =>
      imp['@_namespace'] as string || imp['@_schemaLocation'] as string
    ).filter(Boolean);
  }

  private extractIncludes(schema: Record<string, unknown>): string[] {
    const includes = this.ensureArray(
      schema['xs:include'] || schema['xsd:include'] || schema.include || []
    );
    return includes.map((inc: Record<string, unknown>) =>
      inc['@_schemaLocation'] as string
    ).filter(Boolean);
  }

  private processGlobalElements(schema: Record<string, unknown>, metadata: XSDMetadata): void {
    const elements = this.ensureArray(
      schema['xs:element'] || schema['xsd:element'] || schema.element || []
    );

    elements.forEach((element: Record<string, unknown>) => {
      const parsedElement = this.parseElement(element);
      metadata.elements[parsedElement.name] = parsedElement;
    });
  }

  private processComplexTypes(schema: Record<string, unknown>, metadata: XSDMetadata): void {
    const complexTypes = this.ensureArray(
      schema['xs:complexType'] || schema['xsd:complexType'] || schema.complexType || []
    );

    complexTypes.forEach((complexType: Record<string, unknown>) => {
      const parsedType = this.parseComplexType(complexType);
      metadata.complexTypes[parsedType.name] = parsedType;
    });
  }

  private processSimpleTypes(schema: Record<string, unknown>, metadata: XSDMetadata): void {
    const simpleTypes = this.ensureArray(
      schema['xs:simpleType'] || schema['xsd:simpleType'] || schema.simpleType || []
    );

    simpleTypes.forEach((simpleType: Record<string, unknown>) => {
      const parsedType = this.parseSimpleType(simpleType);
      metadata.simpleTypes[parsedType.name] = parsedType;
    });
  }

  private parseElement(element: any): XSDElement {
    const name = element['@_name'];
    const type = element['@_type'] || 'string';
    const minOccurs = parseInt(element['@_minOccurs'] || '1');
    const maxOccurs = element['@_maxOccurs'] === 'unbounded' ? 'unbounded' : parseInt(element['@_maxOccurs'] || '1');

    const parsedElement: XSDElement = {
      name,
      type,
      required: minOccurs > 0,
      minOccurs,
      maxOccurs,
      description: this.extractDocumentation(element),
      attributes: [],
      children: [],
      isSimpleType: !this.hasComplexContent(element)
    };

    // Procesar atributos
    parsedElement.attributes = this.parseAttributes(element);

    // Procesar elementos hijos
    parsedElement.children = this.parseChildElements(element);

    // Si tiene restricciones, extraerlas
    if (this.hasRestrictions(element)) {
      const restrictions = this.extractRestrictions(element);
      parsedElement.enumValues = restrictions.enumeration;
      parsedElement.pattern = restrictions.pattern;
      parsedElement.length = {
        min: restrictions.minLength,
        max: restrictions.maxLength
      };
    }

    return parsedElement;
  }

  private parseComplexType(complexType: any): XSDComplexType {
    const name = complexType['@_name'];

    return {
      name,
      description: this.extractDocumentation(complexType),
      elements: this.parseChildElements(complexType),
      attributes: this.parseAttributes(complexType),
      baseType: this.extractBaseType(complexType)
    };
  }

  private parseSimpleType(simpleType: any): XSDSimpleType {
    const name = simpleType['@_name'];
    const restrictions = this.extractRestrictions(simpleType);

    return {
      name,
      description: this.extractDocumentation(simpleType),
      baseType: restrictions.base || 'string',
      restrictions: {
        enumeration: restrictions.enumeration,
        pattern: restrictions.pattern,
        minLength: restrictions.minLength,
        maxLength: restrictions.maxLength,
        minInclusive: restrictions.minInclusive,
        maxInclusive: restrictions.maxInclusive
      }
    };
  }

  private parseAttributes(element: any): XSDAttribute[] {
    const attributes: XSDAttribute[] = [];

    // Buscar atributos directos
    const directAttrs = this.ensureArray(element['xs:attribute'] || element.attribute || []);
    directAttrs.forEach((attr: any) => {
      attributes.push({
        name: attr['@_name'],
        type: attr['@_type'] || 'string',
        required: attr['@_use'] === 'required',
        defaultValue: attr['@_default'],
        description: this.extractDocumentation(attr)
      });
    });

    // Buscar atributos en complexType
    const complexType = element['xs:complexType'] || element.complexType;
    if (complexType) {
      const complexAttrs = this.ensureArray(complexType['xs:attribute'] || complexType.attribute || []);
      complexAttrs.forEach((attr: any) => {
        attributes.push({
          name: attr['@_name'],
          type: attr['@_type'] || 'string',
          required: attr['@_use'] === 'required',
          defaultValue: attr['@_default'],
          description: this.extractDocumentation(attr)
        });
      });
    }

    return attributes;
  }

  private parseChildElements(parent: any): XSDElement[] {
    const children: XSDElement[] = [];

    // Buscar en sequence, choice, all
    const complexType = parent['xs:complexType'] || parent.complexType || parent;
    const sequence = complexType['xs:sequence'] || complexType.sequence;
    const choice = complexType['xs:choice'] || complexType.choice;
    const all = complexType['xs:all'] || complexType.all;

    if (sequence) {
      const elements = this.ensureArray(sequence['xs:element'] || sequence.element || []);
      elements.forEach((element: any) => {
        children.push(this.parseElement(element));
      });
    }

    if (choice) {
      const elements = this.ensureArray(choice['xs:element'] || choice.element || []);
      elements.forEach((element: any) => {
        children.push(this.parseElement(element));
      });
    }

    if (all) {
      const elements = this.ensureArray(all['xs:element'] || all.element || []);
      elements.forEach((element: any) => {
        children.push(this.parseElement(element));
      });
    }

    return children;
  }

  private hasComplexContent(element: any): boolean {
    const complexType = element['xs:complexType'] || element.complexType;
    if (!complexType) return false;

    return !!(
      complexType['xs:sequence'] || complexType.sequence ||
      complexType['xs:choice'] || complexType.choice ||
      complexType['xs:all'] || complexType.all ||
      complexType['xs:attribute'] || complexType.attribute
    );
  }

  private hasRestrictions(element: any): boolean {
    const simpleType = element['xs:simpleType'] || element.simpleType;
    if (!simpleType) return false;

    return !!(simpleType['xs:restriction'] || simpleType.restriction);
  }

  private extractRestrictions(element: any): any {
    const simpleType = element['xs:simpleType'] || element.simpleType || element;
    const restriction = simpleType['xs:restriction'] || simpleType.restriction;

    if (!restriction) return {};

    const result: any = {
      base: restriction['@_base']
    };

    // Enumeration
    const enumerations = this.ensureArray(restriction['xs:enumeration'] || restriction.enumeration || []);
    if (enumerations.length > 0) {
      result.enumeration = enumerations.map((e: any) => e['@_value']);
    }

    // Pattern
    const pattern = restriction['xs:pattern'] || restriction.pattern;
    if (pattern) {
      result.pattern = pattern['@_value'];
    }

    // Length restrictions
    const minLength = restriction['xs:minLength'] || restriction.minLength;
    if (minLength) {
      result.minLength = parseInt(minLength['@_value']);
    }

    const maxLength = restriction['xs:maxLength'] || restriction.maxLength;
    if (maxLength) {
      result.maxLength = parseInt(maxLength['@_value']);
    }

    // Value restrictions
    const minInclusive = restriction['xs:minInclusive'] || restriction.minInclusive;
    if (minInclusive) {
      result.minInclusive = parseFloat(minInclusive['@_value']);
    }

    const maxInclusive = restriction['xs:maxInclusive'] || restriction.maxInclusive;
    if (maxInclusive) {
      result.maxInclusive = parseFloat(maxInclusive['@_value']);
    }

    return result;
  }

  private extractBaseType(complexType: any): string | undefined {
    const extension = complexType['xs:complexContent']?.['xs:extension'] ||
                    complexType.complexContent?.extension;

    if (extension) {
      return extension['@_base'];
    }

    const restriction = complexType['xs:complexContent']?.['xs:restriction'] ||
                      complexType.complexContent?.restriction;

    if (restriction) {
      return restriction['@_base'];
    }

    return undefined;
  }

  private ensureArray(value: any): any[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }
}
