import type {
  LocalizedString,
  CustomAttribute,
  ClassificationCategory,
  ValidationResult,
  XMLGenerationOptions,
  OnlineFlag,
  SearchableFlag,
  AvailableFlag,
  Images,
  PageAttributes,
  StoreAttributes,
} from "./base/types";
import {
  OnlineFlag as OnlineFlagValues,
  SearchableFlag as SearchableFlagValues,
  AvailableFlag as AvailableFlagValues,
} from "./base/types";

export interface SFCCProduct {
  productId: string;
  ean?: string;
  upc?: string;
  unit?: string;
  minOrderQuantity?: number;
  stepQuantity?: number;
  displayName?: LocalizedString;
  shortDescription?: LocalizedString;
  longDescription?: LocalizedString;
  onlineFlag?: OnlineFlag;
  onlineFrom?: string;
  availableFlag?: AvailableFlag;
  searchableFlag?: SearchableFlag;
  images?: Images;
  taxClassId?: string;
  brand?: string;
  manufacturerSku?: string;
  sitemapIncludedFlag?: boolean;
  sitemapChangefrequency?: string;
  sitemapPriority?: number;
  pageAttributes?: PageAttributes;
  customAttributes?: CustomAttribute[];
  pinterestEnabledFlag?: boolean;
  facebookEnabledFlag?: boolean;
  storeAttributes?: StoreAttributes;
  variations?: SFCCProduct[]; // To do
  classificationCategory?: ClassificationCategory;
}

export class Product implements SFCCProduct {
  public productId: string;
  public ean?: string;
  public upc?: string;
  public unit?: string;
  public minOrderQuantity?: number;
  public stepQuantity?: number;
  public displayName?: LocalizedString;
  public shortDescription?: LocalizedString;
  public longDescription?: LocalizedString;
  public onlineFlag?: OnlineFlag;
  public onlineFrom?: string;
  public availableFlag?: AvailableFlag;
  public brand?: string;
  public searchableFlag?: SearchableFlag;
  public taxClassId?: string;
  public classificationCategory?: ClassificationCategory;
  public customAttributes?: CustomAttribute[];
  public images?: Images;
  public sitemapIncludedFlag?: boolean;
  public sitemapChangefrequency?: string;
  public sitemapPriority?: number;
  public pageAttributes?: PageAttributes;
  public pinterestEnabledFlag?: boolean;
  public facebookEnabledFlag?: boolean;
  public storeAttributes?: StoreAttributes;
  public manufacturerSku?: string;
  public variations?: Product[];

  constructor(data: Partial<SFCCProduct> & { productId: string }) {
    this.productId = data.productId;
    this.displayName = data.displayName;
    this.shortDescription = data.shortDescription;
    this.longDescription = data.longDescription;
    this.brand = data.brand;
    this.onlineFlag = data.onlineFlag || OnlineFlagValues.TRUE;
    this.availableFlag = data.availableFlag || AvailableFlagValues.TRUE;
    this.searchableFlag = data.searchableFlag || SearchableFlagValues.TRUE;
    this.taxClassId = data.taxClassId;
    this.classificationCategory = data.classificationCategory;
    this.customAttributes = data.customAttributes || [];
    this.ean = data.ean;
    this.upc = data.upc;
    this.unit = data.unit;
    this.minOrderQuantity = data.minOrderQuantity;
    this.stepQuantity = data.stepQuantity;
    this.onlineFrom = data.onlineFrom;
    // Asignar images (soporta singular o array). XSD espera element <images> con <image-group>/<image path="...">
    this.images = data.images;
    this.sitemapIncludedFlag = data.sitemapIncludedFlag;
    this.sitemapChangefrequency = data.sitemapChangefrequency;
    this.sitemapPriority = data.sitemapPriority;
    this.pageAttributes = data.pageAttributes;
    this.pinterestEnabledFlag = data.pinterestEnabledFlag;
    this.facebookEnabledFlag = data.facebookEnabledFlag;
    this.storeAttributes = data.storeAttributes;
    this.manufacturerSku = data.manufacturerSku;
    // TODO: Support multiple image formats
    // // Convert variations of raw shape into Product instances if present
    // if (data.variations && Array.isArray(data.variations)) {
    //   this.variations = (data.variations as SFCCProduct[]).map(
    //     (v) => new Product({ productId: v.productId, ...v })
    //   );
    // }
  }

  /**
   * Valida el producto contra el schema SFCC
   */
  validate(): ValidationResult {
    const errors: ValidationResult["errors"] = [];

    // Validaciones requeridas
    if (!this.productId || this.productId.trim() === "") {
      errors.push({
        field: "productId",
        message: "Product ID es requerido",
        code: "REQUIRED_FIELD",
      });
    }

    // Validar longitud de productId (máximo 100 caracteres según SFCC)
    if (this.productId && this.productId.length > 100) {
      errors.push({
        field: "productId",
        message: "Product ID no puede exceder 100 caracteres",
        code: "MAX_LENGTH_EXCEEDED",
      });
    }

    // Validar caracteres válidos en productId
    if (this.productId && !/^[a-zA-Z0-9_-]+$/.test(this.productId)) {
      errors.push({
        field: "productId",
        message:
          "Product ID solo puede contener letras, números, guiones y guiones bajos",
        code: "INVALID_CHARACTERS",
      });
    }

    // Validate EAN (simple numeric + length check 8..14)
    if (this.ean) {
      const eanDigits = String(this.ean).replace(/\s+/g, "");
      if (
        !/^\d+$/.test(eanDigits) ||
        eanDigits.length < 8 ||
        eanDigits.length > 14
      ) {
        errors.push({
          field: "ean",
          message: "EAN debe contener solo dígitos y longitud entre 8 y 14",
          code: "INVALID_EAN",
        });
      }
    }
    // Validate UPC (simple numeric + length 12)
    if (this.upc) {
      const upcDigits = String(this.upc).replace(/\s+/g, "");
      if (!/^\d+$/.test(upcDigits) || upcDigits.length !== 12) {
        errors.push({
          field: "upc",
          message: "UPC debe contener solo dígitos y tener longitud 12",
          code: "INVALID_UPC",
        });
      }
    }
    // Quantities
    if (
      this.minOrderQuantity != null &&
      (!Number.isFinite(this.minOrderQuantity) || this.minOrderQuantity < 0)
    ) {
      errors.push({
        field: "minOrderQuantity",
        message: "minOrderQuantity debe ser un número >= 0",
        code: "INVALID_MIN_ORDER_QUANTITY",
      });
    }
    if (
      this.stepQuantity != null &&
      (!Number.isFinite(this.stepQuantity) || this.stepQuantity <= 0)
    ) {
      errors.push({
        field: "stepQuantity",
        message: "stepQuantity debe ser un número > 0",
        code: "INVALID_STEP_QUANTITY",
      });
    }
    // sitemapPriority range 0..1
    if (
      this.sitemapPriority != null &&
      (typeof this.sitemapPriority !== "number" ||
        this.sitemapPriority < 0 ||
        this.sitemapPriority > 1)
    ) {
      errors.push({
        field: "sitemapPriority",
        message: "sitemapPriority debe estar entre 0.0 y 1.0",
        code: "INVALID_SITEMAP_PRIORITY",
      });
    }
    // onlineFrom debe ser fecha válida si se provee
    if (this.onlineFrom) {
      const ts = Date.parse(this.onlineFrom);
      if (Number.isNaN(ts)) {
        errors.push({
          field: "onlineFrom",
          message: "onlineFrom debe ser una fecha válida (ISO)",
          code: "INVALID_DATE",
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Genera XML válido para SFCC catalog
   */
  toXML(options: XMLGenerationOptions = {}): string {
    const { indent = "  ", includeXMLDeclaration = false } = options;
    let xml = "";

    if (includeXMLDeclaration) {
      xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
    }

    xml += `<product product-id="${this.escapeXML(this.productId)}">`;

    // Display name
    if (this.displayName) {
      xml += `\n${indent}<display-name`;
      if (this.displayName.locale) {
        xml += ` xml:lang="${this.displayName.locale}"`;
      }
      xml += `>${this.escapeXML(this.displayName.value)}</display-name>`;
    }

    // Short description
    if (this.shortDescription) {
      xml += `\n${indent}<short-description`;
      if (this.shortDescription.locale) {
        xml += ` xml:lang="${this.shortDescription.locale}"`;
      }
      xml += `>${this.escapeXML(
        this.shortDescription.value
      )}</short-description>`;
    }

    // Long description
    if (this.longDescription && this.longDescription.value) {
      xml += `\n${indent}<long-description`;
      if (this.longDescription.locale) {
        xml += ` xml:lang="${this.longDescription.locale}"`;
      }
      xml += `>${this.escapeXML(this.longDescription.value)}</long-description>`;
    }

    // Brand
    if (this.brand) {
      xml += `\n${indent}<brand>${this.escapeXML(this.brand)}</brand>`;
    }

    // Flags
    if (this.onlineFlag) {
      xml += `\n${indent}<online-flag>${this.onlineFlag}</online-flag>`;
    }

    if (this.availableFlag) {
      xml += `\n${indent}<available-flag>${this.availableFlag}</available-flag>`;
    }

    if (this.searchableFlag) {
      xml += `\n${indent}<searchable-flag>${this.searchableFlag}</searchable-flag>`;
    }

    // Tax class
    if (this.taxClassId) {
      xml += `\n${indent}<tax-class-id>${this.escapeXML(
        this.taxClassId
      )}</tax-class-id>`;
    }

    // Classification category
    if (this.classificationCategory) {
      xml += `\n${indent}<classification-category`;
      if (this.classificationCategory.catalogId) {
        xml += ` catalog-id="${this.escapeXML(
          this.classificationCategory.catalogId
        )}"`;
      }
      xml += `>${this.escapeXML(
        this.classificationCategory.categoryId
      )}</classification-category>`;
    }

    // Custom attributes
    if (this.customAttributes && this.customAttributes.length > 0) {
      xml += `\n${indent}<custom-attributes>`;
      this.customAttributes.forEach((attr) => {
        if (attr.attributeId && attr.value) {
          xml += `\n${indent}${indent}<custom-attribute attribute-id="${this.escapeXML(
            attr.attributeId
          )}">`;
          xml += `${this.escapeXML(String(attr.value))}`;
          xml += `</custom-attribute>`;
        }
      });
      xml += `\n${indent}</custom-attributes>`;
    }

    // EAN/UPC/unit
    if (this.ean) {
      xml += `\n${indent}<ean>${this.escapeXML(this.ean)}</ean>`;
    }

    if (this.upc) {
      xml += `\n${indent}<upc>${this.escapeXML(this.upc)}</upc>`;
    }

    if (this.unit) {
      xml += `\n${indent}<unit>${this.escapeXML(this.unit)}</unit>`;
    }

    // Order quantities
    if (this.minOrderQuantity != null) {
      xml += `\n${indent}<min-order-quantity>${this.escapeXML(
        String(this.minOrderQuantity)
      )}</min-order-quantity>`;
    }
    if (this.stepQuantity != null) {
      xml += `\n${indent}<step-quantity>${this.escapeXML(
        String(this.stepQuantity)
      )}</step-quantity>`;
    }

    // onlineFrom
    if (this.onlineFrom) {
      xml += `\n${indent}<online-from>${this.escapeXML(
        this.onlineFrom
      )}</online-from>`;
    }

    // Images: build <images><image-group view-type="default"> ... <image path="..."> with alt/title
    if (this.images) {
      // const imgs = Array.isArray(this.images) ? this.images : [this.images];
      // if (imgs.length > 0) {
      //   xml += `\n${indent}<images>`;
      //   // Simple strategy: create a single image-group (view-type default) and emit images with path attr
      //   xml += `\n${indent}${indent}<image-group view-type="default">`;
      //   imgs.forEach((img) => {
      //     const anyImg = img as any;
      //     const path = anyImg.path || anyImg.src || anyImg.url || anyImg.image || anyImg.pathName || "";
      //     if (!path) return;
      //     xml += `\n${indent}${indent}${indent}<image path="${this.escapeXML(String(path))}">`;
      //     // alt/title are LocalizedText/LocalizedString shapes sometimes; try to serialize plain string or objects
      //     if (anyImg.alt) {
      //       if (typeof anyImg.alt === "object" && "value" in anyImg.alt) {
      //         xml += `\n${indent}${indent}${indent}${indent}<alt xml:lang="${this.escapeXML((anyImg.alt as any).locale || "x-default")}">${this.escapeXML(String((anyImg.alt as any).value))}</alt>`;
      //       } else {
      //         xml += `\n${indent}${indent}${indent}${indent}<alt>${this.escapeXML(String(anyImg.alt))}</alt>`;
      //       }
      //     }
      //     if (anyImg.title) {
      //       if (typeof anyImg.title === "object" && "value" in anyImg.title) {
      //         xml += `\n${indent}${indent}${indent}${indent}<title xml:lang="${this.escapeXML((anyImg.title as any).locale || "x-default")}">${this.escapeXML(String((anyImg.title as any).value))}</title>`;
      //       } else {
      //         xml += `\n${indent}${indent}${indent}${indent}<title>${this.escapeXML(String(anyImg.title))}</title>`;
      //       }
      //     }
      //     xml += `\n${indent}${indent}${indent}</image>`;
      //   });
      //   xml += `\n${indent}${indent}</image-group>`;
      //   xml += `\n${indent}</images>`;
      // }
    }

    // Sitemap fields
    if (this.sitemapIncludedFlag != null) {
      xml += `\n${indent}<sitemap-included-flag>${this.sitemapIncludedFlag}</sitemap-included-flag>`;
    }
    if (this.sitemapChangefrequency) {
      xml += `\n${indent}<sitemap-changefrequency>${this.escapeXML(
        this.sitemapChangefrequency
      )}</sitemap-changefrequency>`;
    }
    if (this.sitemapPriority != null) {
      xml += `\n${indent}<sitemap-priority>${this.escapeXML(
        String(this.sitemapPriority)
      )}</sitemap-priority>`;
    }

    // Page attributes (generic serializer)
    if (this.pageAttributes && typeof this.pageAttributes === "object") {
      xml += `\n${indent}<page-attributes>`;
      for (const [k, v] of Object.entries(
        this.pageAttributes as PageAttributes
      )) {
        if (v != null && v !== "") {
          const xmlElementName = this.transformToXMLElementName(k);
          xml += `\n${indent}${indent}<${this.escapeXML(xmlElementName)}>${this.escapeXML(
            String(v)
          )}</${this.escapeXML(xmlElementName)}>`;
        }
      }
      xml += `\n${indent}</page-attributes>`;
    }

    // Store attributes (generic serializer)
    if (this.storeAttributes && typeof this.storeAttributes === "object") {
      xml += `\n${indent}<store-attributes>`;
      for (const [k, v] of Object.entries(
        this.storeAttributes as StoreAttributes
      )) {
        if (v != null) {
          const xmlElementName = this.transformToXMLElementName(k);
          xml += `\n${indent}${indent}<${this.escapeXML(xmlElementName)}>${this.escapeXML(
            String(v)
          )}</${this.escapeXML(xmlElementName)}>`;
        }
      }
      xml += `\n${indent}</store-attributes>`;
    }

    // Manufacturer SKU
    if (this.manufacturerSku) {
      xml += `\n${indent}<manufacturer-sku>${this.escapeXML(
        this.manufacturerSku
      )}</manufacturer-sku>`;
    }

    // Pinterest / Facebook flags
    if (this.pinterestEnabledFlag != null) {
      xml += `\n${indent}<pinterest-enabled-flag>${this.pinterestEnabledFlag}</pinterest-enabled-flag>`;
    }
    if (this.facebookEnabledFlag != null) {
      xml += `\n${indent}<facebook-enabled-flag>${this.facebookEnabledFlag}</facebook-enabled-flag>`;
    }

    xml += "\n</product>";
    return xml;
  }

  /**
   * Escapa caracteres especiales para XML
   */
  private escapeXML(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Transforma nombres de propiedades camelCase a kebab-case para elementos XML
   */
  private transformToXMLElementName(text: string): string {
    return text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }

  /**
   * Crea una instancia desde datos CSV/JSON raw
   */
  static fromRawData(data: Record<string, unknown>): Product {
    return new Product(data as Partial<SFCCProduct> & { productId: string });
  }
}
