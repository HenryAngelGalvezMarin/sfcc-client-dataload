# Ejemplo: Usando Metadatos XSD para Crear Configuraciones

Este ejemplo muestra cómo usar los metadatos generados desde XSD como referencia para crear configuraciones de compañía más precisas.

## 1. Generar Metadatos

```bash
npm run process-xsd src/references/xsd/catalog.xsd
```

Esto genera `src/references/schemas/catalog.metadata.json` con información estructurada del XSD.

## 2. Analizar Metadata Generado

El archivo de metadatos contiene:

```json
{
  "targetNamespace": "http://www.demandware.com/xml/impex/catalog/2006-10-31",
  "rootElement": "catalog",
  "elements": {
    "product": {
      "name": "product",
      "type": "complexType.Product",
      "required": true,
      "attributes": [
        {
          "name": "product-id",
          "type": "string",
          "required": true
        }
      ]
    }
  },
  "recommendations": {
    "commonMappings": {
      "product-id": ["id", "ID", "identifier", "key"],
      "display-name": ["name", "title", "display-name"]
    },
    "requiredFields": ["product-id"],
    "optionalFields": ["brand", "description"]
  }
}
```

## 3. Crear Configuración Basada en Metadatos

```typescript
// src/config/companies/NewCompany/catalog.ts
import type { CompanyMapping } from '../../../types/company';

export const newCompanyCatalogMapping: CompanyMapping = {
  companyName: "NewCompany",
  description: "Configuración basada en análisis XSD",
  version: "1.0.0",

  catalog: {
    catalogId: "new-company-catalog",
    defaultCurrency: "USD",
    defaultLocale: "en_US"
  },

  // ✅ Usar recomendaciones de metadatos para mapeos
  columnMappings: {
    // Campo requerido identificado en metadatos
    'Product ID': {
      xmlElement: 'product',
      attribute: 'product-id',
      required: true,
      dataType: 'string',
      description: 'Identificador único del producto'
    },

    // Mapeo común sugerido en metadatos
    'Product Name': {
      xmlElement: 'display-name',
      attribute: null,
      required: true,
      dataType: 'string',
      description: 'Nombre de visualización del producto'
    },

    // Campo opcional identificado
    'Brand': {
      xmlElement: 'brand',
      attribute: null,
      required: false,
      dataType: 'string',
      description: 'Marca del producto'
    }
  },

  headerMappings: {
    'product-id': 'product-id',
    'display-name': 'display-name',
    'brand': 'brand'
  },

  transformations: {
    boolean: {
      true: ['true', '1', 'yes', 'available'],
      false: ['false', '0', 'no', 'unavailable']
    },
    currency: {
      removeSymbols: ['$', '€', '£'],
      decimalPlaces: 2
    }
  }
};
```

## 4. Validación Conceptual

Los metadatos permiten validar la configuración:

### Campos Requeridos
- ✅ `product-id` está mapeado (requerido en XSD)
- ✅ `display-name` está mapeado (común en productos)

### Campos Opcionales
- ✅ `brand` está incluido (opcional pero útil)
- ⚠️ `short-description` no está mapeado (considerar agregar)

### Tipos de Datos
- ✅ `product-id` como string ✓
- ✅ `display-name` como string ✓

## 5. Casos de Uso de Metadatos

### A. Identificar Campos Faltantes

```bash
# Los metadatos muestran que estos campos están disponibles:
# - classification-category
# - online-flag
# - list-price
#
# Revisar si deberían incluirse en la configuración
```

### B. Validar Estructura XML

```bash
# Los metadatos indican que <product> debe tener:
# - Atributo product-id (requerido)
# - Elementos hijos display-name, brand, etc.
#
# Verificar que la configuración produzca esta estructura
```

### C. Optimizar Mapeos

```bash
# Las recomendaciones sugieren mapeos comunes:
# - "id", "ID", "identifier" → product-id
# - "name", "title" → display-name
# - "price", "cost" → list-price
```

## 6. Flujo de Trabajo Recomendado

1. **Obtener XSD**: Descargar XSD más reciente de SFCC
2. **Generar Metadatos**: `npm run process-xsd archivo.xsd`
3. **Analizar Estructura**: Revisar elementos, atributos, tipos
4. **Identificar Requeridos**: Campos con `required: true`
5. **Crear Configuración**: Mapear columnas CSV → elementos XML
6. **Validar**: Probar con datos de ejemplo
7. **Documentar**: Anotar decisiones de mapeo

## 7. Beneficios

- **Precisión**: Configuraciones alineadas con XSD oficial
- **Completitud**: No olvidar campos importantes
- **Mantenimiento**: Detectar cambios en XSD
- **Documentación**: Referencias claras para el equipo
- **Calidad**: Menos errores de importación en SFCC

## 8. Notas Técnicas

- Los metadatos son para **referencia en desarrollo**, no se usan en runtime
- El XSD define la estructura **ideal**, pero las configuraciones pueden ser **subconjuntos**
- Algunos campos XSD pueden no aplicar según el caso de uso específico
- Las recomendaciones son **sugerencias**, no reglas obligatorias
