import React, { useState, useEffect } from 'react';
import type { XSDMetadata, XSDElement, XSDComplexType, XSDSimpleType, XSDAttribute } from '../types/xsd-metadata';

interface XSDViewerProps {
  metadata?: XSDMetadata;
}

export const XSDViewer: React.FC<XSDViewerProps> = ({ metadata }) => {
  const [xsdMetadata, setXsdMetadata] = useState<XSDMetadata | null>(null);
  const [selectedTab, setSelectedTab] = useState<'elements' | 'complexTypes' | 'simpleTypes'>('elements');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (metadata) {
      setXsdMetadata(metadata);
    } else {
      // Cargar los metadatos del archivo generado
      import('../schemas/catalog.metadata.json')
        .then((module) => {
          setXsdMetadata(module.default as XSDMetadata);
        })
        .catch((error) => {
          console.error('Error loading metadata:', error);
          // Datos por defecto básicos si no se puede cargar
          setXsdMetadata({
            targetNamespace: 'http://www.demandware.com/xml/impex/catalog/2006-10-31',
            rootElement: 'catalog',
            elements: {},
            complexTypes: {},
            simpleTypes: {},
            imports: [],
            includes: []
          });
        });
    }
  }, [metadata]);

  if (!xsdMetadata) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando metadatos XSD...</p>
        </div>
      </div>
    );
  }  const filterItems = (items: Record<string, any>, searchTerm: string) => {
    if (!searchTerm) return items;

    return Object.entries(items).reduce((filtered, [key, value]) => {
      if (key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (value.description && value.description.toLowerCase().includes(searchTerm.toLowerCase()))) {
        filtered[key] = value;
      }
      return filtered;
    }, {} as Record<string, any>);
  };

  const renderElements = () => {
    const filteredElements = filterItems(xsdMetadata.elements, searchTerm);

    return (
      <div className="grid gap-4">
        {Object.entries(filteredElements).map(([name, element]) => (
          <div key={name} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-blue-600">{name}</h3>
              <span className={`px-2 py-1 rounded text-xs ${
                element.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {element.required ? 'Requerido' : 'Opcional'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Tipo:</span> {element.type}
              </div>
              <div>
                <span className="font-medium">Ocurrencias:</span> {element.minOccurs} - {element.maxOccurs}
              </div>
            </div>

            {element.description && (
              <p className="mt-2 text-sm text-gray-600">{element.description}</p>
            )}

            {element.attributes && element.attributes.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-sm mb-2">Atributos:</h4>
                <div className="flex flex-wrap gap-2">
                  {element.attributes.map((attr: any, idx: number) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                      {attr.name}
                      {attr.required && <span className="text-red-500">*</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderComplexTypes = () => {
    const filteredTypes = filterItems(xsdMetadata.complexTypes, searchTerm);

    return (
      <div className="grid gap-4">
        {Object.entries(filteredTypes).map(([name, type]) => (
          <div key={name} className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-green-600 mb-2">{name}</h3>

            {type.description && (
              <p className="text-sm text-gray-600 mb-3">{type.description}</p>
            )}

            {type.elements && type.elements.length > 0 && (
              <div className="mb-3">
                <h4 className="font-medium text-sm mb-2">Elementos ({type.elements.length}):</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {type.elements.slice(0, 10).map((elem: any, idx: number) => (
                    <span key={idx} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                      {elem.name}
                    </span>
                  ))}
                  {type.elements.length > 10 && (
                    <span className="text-xs text-gray-500">
                      +{type.elements.length - 10} más...
                    </span>
                  )}
                </div>
              </div>
            )}

            {type.attributes && type.attributes.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Atributos ({type.attributes.length}):</h4>
                <div className="flex flex-wrap gap-2">
                  {type.attributes.map((attr: any, idx: number) => (
                    <span key={idx} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
                      {attr.name}
                      {attr.required && <span className="text-red-500">*</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSimpleTypes = () => {
    const filteredTypes = filterItems(xsdMetadata.simpleTypes, searchTerm);

    return (
      <div className="grid gap-4">
        {Object.entries(filteredTypes).map(([name, type]) => (
          <div key={name} className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-purple-600 mb-2">{name}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Tipo base:</span> {type.baseType}
              </div>
            </div>

            {type.description && (
              <p className="mt-2 text-sm text-gray-600">{type.description}</p>
            )}

            {type.restrictions && (
              <div className="mt-3">
                <h4 className="font-medium text-sm mb-2">Restricciones:</h4>
                <div className="bg-purple-50 p-2 rounded text-xs">
                  {type.restrictions.enumeration && (
                    <div className="mb-1">
                      <span className="font-medium">Valores:</span> {type.restrictions.enumeration.join(', ')}
                    </div>
                  )}
                  {type.restrictions.pattern && (
                    <div className="mb-1">
                      <span className="font-medium">Patrón:</span> {type.restrictions.pattern}
                    </div>
                  )}
                  {(type.restrictions.minLength || type.restrictions.maxLength) && (
                    <div>
                      <span className="font-medium">Longitud:</span>
                      {type.restrictions.minLength && ` min: ${type.restrictions.minLength}`}
                      {type.restrictions.maxLength && ` max: ${type.restrictions.maxLength}`}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Explorador de Esquema XSD - Salesforce B2C
        </h1>
        <div className="text-sm text-gray-600">
          <div><strong>Namespace:</strong> {xsdMetadata.targetNamespace}</div>
          <div><strong>Elemento raíz:</strong> {xsdMetadata.rootElement}</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar elementos, tipos o descripciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'elements', label: 'Elementos', count: Object.keys(xsdMetadata.elements).length },
              { id: 'complexTypes', label: 'Tipos Complejos', count: Object.keys(xsdMetadata.complexTypes).length },
              { id: 'simpleTypes', label: 'Tipos Simples', count: Object.keys(xsdMetadata.simpleTypes).length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-50 p-4 rounded-lg">
        {selectedTab === 'elements' && renderElements()}
        {selectedTab === 'complexTypes' && renderComplexTypes()}
        {selectedTab === 'simpleTypes' && renderSimpleTypes()}
      </div>
    </div>
  );
};
