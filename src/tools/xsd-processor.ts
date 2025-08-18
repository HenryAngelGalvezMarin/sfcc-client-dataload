#!/usr/bin/env node

import { XSDParser } from './xsd-parser';
import type { MappingRecommendations } from './xsd-parser';
import type { XSDMetadata } from '../types/xsd-metadata';
import { writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'fs';
import { resolve, basename, join } from 'path';

/**
 * Herramienta CLI para procesar archivos XSD y generar metadatos JSON
 */
class XSDProcessor {
  private parser: XSDParser;

  constructor() {
    this.parser = new XSDParser();
  }

  /**
   * Procesa un archivo XSD y genera el archivo JSON de metadatos
   */
  public processXSDFile(xsdFilePath: string, outputPath?: string): void {
    try {
      console.log(`📖 Procesando XSD: ${xsdFilePath}`);

      // Verificar que el archivo existe
      if (!existsSync(xsdFilePath)) {
        throw new Error(`Archivo XSD no encontrado: ${xsdFilePath}`);
      }

      // Parsear el XSD
      const metadata = this.parser.parseXSDFile(xsdFilePath);

      // Determinar ruta de salida
      const finalOutputPath = outputPath || this.getDefaultOutputPath(xsdFilePath);

      // Crear directorio si no existe
      const outputDir = join(finalOutputPath, '..');
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Generar metadatos con información adicional
      const enrichedMetadata = {
        ...metadata,
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        sourceFile: basename(xsdFilePath),
        // Agregar recomendaciones para mapeos comunes
        recommendations: this.generateMappingRecommendations(metadata)
      };

      // Escribir archivo JSON
      writeFileSync(finalOutputPath, JSON.stringify(enrichedMetadata, null, 2), 'utf-8');

      console.log(`✅ Metadata generado exitosamente`);
      console.log(`📄 Archivo: ${finalOutputPath}`);
      console.log(`📊 Estadísticas:`);
      console.log(`   - Elementos: ${Object.keys(metadata.elements).length}`);
      console.log(`   - Tipos complejos: ${Object.keys(metadata.complexTypes).length}`);
      console.log(`   - Tipos simples: ${Object.keys(metadata.simpleTypes).length}`);

    } catch (error) {
      console.error(`❌ Error procesando XSD:`, error);
      throw error;
    }
  }

  /**
   * Procesa múltiples archivos XSD en un directorio
   */
  public processDirectory(directoryPath: string): void {
    try {
      const files = readdirSync(directoryPath);
      const xsdFiles = files.filter((file: string) => file.endsWith('.xsd'));

      if (xsdFiles.length === 0) {
        console.log(`⚠️  No se encontraron archivos XSD en: ${directoryPath}`);
        return;
      }

      console.log(`📂 Procesando ${xsdFiles.length} archivo(s) XSD en: ${directoryPath}`);

      xsdFiles.forEach((file: string) => {
        const fullPath = join(directoryPath, file);
        this.processXSDFile(fullPath);
      });

    } catch (error) {
      console.error(`❌ Error procesando directorio:`, error);
      throw error;
    }
  }

  /**
   * Genera ruta de salida por defecto basada en el archivo XSD
   */
  private getDefaultOutputPath(xsdFilePath: string): string {
    const baseName = basename(xsdFilePath, '.xsd');
    const outputDir = resolve('./src/references/schemas');

    // Crear directorio si no existe
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    return resolve(outputDir, `${baseName}.metadata.json`);
  }

  /**
   * Genera recomendaciones de mapeo basadas en los metadatos del XSD
   */
  private generateMappingRecommendations(metadata: XSDMetadata): MappingRecommendations {
    const recommendations: MappingRecommendations = {
      commonMappings: {},
      requiredFields: [],
      optionalFields: [],
      nestedStructures: []
    };

    if (!metadata.elements) return recommendations;

    // Analizar elementos para generar recomendaciones
    Object.keys(metadata.elements).forEach(elementName => {
      const element = metadata.elements[elementName];

      if (element?.required) {
        recommendations.requiredFields.push(elementName);
      } else {
        recommendations.optionalFields.push(elementName);
      }

      // Mapeos comunes basados en nombres de elementos
      if (elementName.includes('id') || elementName.includes('Id')) {
        recommendations.commonMappings[elementName] = ['id', 'ID', 'identifier', 'key'];
      }

      if (elementName.includes('name') || elementName.includes('Name')) {
        recommendations.commonMappings[elementName] = ['name', 'title', 'display-name'];
      }

      if (elementName.includes('price') || elementName.includes('Price')) {
        recommendations.commonMappings[elementName] = ['price', 'cost', 'value', 'amount'];
      }
    });

    return recommendations;
  }
}

// CLI Logic
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📋 XSD Processor - Generador de Metadatos para SFCC

Uso:
  npm run process-xsd <archivo.xsd>              # Procesar un archivo XSD
  npm run process-xsd <directorio>               # Procesar todos los XSD en un directorio
  npm run process-xsd <archivo.xsd> <salida>     # Especificar archivo de salida

Ejemplos:
  npm run process-xsd ./src/references/xsd/catalog.xsd
  npm run process-xsd ./src/references/xsd/
  npm run process-xsd ./src/references/xsd/catalog.xsd ./custom-output.json
    `);
    process.exit(0);
  }

  const processor = new XSDProcessor();
  const inputPath = resolve(args[0]);
  const outputPath = args[1] ? resolve(args[1]) : undefined;

  try {
    // Verificar si es directorio o archivo
    const stats = statSync(inputPath);

    if (stats.isDirectory()) {
      processor.processDirectory(inputPath);
    } else if (stats.isFile() && inputPath.endsWith('.xsd')) {
      processor.processXSDFile(inputPath, outputPath);
    } else {
      console.error('❌ Debe especificar un archivo XSD válido o un directorio');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar solo si este es el módulo principal
const isMainModule = process.argv[1]?.includes('xsd-processor.ts') || process.argv[1]?.includes('xsd-processor.js');
if (isMainModule) {
  main();
}

export { XSDProcessor };
