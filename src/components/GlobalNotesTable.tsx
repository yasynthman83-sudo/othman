import React from 'react';
import { Download, FileText, ExternalLink, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { InventoryItem, FilterType } from '../types/inventory';
import { filterInventoryData } from '../utils/filterUtils';

interface GlobalNotesTableProps {
  data: InventoryItem[];
}

const GlobalNotesTable: React.FC<GlobalNotesTableProps> = ({ data }) => {
  const navigate = useNavigate();
  const itemsWithNotes = data.filter(item => item.Notes && item.Notes.trim() !== '');

  const downloadAsExcel = () => {
    if (itemsWithNotes.length === 0) return;

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
    const filename = `notes-summary-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Download the Excel file
    XLSX.writeFile(workbook, filename);
  };

  const getFilterTypeForLocation = (location: string): FilterType | null => {
    if (!location) return null;
    
    const upperLocation = location.toUpperCase();
    
    if (upperLocation.startsWith('A')) {
      const match = upperLocation.match(/^A(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= 1 && num <= 6) return 'A1-A6';
        if (num >= 7 && num <= 12) return 'A7-A12';
      }
    }
    
    if (upperLocation.startsWith('B') || upperLocation === 'AG') {
      return 'B-AG';
    }
    
    return null;
  };

  const handleRowClick = (item: InventoryItem) => {
    const filterType = getFilterTypeForLocation(item.Location);
    if (filterType) {
      navigate(`/inventory/${filterType}`, { 
        state: { highlightVFID: item.VFID } 
      });
    }
  };

  if (itemsWithNotes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Global Notes Summary</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No items with notes found</p>
          <p className="text-sm text-gray-400 mt-1">Add notes to items to see them here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-6 sm:mb-8">
      <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Global Notes Summary</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {itemsWithNotes.length} items
            </span>
          </div>
          {/* Download Notes Button - Only visible on main dashboard */}
          <button
            onClick={downloadAsExcel}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
            title="Download notes as Excel file"
          >
            <FileSpreadsheet className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Download Notes</span>
            <span className="sm:hidden">Notes</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                VFID
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Location
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                Product Name
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                Note
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {itemsWithNotes.map((item, index) => (
              <tr 
                key={item.VFID} 
                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors cursor-pointer`}
                onClick={() => handleRowClick(item)}
              >
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-700">
                  {item.VFID}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                  {item.Location || <span className="text-gray-400 italic">Unassigned</span>}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                  {item.ProductName}
                </td>
                <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-700 max-w-xs">
                  <div className="truncate" title={item.Notes}>
                    {item.Notes}
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GlobalNotesTable;