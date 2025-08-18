import type { CompanyMapping } from '../../../types/company';

export const ExampleCorpCatalogMapping: CompanyMapping = {
  companyName: "ExampleCorp",
  description: "Configuración de mapeo para catálogo de productos de Example Corporation",
  version: "1.0.0",
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
    "price": {
      xmlElement: "price-table",
      subElement: "amount",
      attribute: null,
      required: false,
      dataType: "number",
      currency: "EUR",
      description: "Precio del producto en euros"
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
    }
  },
  headerMappings: {
    "Product Code": "product-id",
    "SKU": "product-id",
    "Title": "display-name",
    "Product Name": "display-name",
    "Description": "description",
    "Product Description": "description",
    "Brand": "brand",
    "Manufacturer": "brand",
    "Price": "price",
    "Cost Price": "price",
    "Category": "category",
    "Product Category": "category",
    "Active": "online",
    "Status": "online",
    "Online": "online"
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
