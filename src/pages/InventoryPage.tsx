import React from 'react';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Loader2, MapPin, Warehouse, Package } from 'lucide-react';
import InventoryTable from '../components/InventoryTable';
import SearchBar from '../components/SearchBar';
import StatisticsBar from '../components/StatisticsBar';
import NotesSummaryTable from '../components/NotesSummaryTable';
import Toast from '../components/Toast';
import { useInventoryData } from '../hooks/useInventoryData';
import { filterInventoryData, getFilterTitle, searchInventoryData } from '../utils/filterUtils';
import { FilterType } from '../types/inventory';

const InventoryPage: React.FC = () => {
  const { filterType } = useParams<{ filterType: string }>();
  const navigate = useNavigate();
  // We need updateLocalNote and updateLocalChecked from the hook
  const { data, loading, error, refetch, showToast, toastMessage, hideToast, updateLocalNote, updateLocalChecked } = useInventoryData();
  const [searchTerm, setSearchTerm] = useState('');

  if (!filterType || !['A1-A6', 'A7-A12', 'B-AG'].includes(filterType)) {
    navigate('/');
    return null;
  }

  const typedFilterType = filterType as FilterType;
  const filteredData = filterInventoryData(data, typedFilterType);
  const searchedData = searchInventoryData(filteredData, searchTerm);
  const title = getFilterTitle(typedFilterType);
  
  const checkedCount = searchedData.filter(item => item.Checked).length;
  const totalCount = searchedData.length;
  const remainingCount = totalCount - checkedCount;

  const handleBack = () => navigate('/');
  const handleRefresh = async () => await refetch();

  const getFilterIcon = (filterType: FilterType) => {
    switch (filterType) {
      case 'A1-A6': return <MapPin className="w-5 h-5 text-fedshi-purple" />;
      case 'A7-A12': return <Warehouse className="w-5 h-5 text-fedshi-purple" />;
      case 'B-AG': return <Package className="w-5 h-5 text-fedshi-purple" />;
      default: return null;
    }
  };

  return (
    <>
      <Toast message={toastMessage} isVisible={showToast} onClose={hideToast} />
      
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-fedshi-purple/10 font-inter">
        <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-200">
          <div className="px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex items-center justify-between">
              {/* Header content... */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <button
                  onClick={handleBack}
                  className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-fedshi-purple transition-all duration-200 hover:bg-fedshi-purple/5 px-2 sm:px-3 py-2 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-semibold text-sm sm:text-lg hidden sm:inline">Back to Home</span>
                  <span className="font-semibold text-sm sm:hidden">Back</span>
                </button>
                <div className="h-6 sm:h-8 w-px bg-gray-300"></div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {getFilterIcon(typedFilterType)}
                  <h1 className="text-lg sm:text-3xl font-bold text-gray-900">{title}</h1>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 bg-fedshi-yellow text-fedshi-purple rounded-xl hover:bg-fedshi-yellow-dark transition-all duration-200 disabled:opacity-50"
                title="Refresh Data"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </button>
            </div>
            {/* Sub-header content... */}
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Local Data (Persistent)</span>
              </div>
              <span>Total Items: <strong className="text-gray-900 text-lg">{searchedData.length}</strong></span>
              <span>Filter: <strong className="text-fedshi-purple text-lg">{filterType}</strong></span>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <StatisticsBar checkedCount={checkedCount} totalCount={totalCount} remainingCount={remainingCount} />
          <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          
          {/* ✅ Correctly passing the required functions as props */}
          <InventoryTable 
            data={searchedData} 
            loading={loading} 
            error={error} 
            onLocalNoteUpdate={updateLocalNote}
            onLocalCheckedUpdate={updateLocalChecked}
          />
          
          <NotesSummaryTable data={searchedData} showDownloadButton={false} />
        </div>
      </div>
    </>
  );
};

export default InventoryPage;