// Configuraciones de empresa disponibles
import TyphoonMapping from './companies/Typhoon/mapping.json';
import ExampleCorpMapping from './companies/ExampleCorp/mapping.json';
import type { CompanyMapping } from '../services/ConfigService';

export const COMPANY_MAPPINGS: Record<string, CompanyMapping> = {
  'Typhoon': TyphoonMapping as CompanyMapping,
  'ExampleCorp': ExampleCorpMapping as CompanyMapping,
};

export const AVAILABLE_COMPANIES = [
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
];
