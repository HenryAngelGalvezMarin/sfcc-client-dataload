import React, { useState, useEffect, useMemo } from 'react';
import type {
  MappingPreview,
  ColumnMapping,
  TransformationType,
  DataRow
} from '../types/conversion';
import type { XSDMetadata } from '../types/xsd-metadata';

interface ColumnMappingProps {
  mappingPreview: MappingPreview[];
  xsdMetadata: XSDMetadata | null;
  sampleData: DataRow[];
  onMappingChange: (mappings: ColumnMapping[]) => void;
}

export const ColumnMappingEditor: React.FC<ColumnMappingProps> = ({
  mappingPreview,
  xsdMetadata,
  sampleData,
  onMappingChange
}) => {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);

  // Inicializar mappings desde las sugerencias
  useEffect(() => {
    const initialMappings: ColumnMapping[] = mappingPreview.map(preview => ({
      sourceColumn: preview.sourceColumn,
      targetPath: preview.suggestedElement,
      targetElement: preview.suggestedElement,
      transformation: 'none' as TransformationType,
      required: false,
      dataType: preview.suggestedType,
    }));
    setMappings(initialMappings);
  }, [mappingPreview]);

  // Notificar cambios
  useEffect(() => {
    onMappingChange(mappings);
  }, [mappings, onMappingChange]);

  // Obtener elementos disponibles del XSD
  const availableElements = useMemo(() => {
    if (!xsdMetadata) return [];

    const elements: { value: string; label: string; type: string }[] = [];

    // Agregar elementos globales
    Object.values(xsdMetadata.elements).forEach(el => {
      elements.push({
        value: el.name,
        label: `${el.name} (${el.type})`,
        type: 'element'
      });
    });

    // Agregar atributos de tipos complejos
    Object.values(xsdMetadata.complexTypes).forEach(ct => {
      if (ct.attributes) {
        Object.values(ct.attributes).forEach(attr => {
          elements.push({
            value: `${ct.name}.${attr.name}`,
            label: `${ct.name}.${attr.name} (${attr.type})`,
            type: 'attribute'
          });
        });
      }
    });

    return elements.sort((a, b) => a.label.localeCompare(b.label));
  }, [xsdMetadata]);

  const updateMapping = (index: number, updates: Partial<ColumnMapping>) => {
    setMappings(prev => prev.map((mapping, i) =>
      i === index ? { ...mapping, ...updates } : mapping
    ));
  };

  const removeMapping = (index: number) => {
    setMappings(prev => prev.filter((_, i) => i !== index));
  };

  const addCustomMapping = () => {
    setMappings(prev => [...prev, {
      sourceColumn: '',
      targetPath: '',
      targetElement: '',
      transformation: 'none' as TransformationType,
      required: false,
      dataType: 'string',
    }]);
  };

  const transformationOptions: { value: TransformationType; label: string }[] = [
    { value: 'none', label: 'Sin transformación' },
    { value: 'uppercase', label: 'Mayúsculas' },
    { value: 'lowercase', label: 'Minúsculas' },
    { value: 'trim', label: 'Quitar espacios' },
    { value: 'date-iso', label: 'Fecha ISO (YYYY-MM-DD)' },
    { value: 'date-salesforce', label: 'Fecha Salesforce (ISO)' },
    { value: 'boolean-yn', label: 'Booleano Y/N' },
    { value: 'boolean-10', label: 'Booleano 1/0' },
    { value: 'number-decimal', label: 'Número decimal' },
    { value: 'number-integer', label: 'Número entero' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Mapeo de Columnas
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Configura cómo se mapean las columnas de tu archivo a elementos XML
          </p>
        </div>

        <div className="p-6">
          {mappings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay columnas para mapear</p>
              <button
                onClick={addCustomMapping}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Agregar Mapeo Manual
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {mappings.map((mapping, index) => (
                <MappingRow
                  key={index}
                  mapping={mapping}
                  preview={mappingPreview.find(p => p.sourceColumn === mapping.sourceColumn)}
                  availableElements={availableElements}
                  transformationOptions={transformationOptions}
                  sampleData={sampleData}
                  columnOptions={mappingPreview}
                  onUpdate={(updates) => updateMapping(index, updates)}
                  onRemove={() => removeMapping(index)}
                />
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t">
            <button
              onClick={addCustomMapping}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              + Agregar Mapeo
            </button>
          </div>
        </div>
      </div>

      {/* Vista previa del resultado */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Resumen del mapeo ({mappings.length} columnas)
        </h4>
        <div className="text-xs text-gray-600 space-y-1">
          {mappings.map((mapping, index) => (
            <div key={index} className="flex justify-between">
              <span>{mapping.sourceColumn || 'Sin columna'}</span>
              <span>→</span>
              <span>{mapping.targetElement || 'Sin elemento'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface MappingRowProps {
  mapping: ColumnMapping;
  preview?: MappingPreview;
  availableElements: { value: string; label: string; type: string }[];
  transformationOptions: { value: TransformationType; label: string }[];
  sampleData: DataRow[];
  columnOptions: MappingPreview[];
  onUpdate: (updates: Partial<ColumnMapping>) => void;
  onRemove: () => void;
}

const MappingRow: React.FC<MappingRowProps> = ({
  mapping,
  preview,
  availableElements,
  transformationOptions,
  sampleData,
  columnOptions,
  onUpdate,
  onRemove
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const sampleValues = useMemo(() => {
    if (!mapping.sourceColumn) return [];
    return sampleData.slice(0, 3).map(row => row[mapping.sourceColumn]);
  }, [mapping.sourceColumn, sampleData]);

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Columna origen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Columna Origen
            </label>
            <select
              value={mapping.sourceColumn}
              onChange={(e) => onUpdate({ sourceColumn: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Seleccionar columna...</option>
              {columnOptions.map(p => (
                <option key={p.sourceColumn} value={p.sourceColumn}>
                  {p.sourceColumn}
                </option>
              ))}
            </select>
            {sampleValues.length > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                Ejemplos: {sampleValues.slice(0, 2).map(v => String(v)).join(', ')}
              </div>
            )}
          </div>

          {/* Elemento destino */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Elemento XML
            </label>
            <select
              value={mapping.targetElement}
              onChange={(e) => onUpdate({
                targetElement: e.target.value,
                targetPath: e.target.value
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Seleccionar elemento...</option>
              {availableElements.map(el => (
                <option key={el.value} value={el.value}>
                  {el.label}
                </option>
              ))}
            </select>
            {preview && (
              <div className="mt-1 text-xs text-green-600">
                Sugerido: {preview.suggestedElement} ({Math.round(preview.confidence * 100)}%)
              </div>
            )}
          </div>

          {/* Tipo de dato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Dato
            </label>
            <select
              value={mapping.dataType}
              onChange={(e) => onUpdate({ dataType: e.target.value as 'string' | 'number' | 'boolean' | 'date' })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="string">Texto</option>
              <option value="number">Número</option>
              <option value="boolean">Booleano</option>
              <option value="date">Fecha</option>
            </select>
          </div>
        </div>

        <button
          onClick={onRemove}
          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded"
          title="Eliminar mapeo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Opciones básicas */}
      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={mapping.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span className="ml-2 text-sm text-gray-700">Campo requerido</span>
        </label>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showAdvanced ? 'Ocultar opciones' : 'Opciones avanzadas'}
        </button>
      </div>

      {/* Opciones avanzadas */}
      {showAdvanced && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transformación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transformación
              </label>
              <select
                value={mapping.transformation || 'none'}
                onChange={(e) => onUpdate({ transformation: e.target.value as TransformationType })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {transformationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Valor por defecto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor por defecto
              </label>
              <input
                type="text"
                value={mapping.defaultValue || ''}
                onChange={(e) => onUpdate({ defaultValue: e.target.value })}
                placeholder="Valor si la celda está vacía"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
