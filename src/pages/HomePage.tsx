import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Package, MapPin, Warehouse, Loader2, RotateCcw, Download, ShoppingCart, Upload, ArrowLeft } from 'lucide-react';
import FilterButton from '../components/FilterButton';
import GlobalDashboard from '../components/GlobalDashboard';
import QuantitySummary from '../components/QuantitySummary';
import GlobalNotesTable from '../components/GlobalNotesTable';
import InventoryTable from '../components/InventoryTable';
import LocationFilter from '../components/LocationFilter';
import SearchBar from '../components/SearchBar';
import StatisticsBar from '../components/StatisticsBar';
import { filterInventoryData } from '../utils/filterUtils';
import { searchInventoryData } from '../utils/filterUtils';
import * as XLSX from 'xlsx';
import { useInventoryData } from '../hooks/useInventoryData';

export default function HomePage() {
  const { data, loading, error, refetch, loadData, uploadFile, updateLocalNote, updateLocalChecked } = useInventoryData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  
  const a1a6Count = filterInventoryData(data, 'A1-A6').length;
  const a7a12Count = filterInventoryData(data, 'A7-A12').length;
  const bagCount = filterInventoryData(data, 'B-AG').length;
  const remainingCount = data.filter(item => !item.Checked).length;
  
  const totalOrdersCount = data.reduce((sum, item) => sum + (item.OrdersCount || 0), 0);

 // ✅ Precise filtering - fixed A1 matching A10 bug
const getFilteredData = () => {
  if (selectedLocations.length === 0) {
    return data;
  }

  return data.filter(item => {
    const location = item.Location?.trim();
    if (!location) return false;

    const upperLocation = location.toUpperCase();

    return selectedLocations.some(baseLocation => {
      const upperBase = baseLocation.toUpperCase();

      // ✅ A-locations: A1 matches A1, A1L1, A1R3 but NOT A10, A11
      if (upperBase.startsWith('A')) {
        const baseNum = upperBase.substring(1);
        const regex = new RegExp(`^A${baseNum}(?!\\d)`, 'i');
        return regex.test(upperLocation);
      }

      // ✅ B-locations: B5 matches B5, B5R1 but NOT B50, B51
      if (upperBase.startsWith('B')) {
        if (upperBase === 'B') {
          return /^B(?!\d)/i.test(upperLocation);
        } else {
          const baseNum = upperBase.substring(1);
          const regex = new RegExp(`^B${baseNum}(?!\\d)`, 'i');
          return regex.test(upperLocation);
        }
      }

      // ✅ AG locations: AG matches AG, AG-001 but NOT AGA, AGB
      if (upperBase === 'AG') {
        return /^AG(?![A-Z])/i.test(upperLocation);
      }

      return false;
    });
  });
};


  const filteredData = getFilteredData();
  const searchedData = searchInventoryData(filteredData, searchTerm);

  const handleLocationFilter = (locations: string[]) => {
    setSelectedLocations(locations);
    setShowLocationFilter(false);
  };

  const handleClearLocationFilter = () => {
    setSelectedLocations([]);
    setSearchTerm('');
  };

  const downloadNotesAsExcel = () => {
    const itemsWithNotes = filteredData.filter(item => item.Notes && item.Notes.trim() !== '');
    
    if (itemsWithNotes.length === 0) {
      alert('No notes found to download');
      return;
    }

    // Prepare data for Excel export
    const excelData = itemsWithNotes.map(item => ({
      VFID: item.VFID,
      Location: item.Location || 'Unassigned',
      ProductName: item.ProductName,
      Note: item.Notes || ''
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 12 }, // VFID
      { wch: 15 }, // Location
      { wch: 25 }, // ProductName
      { wch: 40 }  // Note
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Notes Summary');

    // Generate filename with current date
    const filename = `inventory-notes-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Download the Excel file
    XLSX.writeFile(workbook, filename);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadFile(file);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Data</h2>
          <p className="text-gray-600">Processing your file...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-red-600 text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Loading Error</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={loadData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Try Loading Again
          </button>
        </div>
      </div>
    );
  }

  // Show location-filtered view
  if (selectedLocations.length > 0) {
    const checkedCount = searchedData.filter(item => item.Checked).length;
    const totalCount = searchedData.length;
    const remainingCount = totalCount - checkedCount;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-fedshi-purple/10 font-inter">
        <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-200">
          <div className="px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <button
                  onClick={handleClearLocationFilter}
                  className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-fedshi-purple transition-all duration-200 hover:bg-fedshi-purple/5 px-2 sm:px-3 py-2 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-semibold text-sm sm:text-lg hidden sm:inline">Back to Dashboard</span>
                  <span className="font-semibold text-sm sm:hidden">Back</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <StatisticsBar checkedCount={checkedCount} totalCount={totalCount} remainingCount={remainingCount} />
          <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          <InventoryTable 
            data={searchedData} 
            loading={loading} 
            error={error} 
            onLocalNoteUpdate={updateLocalNote}
            onLocalCheckedUpdate={updateLocalChecked}
          />
        </div>
      </div>
    );
  }

  // Show main dashboard
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-fedshi-purple/10 font-inter">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-fedshi-purple to-fedshi-purple-dark rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Picklist APP
            </h1>
            <p className="text-sm sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            
            </p>
            <div className="mt-4 sm:mt-6 inline-flex items-center px-3 sm:px-4 py-2 bg-green-100 rounded-full">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-green-700 font-semibold text-xs sm:text-sm">
                {data.length > 0 ? `${data.length} items loaded (stored locally)` : 'No data loaded'}
              </span>
            </div>
          </div>

          {/* Upload File Button */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center">
              <button
                onClick={handleFileUpload}
                disabled={loading}
                className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload File"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-xs sm:text-sm text-gray-600 space-y-1 mt-4">
              <p><strong>Auto-refresh:</strong> </p>
              <p><strong>Upload:</strong> </p>
                {error && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">Connection Issue:</p>
                    <p className="text-red-600 text-xs mt-1">{error}</p>
                    <p className="text-red-500 text-xs mt-2">
                      <strong>Troubleshooting:</strong> Ensure the Google Apps Script is deployed as a web app with "Anyone" access permissions.
                    </p>
                  </div>
                )}
            </div>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Total Orders Count Display */}
          <div className="bg-gradient-to-r from-fedshi-purple to-fedshi-purple-dark rounded-2xl shadow-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-white text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              <h2 className="text-lg sm:text-xl font-semibold">عدد الاوردرات </h2>
            </div>
            <div className="text-3xl sm:text-5xl font-bold">
              {totalOrdersCount.toLocaleString()}
            </div>
            <p className="text-sm sm:text-base text-white/80 mt-2"></p>
          </div>

          {/* Global Dashboard */}
          <GlobalDashboard data={data} />

          {/* Filter Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 max-w-7xl mx-auto mb-8 sm:mb-16">
            <FilterButton
              filterType="A1-A6"
              title="A1-A6 Locations"
              description="Items in locations A1 through A6"
              icon={<MapPin className="w-6 h-6 text-fedshi-purple" />}
              itemCount={a1a6Count}
            />
            
            <FilterButton
              filterType="A7-A12"
              title="A7-A12 Locations"
              description="Items in locations A7 through A12"
              icon={<Warehouse className="w-6 h-6 text-fedshi-purple" />}
              itemCount={a7a12Count}
            />
            
            <FilterButton
              filterType="B-AG"
              title="B/AG Locations"
              description="Items in B and AG locations"
              icon={<Package className="w-6 h-6 text-fedshi-purple" />}
              itemCount={bagCount}
            />
            
            <FilterButton
              filterType="location-filter"
              title="Choose Location"
              description="Select specific locations to filter"
              icon={<MapPin className="w-6 h-6 text-purple-600" />}
              itemCount={data.length}
              isSpecial={true}
              onClick={() => setShowLocationFilter(true)}
            />
            
            <FilterButton
              filterType="remaining-items"
              title="Remaining Items"
              description="View unchecked items only"
              icon={<RotateCcw className="w-6 h-6 text-orange-600" />}
              itemCount={remainingCount}
              isSpecial={true}
              specialRoute="/remaining-items"
            />
          </div>

          {/* Download Notes Button */}
          <div className="text-center mb-8 sm:mb-12">
            <button
              onClick={downloadNotesAsExcel}
              disabled={data.length === 0}
              className="inline-flex items-center space-x-2 sm:space-x-3 px-6 sm:px-8 py-3 sm:py-4 bg-fedshi-purple text-white font-semibold rounded-xl hover:bg-fedshi-purple-dark transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Download Notes as Excel</span>
            </button>
          </div>

          {/* Global Notes Table */}
          <GlobalNotesTable data={data} />

          {/* Location Filter Modal */}
          {showLocationFilter && (
            <LocationFilter 
              data={data} 
              selectedLocations={selectedLocations}
              onLocationFilter={handleLocationFilter}
              onClose={() => setShowLocationFilter(false)}
            />
          )}
        </div>
      </div>
    </>
  );
}