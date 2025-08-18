export interface CompanyMapping {
  companyName: string;
  description: string;
  version: string;
  catalog: {
    catalogId: string;
    defaultCurrency: string;
    defaultLocale: string;
  };
  columnMappings: Record<string, {
    xmlElement: string;
    subElement?: string;
    attribute: string | null;
    required: boolean;
    dataType: 'string' | 'number' | 'boolean' | 'date';
    locale?: string;
    currency?: string;
    catalogId?: string;
    defaultValue?: string | number | boolean;
    description: string;
  }>;
  headerMappings: Record<string, string>;
  transformations: {
    boolean: {
      true: string[];
      false: string[];
    };
    currency: {
      removeSymbols: string[];
      decimalPlaces: number;
    };
  };
}

export interface CompanyInfo {
  name: string;
  displayName: string;
  description: string;
  schema: string; // catalog, pricebook, etc.
}

export interface CompanyConfig {
  info: CompanyInfo;
  mappings: {
    catalog?: CompanyMapping;
    pricebook?: CompanyMapping;
    // Se pueden agregar más esquemas en el futuro
  };
}
