import React, { useState } from 'react';
import { Upload, FileText, Download, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import CompanySelector from './CompanySelector';
import { FileService } from '../services/FileService';
import { SFCCConversionService } from '../services/SFCCConversionService';
import ConfigService from '../services/ConfigService';
import type { ConversionResult } from '../types/conversion';
import type { DataRow } from '../types/conversion';

interface FileInfo {
  name: string;
  size: number;
  type: string;
  rowCount: number;
  headers: string[];
}

const SimpleDataConverter: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [fileData, setFileData] = useState<DataRow[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadedFile(file);
    setFileInfo(null);
    setFileData(null);
    setConversionResult(null);

    try {
      setIsProcessing(true);

      // Procesar archivo
      const processedData = await FileService.processFile(file);

      if (!processedData.data || !processedData.headers) {
        throw new Error('No se pudieron extraer datos del archivo');
      }

      // Crear información del archivo
      const info: FileInfo = {
        name: file.name,
        size: file.size,
        type: file.type || (file.name.endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        rowCount: processedData.data.length,
        headers: processedData.headers
      };

      setFileInfo(info);
      setFileData(processedData.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando el archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertToXML = async () => {
    if (!fileData || !selectedCompany) {
      setError('Debe seleccionar una empresa y cargar un archivo');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setConversionResult(null);

    try {
      // Obtener la configuración de la empresa
      const configService = ConfigService.getInstance();
      const companyMapping = await configService.loadCompanyMapping(selectedCompany);

      const result = await SFCCConversionService.convertToSFCCCatalog(fileData, companyMapping);

      setConversionResult(result);

      if (!result.success) {
        setError(`Conversión completada con ${result.errors.length} errores`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error durante la conversión');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadXML = () => {
    if (!conversionResult?.xmlContent) return;

    const blob = new Blob([conversionResult.xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${uploadedFile?.name.replace(/\.[^/.]+$/, '') || 'products'}_sfcc_catalog.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const resetAll = () => {
    setUploadedFile(null);
    setFileInfo(null);
    setFileData(null);
    setConversionResult(null);
    setError(null);
    setSelectedCompany(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Convertidor de Datos SFCC
          </h1>
          <p className="text-lg text-gray-600">
            Convierte archivos Excel/CSV a XML para Salesforce B2C Commerce
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {/* Company Selection */}
          <CompanySelector
            selectedCompany={selectedCompany}
            onCompanySelect={setSelectedCompany}
            className="mb-6"
          />

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo de Datos
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                {isProcessing ? (
                  <Loader className="h-12 w-12 text-blue-500 animate-spin mb-3" />
                ) : (
                  <Upload className="h-12 w-12 text-gray-400 mb-3" />
                )}
                <span className="text-lg font-medium text-gray-900 mb-1">
                  {isProcessing ? 'Procesando archivo...' : 'Seleccionar archivo'}
                </span>
                <span className="text-sm text-gray-500">
                  Formatos soportados: CSV, Excel (.xlsx, .xls)
                </span>
              </label>
            </div>
          </div>

          {/* File Information */}
          {fileInfo && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-green-800 mb-2">
                    Archivo cargado exitosamente
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
                    <div>
                      <span className="font-medium">Nombre:</span> {fileInfo.name}
                    </div>
                    <div>
                      <span className="font-medium">Tamaño:</span> {formatFileSize(fileInfo.size)}
                    </div>
                    <div>
                      <span className="font-medium">Filas:</span> {fileInfo.rowCount.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Columnas:</span> {fileInfo.headers.length}
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="font-medium text-green-800">Columnas detectadas:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {fileInfo.headers.map((header, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md"
                        >
                          {header}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Convert Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleConvertToXML}
              disabled={!selectedCompany || !fileData || isProcessing}
              className={`
                px-6 py-3 rounded-lg font-medium text-white transition-colors flex items-center space-x-2
                ${!selectedCompany || !fileData || isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }
              `}
            >
              {isProcessing ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Convirtiendo...</span>
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" />
                  <span>Generar XML</span>
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Conversion Results */}
          {conversionResult && (
            <div className="mb-6">
              {/* Success/Warning Header */}
              <div className={`p-4 rounded-lg mb-4 ${
                conversionResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-start">
                  {conversionResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className={`text-sm font-medium ${
                      conversionResult.success ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {conversionResult.success
                        ? 'Conversión completada exitosamente'
                        : 'Conversión completada con advertencias'}
                    </h3>

                    {/* Stats */}
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm ${
                      conversionResult.success ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      <div>
                        <span className="font-medium">Total:</span> {conversionResult.stats.totalRows}
                      </div>
                      <div>
                        <span className="font-medium">Procesadas:</span> {conversionResult.stats.processedRows}
                      </div>
                      <div>
                        <span className="font-medium">Omitidas:</span> {conversionResult.stats.skippedRows}
                      </div>
                      <div>
                        <span className="font-medium">Errores:</span> {conversionResult.errors.length}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Download Button */}
                    {conversionResult.xmlContent && (
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={handleDownloadXML}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar XML
                        </button>
                      </div>
                    )}
              </div>

              {/* Errors and Warnings */}
              {(conversionResult.errors.length > 0 || conversionResult.warnings.length > 0) && (
                <div className="space-y-4">
                  {/* Errors */}
                  {conversionResult.errors.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="text-sm font-medium text-red-800 mb-2">
                        Errores ({conversionResult.errors.length})
                      </h4>
                      <div className="max-h-40 overflow-y-auto">
                        {conversionResult.errors.slice(0, 10).map((error, index) => (
                          <div key={index} className="text-sm text-red-700 mb-1">
                            <span className="font-medium">Fila {error.row}:</span> {error.message}
                          </div>
                        ))}
                        {conversionResult.errors.length > 10 && (
                          <div className="text-sm text-red-600 italic">
                            ... y {conversionResult.errors.length - 10} errores más
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {conversionResult.warnings.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">
                        Advertencias ({conversionResult.warnings.length})
                      </h4>
                      <div className="max-h-40 overflow-y-auto">
                        {conversionResult.warnings.slice(0, 10).map((warning, index) => (
                          <div key={index} className="text-sm text-yellow-700 mb-1">
                            <span className="font-medium">Fila {warning.row}:</span> {warning.message}
                          </div>
                        ))}
                        {conversionResult.warnings.length > 10 && (
                          <div className="text-sm text-yellow-600 italic">
                            ... y {conversionResult.warnings.length - 10} advertencias más
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reset Button */}
          {(uploadedFile || conversionResult) && (
            <div className="flex justify-center">
              <button
                onClick={resetAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Nuevo archivo
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Instrucciones de uso</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">1</span>
              <p>Selecciona la configuración de empresa correspondiente a tus datos</p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">2</span>
              <p>Carga tu archivo Excel (.xlsx) o CSV con los datos de productos</p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">3</span>
              <p>Haz clic en "Generar XML" para convertir automáticamente los datos</p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">4</span>
              <p>Descarga el archivo XML generado para importar en SFCC</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDataConverter;
