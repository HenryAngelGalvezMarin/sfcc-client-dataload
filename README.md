# SFCC Data Converter

Herramienta para convertir archivos Excel/CSV a XML para Salesforce B2C Commerce con configuraciones específicas por empresa.

## 🏗️ Estructura del Proyecto

```
src/
├── components/
│   ├── CompanySelector.tsx    # Selector de empresa
│   └── SimpleDataConverter.tsx # Componente principal
├── config/
│   ├── companies.ts          # Registro central de empresas
│   └── companies/           # Configuraciones por empresa
│       ├── Typhoon/
│       │   ├── index.ts     # Configuración principal
│       │   ├── catalog.ts   # Mapeo para catálogo
│       │   └── pricebook.ts # Mapeo para pricebook (futuro)
│       └── ExampleCorp/
│           ├── index.ts
│           └── catalog.ts
├── services/
│   ├── ConfigService.ts      # Gestión de configuraciones
│   ├── CompanyConversionService.ts # Conversión con configuraciones
│   └── FileService.ts        # Procesamiento de archivos
├── types/
│   ├── company.ts           # Tipos para configuraciones de empresa
│   └── conversion.ts        # Tipos para conversión
├── references/              # 🆕 Sistema de referencia XSD
│   └── xsd/                # Archivos XSD oficiales SFCC
│       └── catalog.xsd     # Schema oficial de catálogo SFCC
├── classes/                # 🆕 Clases SFCC tipadas manualmente
│   ├── base/
│   │   └── types.ts        # Tipos base y interfaces
│   └── catalog/
│       ├── Product.ts      # Clase Product con validación
│       ├── Category.ts     # Clase Category
│       ├── SFCCCatalogFactory.ts  # Factory para conversiones
│       └── index.ts        # Exports del módulo
└── App.tsx                 # Aplicación principal
```

## 🚀 Uso

1. **Seleccionar empresa**: Elige la configuración de empresa apropiada
2. **Subir archivo**: Carga tu archivo Excel (.xlsx) o CSV
3. **Generar XML**: La aplicación mapea automáticamente las columnas y convierte a XML
4. **Descargar**: Obtén el archivo XML listo para importar en SFCC

## 🏢 Empresas Configuradas

### Typhoon
- **Catálogo ID**: typhoon-master-catalog
- **Moneda**: USD
- **Locale**: en_US
- **Esquemas**: catalog

### ExampleCorp
- **Catálogo ID**: examplecorp-catalog
- **Moneda**: EUR
- **Locale**: en_GB
- **Esquemas**: catalog

## 📋 Sistema XSD Metadata

### Generar metadatos desde XSD

```bash
# Procesar un archivo XSD específico
npm run process-xsd src/references/xsd/catalog.xsd

# O usar la herramienta directamente
npx tsx src/tools/simple-xsd-test.ts src/references/xsd/catalog.xsd
```

### Uso de metadatos

Los metadatos generados proporcionan:
- **Estructura XML**: Elementos, atributos y tipos
- **Validaciones**: Campos requeridos vs opcionales
- **Recomendaciones**: Mapeos comunes basados en nombres
- **Documentación**: Referencias para desarrolladores

Ver [documentación completa del sistema XSD](./docs/XSD_METADATA_SYSTEM.md)

## 📝 Agregar Nueva Empresa

1. Crear carpeta en `src/config/companies/NuevaEmpresa/`
2. Crear archivo `catalog.ts` con la configuración de mapeo
3. Crear archivo `index.ts` que exporte la configuración
4. Agregar la empresa al registro en `src/config/companies.ts`

### Ejemplo de configuración:

```typescript
// src/config/companies/NuevaEmpresa/catalog.ts
import type { CompanyMapping } from '../../../types/company';

export const NuevaEmpresaCatalogMapping: CompanyMapping = {
  companyName: "NuevaEmpresa",
  description: "Configuración para nueva empresa",
  version: "1.0.0",
  catalog: {
    catalogId: "nueva-empresa-catalog",
    defaultCurrency: "USD",
    defaultLocale: "en_US"
  },
  columnMappings: {
    // Definir mapeos aquí
  },
  headerMappings: {
    // Definir mapeos de headers aquí
  },
  transformations: {
    // Definir transformaciones aquí
  }
};
```

## 🛠️ Esquemas Soportados

- **catalog**: Mapeo para productos del catálogo (implementado)
- **pricebook**: Mapeo para libros de precios (futuro)
- **inventory**: Mapeo para inventario (futuro)

## 🧪 Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build
npm run build

# Lint
npm run lint

# Procesar XSD para metadata
npm run process-xsd src/references/xsd/catalog.xsd
```

## 📋 Dependencias Principales

- **React 19**: Framework frontend
- **TypeScript**: Tipado estático
- **Vite**: Build tool
- **Tailwind CSS**: Estilos
- **js2xmlparser**: Generación de XML
- **PapaParse**: Procesamiento de CSV
- **SheetJS**: Procesamiento de Excel
- **Lucide React**: Iconos
- **fast-xml-parser**: Parser de XSD para metadatos

## 🎯 Características

- ✅ Interfaz simplificada (3 pasos)
- ✅ Mapeo automático de columnas por empresa
- ✅ Configuraciones extensibles
- ✅ Validación de datos
- ✅ Transformaciones automáticas
- ✅ Generación de XML compatible con SFCC
- ✅ Soporte para múltiples esquemas (catalog, pricebook, etc.)
- ✅ Gestión de errores y advertencias
- ✅ Archivos de ejemplo incluidos
- ✅ **Sistema XSD Metadata**: Generación automática de metadatos desde XSD
- ✅ **Herramientas de desarrollo**: Utilidades CLI para análisis XSD
- ✅ **Documentación técnica**: Referencias para desarrolladores

## 🔧 Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run lint         # Linting
npm run preview      # Preview del build
npm run process-xsd  # Procesar archivos XSD (requiere ruta como argumento)
```

## 📚 Documentación

- [Sistema XSD Metadata](./docs/XSD_METADATA_SYSTEM.md) - Generación y uso de metadatos XSD
- [Configuración de empresas](./src/config/companies/) - Ejemplos de configuraciones
- [Tipos TypeScript](./src/types/) - Definiciones de tipos del sistema
