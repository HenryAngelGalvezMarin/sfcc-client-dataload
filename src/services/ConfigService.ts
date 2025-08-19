import { AVAILABLE_COMPANIES, getCompanyMapping } from "../config/companies";
import type { CompanyMapping, CompanyInfo } from "../types/company";

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
    return AVAILABLE_COMPANIES;
  }

  async loadCompanyMapping(
    companyName: string,
    schema: "catalog"
  ): Promise<CompanyMapping> {
    const cacheKey = `${companyName}-${schema}`;

    if (this.loadedConfigs.has(cacheKey)) {
      return this.loadedConfigs.get(cacheKey)!;
    }

    try {
      const mapping = getCompanyMapping(companyName, schema);

      if (!mapping) {
        throw new Error(
          `Configuración no encontrada para la empresa ${companyName} con esquema ${schema}`
        );
      }

      this.loadedConfigs.set(cacheKey, mapping);
      return mapping;
    } catch (error) {
      console.error(`Error loading mapping for company ${companyName}:`, error);
      throw new Error(
        `No se pudo cargar la configuración para la empresa ${companyName}`
      );
    }
  }
  getColumnMapping(
    companyMapping: CompanyMapping,
    headerName: string
  ): string | null {
    for (const [key, value] of Object.entries(companyMapping.headerMappings)) {
      if (value === headerName) {
        return key;
      }
    }

    return null;
  }

  getMappingInfo(companyMapping: CompanyMapping, mappingKey: string) {
    return companyMapping.columnMappings[mappingKey];
  }

  transformValue(
    companyMapping: CompanyMapping,
    value: unknown,
    dataType: string
  ): unknown {
    if (value === null || value === undefined || value === "") {
      return value;
    }

    switch (dataType) {
      case "boolean": {
        const strValue = String(value).toLowerCase().trim();
        if (companyMapping.transformations.boolean.true.includes(strValue)) {
          return true;
        }
        if (companyMapping.transformations.boolean.false.includes(strValue)) {
          return false;
        }
        return Boolean(value);
      }

      case "number": {
        if (typeof value === "number") return value;
        let numStr = String(value);

        // Remover símbolos de moneda si es necesario
        for (const symbol of companyMapping.transformations.currency
          .removeSymbols) {
          numStr = numStr.replace(
            new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
            ""
          );
        }

        const num = parseFloat(numStr.trim());
        return isNaN(num) ? 0 : num;
      }

      case "date":
        return new Date(value as string).toISOString().split("T")[0];

      default:
        return String(value).trim();
    }
  }
}

export default ConfigService;
