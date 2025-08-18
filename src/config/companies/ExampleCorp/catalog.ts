import type { CompanyMapping } from '../../../types/company';

export const ExampleCorpCatalogMapping: CompanyMapping = {
  companyName: "ExampleCorp",
  description: "Configuración de mapeo para catálogo de productos de Example Corporation - Usando clases SFCC",
  version: "2.0.0",
  catalog: {
    catalogId: "examplecorp-catalog",
    defaultCurrency: "EUR",
    defaultLocale: "en_GB"
  },
  columnMappings: {
    "product-id": {
      xmlElement: "product",
      attribute: "product-id",
      required: true,
      dataType: "string",
      description: "Identificador único del producto"
    },
    "display-name": {
      xmlElement: "display-name",
      attribute: null,
      required: true,
      dataType: "string",
      locale: "en_GB",
      description: "Nombre visible del producto"
    },
    "short-description": {
      xmlElement: "short-description",
      attribute: null,
      required: false,
      dataType: "string",
      locale: "en_GB",
      description: "Descripción corta del producto"
    },
    "description": {
      xmlElement: "long-description",
      attribute: null,
      required: false,
      dataType: "string",
      locale: "en_GB",
      description: "Descripción del producto"
    },
    "brand": {
      xmlElement: "brand",
      attribute: null,
      required: false,
      dataType: "string",
      description: "Marca del producto"
    },
    "category": {
      xmlElement: "classification-category",
      attribute: "catalog-id",
      required: false,
      dataType: "string",
      catalogId: "examplecorp-catalog",
      description: "Categoría del producto"
    },
    "online": {
      xmlElement: "online-flag",
      attribute: null,
      required: false,
      dataType: "boolean",
      defaultValue: true,
      description: "Disponible online"
    },
    "searchable": {
      xmlElement: "searchable-flag",
      attribute: null,
      required: false,
      dataType: "boolean",
      defaultValue: true,
      description: "Búsqueda habilitada"
    }
  },
  headerMappings: {
    "Product Code": "product-id",
    "SKU": "product-id",
    "Title": "display-name",
    "Product Name": "display-name",
    "Short Description": "short-description",
    "Description": "description",
    "Product Description": "description",
    "Brand": "brand",
    "Manufacturer": "brand",
    "Category": "category",
    "Product Category": "category",
    "Active": "online",
    "Status": "online",
    "Online": "online",
    "Searchable": "searchable",
    "Search Enabled": "searchable"
  },
  transformations: {
    boolean: {
      true: ["true", "yes", "y", "1", "active", "enabled", "on"],
      false: ["false", "no", "n", "0", "inactive", "disabled", "off"]
    },
    currency: {
      removeSymbols: ["€", "$", "£", ",", " "],
      decimalPlaces: 2
    }
  }
};
