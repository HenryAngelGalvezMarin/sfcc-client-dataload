#!/usr/bin/env node

import { XSDParser } from './xsd-parser';
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
      console.log(`🔍 Procesando archivo XSD: ${xsdFilePath}`);

      // Verificar que el archivo existe
      if (!existsSync(xsdFilePath)) {
        throw new Error(`Archivo XSD no encontrado: ${xsdFilePath}`);
      }

      // Parsear el XSD
      const metadata = this.parser.parseXSD(xsdFilePath);

      // Generar nombre del archivo de salida
      const outputFile = outputPath || this.generateOutputPath(xsdFilePath);

      // Escribir metadatos a archivo JSON
      writeFileSync(outputFile, JSON.stringify(metadata, null, 2), 'utf-8');

      console.log(`✅ Metadatos generados exitosamente:`);
      console.log(`   📁 Archivo: ${outputFile}`);
      console.log(`   📊 Elementos: ${Object.keys(metadata.elements).length}`);
      console.log(`   🏗️  Tipos complejos: ${Object.keys(metadata.complexTypes).length}`);
      console.log(`   📝 Tipos simples: ${Object.keys(metadata.simpleTypes).length}`);
      console.log(`   🎯 Elemento raíz: ${metadata.rootElement}`);
      console.log(`   🌐 Namespace: ${metadata.targetNamespace}`);

    } catch (error) {
      console.error(`❌ Error procesando archivo XSD:`, error);
      process.exit(1);
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
      process.exit(1);
    }
  }

  private generateOutputPath(xsdFilePath: string): string {
    const baseName = basename(xsdFilePath, '.xsd');
    const outputDir = resolve('./src/schemas');

    // Crear directorio si no existe
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    return resolve(outputDir, `${baseName}.metadata.json`);
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
  npm run process-xsd ./xsd-files/catalog.xsd
  npm run process-xsd ./xsd-files/
  npm run process-xsd ./xsd-files/catalog.xsd ./custom-output.json
    `);
    process.exit(0);
  }

  const processor = new XSDProcessor();
  const inputPath = resolve(args[0]);
  const outputPath = args[1] ? resolve(args[1]) : undefined;

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
}

// Ejecutar solo si este es el módulo principal
main();

export { XSDProcessor };
