# XSD Metadata Generation System

## Descripción

Este sistema permite generar metadatos JSON a partir de archivos XSD de Salesforce B2C Commerce. Los metadatos generados son útiles para:

1. **Desarrollo de configuraciones de compañía**: Entender la estructura XML requerida
2. **Validación de datos**: Verificar que los mapeos sean correctos
3. **Documentación**: Tener una referencia clara de los elementos y tipos disponibles
4. **Debugging**: Identificar problemas en las transformaciones XML

## Estructura de archivos

```
src/
├── references/
│   ├── xsd/                    # Archivos XSD originales de SFCC
│   │   └── catalog.xsd
│   └── schemas/                # Metadatos JSON generados
│       └── catalog.metadata.json
└── tools/
    ├── xsd-parser.ts          # Parser principal de XSD
    ├── xsd-processor.ts       # Procesador CLI completo
    └── simple-xsd-test.ts     # Versión simple para testing
```

## Uso

### Comando básico

```bash
npm run process-xsd src/references/xsd/catalog.xsd
```

### Comando manual

```bash
npx tsx src/tools/simple-xsd-test.ts src/references/xsd/catalog.xsd
```

### Procesamiento de múltiples archivos

```bash
npx tsx src/tools/xsd-processor.ts src/references/xsd/
```

## Formato de metadata generado

```json
{
  "targetNamespace": "http://www.demandware.com/xml/impex/catalog/2006-10-31",
  "rootElement": "catalog",
  "version": "1.0.0",
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "sourceFile": "catalog.xsd",
  "elements": {
    "product": {
      "name": "product",
      "type": "complexType.Product",
      "required": true,
      "minOccurs": 1,
      "maxOccurs": "unbounded",
      "description": "Product element definition",
      "attributes": [
        {
          "name": "product-id",
          "type": "string",
          "required": true,
          "description": "Unique product identifier"
        }
      ],
      "children": [...],
      "isSimpleType": false
    }
  },
  "complexTypes": {...},
  "simpleTypes": {...},
  "recommendations": {
    "commonMappings": {
      "product-id": ["id", "ID", "identifier", "key"],
      "display-name": ["name", "title", "display-name"]
    },
    "requiredFields": ["product-id", "name"],
    "optionalFields": ["description", "brand"],
    "nestedStructures": ["custom-attributes", "classification-category"]
  }
}
```

## Integración con configuraciones de compañía

Los metadatos generados pueden usarse para:

1. **Validar mapeos**: Verificar que todos los campos requeridos están mapeados
2. **Sugerir transformaciones**: Recomendar transformaciones basadas en tipos XSD
3. **Generar plantillas**: Crear configuraciones base para nuevas compañías

### Ejemplo de uso en configuración

```typescript
// src/config/companies/ExampleCorp/catalog.ts
import catalogMetadata from '../../../references/schemas/catalog.metadata.json';

export const exampleCorpCatalogConfig: CompanyMapping = {
  name: 'ExampleCorp',
  schema: 'catalog',
  // Usar metadatos para validación
  requiredFields: catalogMetadata.recommendations.requiredFields,
  columnMappings: {
    // Mapeos basados en recomendaciones
    'ID': catalogMetadata.recommendations.commonMappings['product-id'][0],
    'Name': catalogMetadata.recommendations.commonMappings['display-name'][0],
    // ...
  },
  // ...
};
```

## Casos de uso

### 1. Crear nueva configuración de compañía

```bash
# 1. Generar metadata del XSD
npm run process-xsd src/references/xsd/catalog.xsd

# 2. Revisar metadata generado
cat src/references/schemas/catalog.metadata.json

# 3. Usar recomendaciones para crear configuración
# Copiar plantilla y usar campos recomendados
```

### 2. Debugging de errores XML

```bash
# 1. Verificar estructura esperada en metadata
# 2. Comparar con configuración actual
# 3. Identificar campos faltantes o incorrectos
```

### 3. Actualización de XSD

```bash
# 1. Colocar nuevo XSD en src/references/xsd/
# 2. Regenerar metadata
npm run process-xsd src/references/xsd/new-schema.xsd
# 3. Comparar cambios con versión anterior
# 4. Actualizar configuraciones afectadas
```

## Tipos de datos soportados

- **Elementos simples**: string, int, decimal, boolean, date
- **Elementos complejos**: Con atributos y elementos hijos
- **Restricciones**: Enumeraciones, patrones, longitudes
- **Cardinalidad**: minOccurs, maxOccurs, required/optional
- **Documentación**: Extraída de annotations XSD

## Recomendaciones

El sistema genera automáticamente:

- **Mapeos comunes**: Basados en nombres de elementos (id, name, price, etc.)
- **Campos requeridos**: Según minOccurs > 0
- **Campos opcionales**: Según minOccurs = 0
- **Estructuras anidadas**: Elementos con hijos complejos

## Limitaciones actuales

- No procesa `include` o `import` de XSD externos
- Algunos tipos complejos muy anidados pueden no parsearse completamente
- Las restricciones de algunos tipos simples podrían no detectarse

## Roadmap

- [ ] Soporte para XSD imports/includes
- [ ] Validación automática de configuraciones vs metadata
- [ ] Generación automática de configuraciones base
- [ ] UI para explorar metadata visualmente
- [ ] Comparación de diferencias entre versiones XSD