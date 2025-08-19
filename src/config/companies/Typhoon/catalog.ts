import type { CompanyMapping } from '../../../types/company';

export const TyphoonCatalogMapping: CompanyMapping = {
  companyName: "Typhoon",
  description: "Configuración de mapeo para catálogo de productos de Typhoon",
  version: "1.0.0",
  catalog: {
    catalogId: "typhoon-master-catalog",
    imageSettings: {
      internalLocation: {
        basePath: "/images"
      },
      viewTypes: ["large", "medium", "small", "swatch", "hi-res"],
      variationAttributeId: "color",
      altPattern: "${productname}, ${variationvalue}, ${viewtype}",
      titlePattern: "${productname}, ${variationvalue}"
    }
  },
  columnMappings: {
    "product-id": {
      xmlElement: "product",
      attribute: "product-id",
      required: true,
      dataType: "string",
      description: "Identificador único del producto",
      objectAttribute: "productId"
    },
    "min-order-quantity": {
      xmlElement: "min-order-quantity",
      attribute: null,
      required: false,
      dataType: "number",
      defaultValue: 1,
      description: "Cantidad mínima de pedido del producto",
      objectAttribute: "minOrderQuantity"
    },
    "step-quantity": {
      xmlElement: "step-quantity",
      attribute: null,
      required: false,
      dataType: "number",
      defaultValue: 1,
      description: "Cantidad de paso del producto",
      objectAttribute: "stepQuantity"
    },
    "display-name": {
      xmlElement: "display-name",
      attribute: null,
      required: true,
      dataType: "string",
      locale: "x-default",
      description: "Nombre visible del producto",
      objectAttribute: "displayName"
    },
    "short-description": {
      xmlElement: "short-description",
      attribute: null,
      required: false,
      dataType: "string",
      locale: "x-default",
      description: "Descripción corta del producto",
      objectAttribute: "shortDescription"
    },
    "long-description": {
      xmlElement: "long-description",
      attribute: null,
      required: false,
      dataType: "string",
      locale: "x-default",
      description: "Descripción larga del producto",
      objectAttribute: "longDescription"
    },
    "online-flag": {
      xmlElement: "online-flag",
      attribute: null,
      required: false,
      dataType: "boolean",
      description: "Indica si el producto está disponible online",
      objectAttribute: "onlineFlag"
    },
    "online-from": {
      xmlElement: "online-from",
      attribute: null,
      required: false,
      dataType: "string",
      description: "Fecha desde la cual el producto está disponible online",
      objectAttribute: "onlineFrom"
    },
    "available-flag": {
      xmlElement: "available-flag",
      attribute: null,
      required: false,
      dataType: "boolean",
      description: "Indica si el producto está disponible",
      objectAttribute: "availableFlag"
    },
    "searchable-flag": {
      xmlElement: "searchable-flag",
      attribute: null,
      required: false,
      dataType: "boolean",
      description: "Indica si el producto es buscable",
      objectAttribute: "searchableFlag"
    },
    "images": {
      xmlElement: "images",
      attribute: null,
      required: false,
      dataType: "string",
      description: "Imágenes del producto, puede ser una URL o un grupo de imágenes",
      objectAttribute: "images"
    },
    "tax-class-id": {
      xmlElement: "tax-class-id",
      attribute: null,
      required: false,
      dataType: "string",
      defaultValue: "standard",
      description: "Clase de impuesto del producto",
      objectAttribute: "taxClassId"
    },
    "brand": {
      xmlElement: "brand",
      attribute: null,
      required: false,
      dataType: "string",
      description: "Marca del producto",
      objectAttribute: "brand"
    },
    "manufacturer-sku": {
      xmlElement: "manufacturer-sku",
      attribute: null,
      required: false,
      dataType: "string",
      description: "SKU del fabricante del producto",
      objectAttribute: "manufacturerSku"
    },
    "sitemap-included-flag": {
      xmlElement: "sitemap-included-flag",
      attribute: null,
      required: false,
      dataType: "boolean",
      defaultValue: true,
      description: "Indica si el producto está incluido en el sitemap",
      objectAttribute: "sitemapIncludedFlag"
    },
    "sitemap-changefrequency": {
      xmlElement: "sitemap-changefrequency",
      attribute: null,
      required: false,
      defaultValue: "daily",
      dataType: "string",
      description: "Frecuencia de cambio del producto en el sitemap",
      objectAttribute: "sitemapChangefrequency"
    },
    "sitemap-priority": {
      xmlElement: "sitemap-priority",
      attribute: null,
      required: false,
      defaultValue: 1.0,
      dataType: "number",
      description: "Prioridad del producto en el sitemap",
      objectAttribute: "sitemapPriority"
    },
    "page-title": {
      xmlElement: "page-title",
      attribute: null,
      required: false,
      dataType: "string",
      description: "Título de la página del producto",
      objectAttribute: "pageAttributes.pageTitle"
    },
    "page-description": {
      xmlElement: "page-description",
      attribute: null,
      required: false,
      dataType: "string",
      description: "Descripción de la página del producto",
      objectAttribute: "pageAttributes.pageDescription"
    },
    "page-keywords": {
      xmlElement: "page-keywords",
      attribute: null,
      required: false,
      dataType: "string",
      description: "Palabras clave de la página del producto",
      objectAttribute: "pageAttributes.pageKeywords",
      multipleHeader: true
    },
    "priority": {
      xmlElement: "custom-attribute",
      attribute: "attribute-id",
      required: false,
      dataType: "number",
      description: "Prioridad del producto",
      objectAttribute: "customAttributes"
    },
    "gender": {
      xmlElement: "custom-attribute",
      attribute: "attribute-id",
      required: false,
      dataType: "string",
      description: "Género del producto",
      objectAttribute: "customAttributes"
    },
    "sport": {
      xmlElement: "custom-attribute",
      attribute: "attribute-id",
      required: false,
      dataType: "string",
      description: "Deporte del producto",
      objectAttribute: "customAttributes"
    },
    "productType": {
      xmlElement: "custom-attribute",
      attribute: "attribute-id",
      required: false,
      dataType: "string",
      description: "Tipo de producto",
      objectAttribute: "customAttributes"
    },
    "silo": {
      xmlElement: "custom-attribute",
      attribute: "attribute-id",
      required: false,
      dataType: "string",
      description: "Silo del producto",
      objectAttribute: "customAttributes"
    },
    "silhouette": {
      xmlElement: "custom-attribute",
      attribute: "attribute-id",
      required: false,
      dataType: "string",
      description: "Silhouette del producto",
      objectAttribute: "customAttributes"
    },
    "ribbonDiscount": {
      xmlElement: "custom-attribute",
      attribute: "attribute-id",
      required: false,
      dataType: "string",
      description: "Etiqueta de descuento del producto",
      objectAttribute: "customAttributes"
    },
    "variation-attribute": {
      xmlElement: "variation-attribute",
      attribute: "attribute-id",
      defaultValue: "Color",
      required: false,
      dataType: "string",
      description: "Atributo de variación del producto",
      objectAttribute: "variations"
    },
    "pinterest-enabled-flag": {
      xmlElement: "pinterest-enabled-flag",
      attribute: null,
      required: false,
      dataType: "boolean",
      defaultValue: false,
      description: "Indica si el producto está habilitado para Pinterest",
      objectAttribute: "pinterestEnabledFlag"
    },
    "facebook-enabled-flag": {
      xmlElement: "facebook-enabled-flag",
      attribute: null,
      required: false,
      dataType: "boolean",
      defaultValue: false,
      description: "Indica si el producto está habilitado para Facebook",
      objectAttribute: "facebookEnabledFlag"
    },
    "force-price-flag": {
      xmlElement: "force-price-flag",
      attribute: null,
      required: false,
      dataType: "boolean",
      defaultValue: false,
      description: "Indica si se debe forzar el precio del producto",
      objectAttribute: "storeAttributes.forcePriceFlag"
    },
    "non-inventory-flag": {
      xmlElement: "non-inventory-flag",
      attribute: null,
      required: false,
      dataType: "boolean",
      defaultValue: false,
      description: "Indica si el producto no es inventariable",
      objectAttribute: "storeAttributes.nonInventoryFlag"
    },
    "non-revenue-flag": {
      xmlElement: "non-revenue-flag",
      attribute: null,
      required: false,
      dataType: "boolean",
      defaultValue: false,
      description: "Indica si el producto no genera ingresos",
      objectAttribute: "storeAttributes.nonRevenueFlag"
    },
    "non-discountable-flag": {
      xmlElement: "non-discountable-flag",
      attribute: null,
      required: false,
      dataType: "boolean",
      defaultValue: false,
      description: "Indica si el producto no es descontable",
      objectAttribute: "storeAttributes.nonDiscountableFlag"
    }
  },
  headerMappings: {
    "product-id": "SKU_ABUELO",
    "display-name": "NOMBRE_PROD",
    "short-description": "DESCRIPCION_CORTA",
    "long-description": "DESCRIPCION",
    "online-flag": "ACTIVO",
    "manufacturer-sku": "SKU_ABUELO",
    "page-title": "NOMBRE_PROD",
    "page-description": "DESCRIPCION",
    "page-keywords": "MARCA,DEPORTE,GENERO,TIPO",
    "priority": "PRIORIDAD",
    "gender": "GENERO",
    "sport": "DEPORTE",
    "productType": "TIPO",
    "silo": "SILO",
    "silhouette": "SILUETA",
    "ribbonDiscount": "PRECIO_ESPECIAL_ETIQUETA",
    "brand": "MARCA",
    "searchable-flag": "ACTIVO",
    "available-flag": "ACTIVO",
    "online-from": "ACTIVO_DESDE",
    "sitemap-changefrequency": "SITEMAP_FRECUENCIA",
    "sitemap-priority": "SITEMAP_PRIORIDAD",
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
