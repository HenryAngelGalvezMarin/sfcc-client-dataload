export interface CompanyMapping {
  companyName?: string;
  description?: string;
  version?: string;
  sites?: {
    [siteId: string]: {
      siteId: string;
      defaultCurrency?: string;
      defaultLocale?: string;
      catalogId?: string;
      prefix?: string;
      suffix?: string;
    };
  };
  catalog: {
    catalogId?: string;
    defaultCurrency?: string;
    defaultLocale?: string;
    imageSettings?: {
      internalLocation: {
        basePath: string;
      };
      viewTypes: string[];
      variationAttributeId: string;
      altPattern: string;
      titlePattern: string;
    };
  };
  variationSettings?: {
    enabled: boolean;
    masterIdentifier: string;
    parentIdentifier?: string;
    variantIdentifier: string;
    variationAttributes: {
      [attributeId: string]: {
        csvColumn: string;
        displayName: string;
        sortOrder?: number;
      };
    };
    grouping: {
      strategy: 'by-master' | 'by-parent';
      masterFields: string[];
      variantFields: string[];
    };
    imageSettings?: {
      variationImagePattern?: string;
      groupImagesByAttribute?: string;
    };
  };
  headerMappings: Record<string, string>;
  columnMappings: Record<
    string,
    {
      xmlElement: string;
      subElement?: string;
      attribute: string | null;
      required: boolean;
      dataType: "string" | "number" | "boolean" | "date";
      locale?: string;
      currency?: string;
      catalogId?: string;
      defaultValue?: string | number | boolean;
      description: string;
      objectAttribute?: string;
      multipleHeader?: boolean;
    }
  >;
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
