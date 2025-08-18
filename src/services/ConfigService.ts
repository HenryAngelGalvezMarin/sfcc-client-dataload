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
}

class ConfigService {
  private static instance: ConfigService;
  private loadedConfigs: Map<string, CompanyMapping> = new Map();

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  async getAvailableCompanies(): Promise<CompanyInfo[]> {
    // En una implementación real, esto podría ser dinámico
    // Por ahora, retornamos las empresas configuradas
    return [
      {
        name: 'Typhoon',
        displayName: 'Typhoon',
        description: 'Configuración de mapeo para productos de Typhoon'
      },
      {
        name: 'ExampleCorp',
        displayName: 'Example Corporation',
        description: 'Configuración de mapeo para productos de Example Corporation'
      }
      // Aquí se pueden agregar más empresas
    ];
  }

  async loadCompanyMapping(companyName: string): Promise<CompanyMapping> {
    if (this.loadedConfigs.has(companyName)) {
      return this.loadedConfigs.get(companyName)!;
    }

    try {
      // Importar el archivo de configuración dinámicamente
      const configModule = await import(`../config/companies/${companyName}/mapping.json`);
      const mapping: CompanyMapping = configModule.default || configModule;

      this.loadedConfigs.set(companyName, mapping);
      return mapping;
    } catch (error) {
      console.error(`Error loading mapping for company ${companyName}:`, error);
      throw new Error(`No se pudo cargar la configuración para la empresa ${companyName}`);
    }
  }

  getColumnMapping(companyMapping: CompanyMapping, headerName: string): string | null {
    // Buscar mapeo directo
    if (companyMapping.headerMappings[headerName]) {
      return companyMapping.headerMappings[headerName];
    }

    // Buscar mapeo case-insensitive
    const lowerHeader = headerName.toLowerCase().trim();
    for (const [key, value] of Object.entries(companyMapping.headerMappings)) {
      if (key.toLowerCase().trim() === lowerHeader) {
        return value;
      }
    }

    // Buscar mapeo parcial
    for (const [key, value] of Object.entries(companyMapping.headerMappings)) {
      if (lowerHeader.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerHeader)) {
        return value;
      }
    }

    return null;
  }

  getMappingInfo(companyMapping: CompanyMapping, mappingKey: string) {
    return companyMapping.columnMappings[mappingKey];
  }

  transformValue(companyMapping: CompanyMapping, value: unknown, dataType: string): unknown {
    if (value === null || value === undefined || value === '') {
      return value;
    }

    switch (dataType) {
      case 'boolean': {
        const strValue = String(value).toLowerCase().trim();
        if (companyMapping.transformations.boolean.true.includes(strValue)) {
          return true;
        }
        if (companyMapping.transformations.boolean.false.includes(strValue)) {
          return false;
        }
        return Boolean(value);
      }

      case 'number': {
        if (typeof value === 'number') return value;
        let numStr = String(value);

        // Remover símbolos de moneda si es necesario
        for (const symbol of companyMapping.transformations.currency.removeSymbols) {
          numStr = numStr.replace(new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
        }

        const num = parseFloat(numStr.trim());
        return isNaN(num) ? 0 : num;
      }

      case 'date':
        return new Date(value as string).toISOString().split('T')[0];

      default:
        return String(value).trim();
    }
  }
}

export default ConfigService;
