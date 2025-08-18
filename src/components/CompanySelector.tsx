import React, { useState, useEffect } from 'react';
import ConfigService, { type CompanyInfo } from '../services/ConfigService';

interface CompanySelectorProps {
  selectedCompany: string | null;
  onCompanySelect: (company: string) => void;
  className?: string;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({
  selectedCompany,
  onCompanySelect,
  className = ''
}) => {
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const configService = ConfigService.getInstance();
      const availableCompanies = await configService.getAvailableCompanies();
      setCompanies(availableCompanies);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando empresas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Configuración de Empresa
        </label>
        <div className="border border-red-300 rounded-md p-3 bg-red-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={loadCompanies}
                  className="bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium py-2 px-3 rounded-md transition-colors"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <label htmlFor="company-select" className="block text-sm font-medium text-gray-700 mb-2">
        Configuración de Empresa
      </label>
      <select
        id="company-select"
        value={selectedCompany || ''}
        onChange={(e) => onCompanySelect(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        <option value="">Seleccionar empresa...</option>
        {companies.map((company) => (
          <option key={company.name} value={company.name}>
            {company.displayName}
          </option>
        ))}
      </select>

      {selectedCompany && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Configuración: {companies.find(c => c.name === selectedCompany)?.displayName}
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>{companies.find(c => c.name === selectedCompany)?.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySelector;
