// Configuraciones de empresa disponibles
import { TyphoonConfig } from './companies/Typhoon';
import { ExampleCorpConfig } from './companies/ExampleCorp';
import type { CompanyConfig, CompanyMapping } from '../types/company';

// Registro de todas las empresas configuradas
export const COMPANY_CONFIGS: Record<string, CompanyConfig> = {
  'Typhoon': TyphoonConfig,
  'ExampleCorp': ExampleCorpConfig,
};

// Lista de empresas disponibles para el selector
export const AVAILABLE_COMPANIES = Object.values(COMPANY_CONFIGS).map(config => config.info);

// Helper para obtener mapeos específicos por esquema
export const getCompanyMapping = (companyName: string, schema: 'catalog' | 'pricebook' = 'catalog'): CompanyMapping | null => {
  const config = COMPANY_CONFIGS[companyName];
  if (!config) return null;

  return config.mappings[schema] || null;
};
