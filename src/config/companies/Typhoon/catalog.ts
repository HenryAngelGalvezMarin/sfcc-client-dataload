import type { CompanyMapping } from '../../../types/company';

export const TyphoonCatalogMapping: CompanyMapping = {
  companyName: "Typhoon",
  description: "Configuración de mapeo para catálogo de productos de Typhoon",
  version: "1.0.0",
  catalog: {
    catalogId: "typhoon-master-catalog",
    defaultCurrency: "USD",
    defaultLocale: "en_US"
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
      locale: "en_US",
      description: "Nombre visible del producto"
    },
    "short-description": {
      xmlElement: "short-description",
      attribute: null,
      required: false,
      dataType: "string",
      locale: "en_US",
      description: "Descripción corta del producto"
    },
    "long-description": {
      xmlElement: "long-description",
      attribute: null,
      required: false,
      dataType: "string",
      locale: "en_US",
      description: "Descripción larga del producto"
    },
    "brand": {
      xmlElement: "brand",
      attribute: null,
      required: false,
      dataType: "string",
      description: "Marca del producto"
    },
    "online-flag": {
      xmlElement: "online-flag",
      attribute: null,
      required: false,
      dataType: "boolean",
      defaultValue: true,
      description: "Indica si el producto está disponible online"
    },
    "available-flag": {
      xmlElement: "available-flag",
      attribute: null,
      required: false,
      dataType: "boolean",
      defaultValue: true,
      description: "Indica si el producto está disponible"
    },
    "searchable-flag": {
      xmlElement: "searchable-flag",
      attribute: null,
      required: false,
      dataType: "boolean",
      defaultValue: true,
      description: "Indica si el producto es buscable"
    },
    "tax-class-id": {
      xmlElement: "tax-class-id",
      attribute: null,
      required: false,
      dataType: "string",
      defaultValue: "standard",
      description: "Clase de impuesto del producto"
    },
    "price": {
      xmlElement: "price-table",
      subElement: "amount",
      attribute: null,
      required: false,
      dataType: "number",
      currency: "USD",
      description: "Precio del producto"
    },
    "category": {
      xmlElement: "classification-category",
      attribute: "catalog-id",
      required: false,
      dataType: "string",
      catalogId: "typhoon-master-catalog",
      description: "Categoría del producto"
    }
  },
  headerMappings: {
    // Mapeos exactos (nombre de columna = nombre interno)
    "product-id": "product-id",
    "display-name": "display-name",
    "short-description": "short-description",
    "long-description": "long-description",
    "brand": "brand",
    "price": "price",
    "category": "category",
    "online-flag": "online-flag",
    "available-flag": "available-flag",
    "searchable-flag": "searchable-flag",
    "tax-class-id": "tax-class-id",

    // Mapeos alternativos (nombres más humanos)
    "Product ID": "product-id",
    "Product Name": "display-name",
    "Name": "display-name",
    "Short Description": "short-description",
    "Description": "short-description",
    "Long Description": "long-description",
    "Brand": "brand",
    "Price": "price",
    "Cost": "price",
    "Category": "category",
    "Categories": "category",
    "Online": "online-flag",
    "Available": "available-flag",
    "Searchable": "searchable-flag",
    "Tax Class": "tax-class-id"
  },
  transformations: {
    boolean: {
      true: ["true", "yes", "y", "1", "on", "enabled"],
      false: ["false", "no", "n", "0", "off", "disabled"]
    },
    currency: {
      removeSymbols: ["$", "€", "£", ","],
      decimalPlaces: 2
    }
  }
};
