import type { CompanyConfig } from '../../../types/company';
import { ExampleCorpCatalogMapping } from './catalog';

export const ExampleCorpConfig: CompanyConfig = {
  info: {
    name: 'ExampleCorp',
    displayName: 'Example Corporation',
    description: 'Configuración de mapeo para productos de Example Corporation',
    schema: 'catalog'
  },
  mappings: {
    catalog: ExampleCorpCatalogMapping
  }
};
