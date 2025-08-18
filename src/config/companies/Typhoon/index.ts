import type { CompanyConfig } from '../../../types/company';
import { TyphoonCatalogMapping } from './catalog';

export const TyphoonConfig: CompanyConfig = {
  info: {
    name: 'Typhoon',
    displayName: 'Typhoon',
    description: 'Configuración de mapeo para productos de Typhoon',
    schema: 'catalog'
  },
  mappings: {
    catalog: TyphoonCatalogMapping
  }
};
