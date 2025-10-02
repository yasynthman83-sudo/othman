import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, RefreshCw, Loader2 } from 'lucide-react';
import { useInventoryData } from '../hooks/useInventoryData';
import InventoryTable from '../components/InventoryTable';
import SearchBar from '../components/SearchBar';
import StatisticsBar from '../components/StatisticsBar';
import Toast from '../components/Toast';
import { searchInventoryData } from '../utils/filterUtils';

const RemainingItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error, refetch, showToast, toastMessage, hideToast, updateLocalNote, updateLocalChecked } = useInventoryData();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter for unchecked items only
  const remainingItems = data.filter(item => !item.Checked);
  const searchedData = searchInventoryData(remainingItems, searchTerm);
  
  const checkedCount = 0; // Always 0 since we only show unchecked items
  const totalCount = searchedData.length;
  const remainingCount = totalCount;

  const handleBack = () => {
    navigate('/');
  };

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <>
      <Toast 
        message={toastMessage}
        isVisible={showToast}
        onClose={hideToast}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-fedshi-purple/10 font-inter">
        <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-200">
          <div className="px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <button
                  onClick={handleBack}
                  className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-orange-600 transition-all duration-200 hover:bg-orange-50 px-2 sm:px-3 py-2 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-semibold text-sm sm:text-lg hidden sm:inline">Back to Home</span>
                  <span className="font-semibold text-sm sm:hidden">Back</span>
                </button>
                
                <div className="h-6 sm:h-8 w-px bg-gray-300"></div>
                
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  <h1 className="text-lg sm:text-3xl font-bold text-gray-900 font-inter">Remaining Items</h1>
                </div>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 bg-fedshi-yellow text-fedshi-purple rounded-xl hover:bg-fedshi-yellow-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                title="Refresh Data"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
            </div>
            
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-6 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Local Data (Persistent) - Unchecked Items Only</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <span>Total Remaining: <strong className="text-gray-900 text-sm sm:text-lg">{remainingItems.length}</strong></span>
              {searchTerm && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span>Filtered: <strong className="text-orange-600 text-sm sm:text-lg">{searchedData.length}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <StatisticsBar 
            checkedCount={checkedCount}
            totalCount={totalCount}
            remainingCount={remainingCount}
          />
          
          <SearchBar 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search remaining items..."
          />
          
          <InventoryTable 
            data={searchedData} 
            loading={loading} 
            error={error} 
            onDataUpdate={refetch} 
            onLocalNoteUpdate={updateLocalNote}
            onLocalCheckedUpdate={updateLocalChecked}
          />
        </div>
      </div>
    </>
  );
};

export default RemainingItemsPage;