import React, { useState, useCallback } from 'react';
import { FileService } from '../services/FileService';
import type { FileUploadResult, MappingPreview } from '../types/conversion';

interface FileUploadProps {
  onFileUploaded: (result: FileUploadResult, mappingPreview: MappingPreview[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setUploadStatus({ type: 'info', message: 'Procesando archivo...' });

    try {
      // Validar archivo
      const validation = FileService.validateFile(file);
      if (!validation.valid) {
        setUploadStatus({
          type: 'error',
          message: validation.errors.join(', ')
        });
        setIsProcessing(false);
        return;
      }

      // Procesar archivo
      const result = await FileService.processFile(file);

      if (!result.success) {
        setUploadStatus({
          type: 'error',
          message: result.errors?.join(', ') || 'Error procesando archivo'
        });
        setIsProcessing(false);
        return;
      }

      // Generar preview de mapeo
      const mappingPreview = result.data && result.headers
        ? FileService.generateMappingPreview(result.data, result.headers)
        : [];

      setUploadStatus({
        type: 'success',
        message: `Archivo procesado exitosamente. ${result.fileInfo.totalRows} filas encontradas.`
      });

      onFileUploaded(result, mappingPreview);

    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
    } finally {
      setIsProcessing(false);
    }
  }, [onFileUploaded]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleChange}
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              {isProcessing ? 'Procesando archivo...' : 'Sube tu archivo'}
            </p>
            <p className="text-gray-500 mt-1">
              Arrastra un archivo aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Soporta: CSV, Excel (.xlsx, .xls) - Máximo 10MB
            </p>
          </div>
        </div>
      </div>

      {/* Estado del upload */}
      {uploadStatus.type && (
        <div className={`mt-4 p-3 rounded-md ${
          uploadStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          uploadStatus.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {uploadStatus.type === 'success' && (
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {uploadStatus.type === 'error' && (
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {uploadStatus.type === 'info' && (
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {uploadStatus.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Información de ayuda */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Formatos soportados:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>CSV:</strong> Archivo de valores separados por comas con headers en la primera fila</li>
          <li>• <strong>Excel:</strong> Archivos .xlsx o .xls con datos en la primera hoja</li>
          <li>• <strong>Límite:</strong> Máximo 10MB por archivo</li>
          <li>• <strong>Estructura:</strong> La primera fila debe contener los nombres de las columnas</li>
        </ul>
      </div>
    </div>
  );
};
