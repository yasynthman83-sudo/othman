import React, { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { InventoryItem } from '../types/inventory';

interface InventoryTableProps {
  data: InventoryItem[];
  loading?: boolean;
  error?: string | null;
  onDataUpdate?: () => void;
  onLocalNoteUpdate?: (vfid: string, note: string) => void;
  onLocalCheckedUpdate?: (vfid: string, checked: boolean) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ data, loading, error, onDataUpdate, onLocalNoteUpdate, onLocalCheckedUpdate }) => {
  const [savingNotes, setSavingNotes] = useState<Set<string>>(new Set());
  const [savingChecked, setSavingChecked] = useState<Set<string>>(new Set());
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  // Initialize local notes from data
  React.useEffect(() => {
    const initialNotes: Record<string, string> = {};
    data.forEach(item => {
      if (item.Notes) {
        initialNotes[item.VFID] = item.Notes;
      }
    });
    setLocalNotes(prev => ({ ...initialNotes, ...prev }));
  }, [data]);

  const handleCheckboxChange = async (vfid: string, checked: boolean) => {
    // Instant optimistic update - update UI immediately
    if (onLocalCheckedUpdate) {
      onLocalCheckedUpdate(vfid, checked);
    }

    // No need to save to external service - data is stored locally
  };

  const handleNotesInputChange = (vfid: string, value: string) => {
    // Update local state immediately for responsive UI
    setLocalNotes(prev => ({ ...prev, [vfid]: value }));
    
    // Update parent component state for immediate UI feedback
    if (onLocalNoteUpdate) {
      onLocalNoteUpdate(vfid, value);
    }
  };

  const handleNotesBlur = (vfid: string, value: string) => {
    // Update local state only
    const trimmedNotes = value.trim();
    setLocalNotes(prev => ({ ...prev, [vfid]: trimmedNotes }));
    if (onLocalNoteUpdate) {
      onLocalNoteUpdate(vfid, trimmedNotes);
    }
  };

  const handleNotesKeyPress = (e: React.KeyboardEvent, vfid: string, value: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Update local state and blur the field
      const trimmedNotes = value.trim();
      setLocalNotes(prev => ({ ...prev, [vfid]: trimmedNotes }));
      if (onLocalNoteUpdate) {
        onLocalNoteUpdate(vfid, trimmedNotes);
      }
      (e.target as HTMLTextAreaElement).blur();
    }
  };

  // Get all numeric columns dynamically (excluding the main columns)
  const getNumericColumns = () => {
    if (data.length === 0) return [];
    const firstItem = data[0];
    return Object.keys(firstItem)
      .filter(key => !['ProductName', 'Location', 'VFID', 'Quantity', 'OrdersCount', 'SkuNumber', 'Notes', 'Checked'].includes(key))
      .filter(key => typeof firstItem[key] === 'number')
      .sort((a, b) => parseInt(a) - parseInt(b));
  };

  const numericColumns = getNumericColumns();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">📦</span>
          </div>
          <p className="text-gray-500 text-lg">لا توجد عناصر مطابقة للبحث أو الفلتر</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 mb-8 w-full max-w-full">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="bg-gradient-to-r from-fedshi-purple to-fedshi-purple-dark text-white sticky top-0 z-20 shadow-2xl">
            <tr>
              <th className="px-2 sm:px-4 py-3 sm:py-4 text-left font-bold text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap min-w-[80px]">Checked</th>
              <th className="px-2 sm:px-4 py-3 sm:py-4 text-left font-bold text-xs sm:text-sm uppercase tracking-wider min-w-[150px] font-inter">Product Name</th>
              <th className="px-2 sm:px-4 py-3 sm:py-4 text-left font-bold text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap min-w-[140px] bg-fedshi-purple-dark font-inter">Location</th>
              <th className="px-2 sm:px-4 py-3 sm:py-4 text-left font-bold text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap min-w-[160px] font-inter">VFID</th>
              <th className="px-2 sm:px-4 py-3 sm:py-4 text-left font-bold text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap min-w-[100px] font-inter">Quantity</th>
              <th className="px-2 sm:px-4 py-3 sm:py-4 text-left font-bold text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap min-w-[120px] font-inter">SKU Number</th>
              <th className="px-2 sm:px-4 py-3 sm:py-4 text-left font-bold text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap min-w-[80px] font-inter">1</th>
              <th className="px-2 sm:px-4 py-3 sm:py-4 text-left font-bold text-xs sm:text-sm uppercase tracking-wider min-w-[200px] font-inter">Notes</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const isChecked = item.Checked || false;
              const isSavingNote = savingNotes.has(item.VFID);
              const isSavingCheck = savingChecked.has(item.VFID);
              const currentNote = localNotes[item.VFID] ?? item.Notes ?? '';
              
              return (
                <tr
                  key={item.VFID}
                  className={`border-b border-gray-100 transition-all duration-200 hover:bg-fedshi-purple/5 hover:shadow-sm ${
                    isChecked ? 'bg-green-100 shadow-sm' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="px-2 sm:px-4 py-3 sm:py-4 relative">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleCheckboxChange(item.VFID, e.target.checked)}
                        disabled={false}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-fedshi-purple bg-gray-100 border-gray-300 rounded-lg focus:ring-fedshi-purple focus:ring-2 transition-all duration-200 cursor-pointer hover:scale-110 hover:shadow-lg"
                      />
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 font-semibold text-gray-900 text-xs sm:text-sm font-inter">{item.ProductName}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-gray-900 text-base sm:text-lg font-bold bg-fedshi-purple/5 border-l-2 border-fedshi-purple/20 font-inter">
                    {item.Location || <span className="text-gray-400 italic font-normal">Unassigned</span>}
                  </td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-gray-900 font-mono text-sm sm:text-lg font-bold">{item.VFID}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-gray-900 font-bold text-xs sm:text-sm font-inter">{item.Quantity}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-gray-700 font-mono text-xs sm:text-sm font-inter">{item.SkuNumber}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-gray-700 text-xs sm:text-sm font-inter">{item["1"] || 0}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4">
                    <div className="relative min-w-[200px] sm:min-w-[250px]">
                      <textarea
                        value={currentNote}
                        onChange={(e) => handleNotesInputChange(item.VFID, e.target.value)}
                        onBlur={(e) => handleNotesBlur(item.VFID, e.target.value)}
                        onKeyPress={(e) => handleNotesKeyPress(e, item.VFID, currentNote)}
                        className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-fedshi-purple focus:border-fedshi-purple resize-none transition-all duration-200 hover:border-gray-400 mobile-input font-inter"
                        rows={2}
                        placeholder="Add notes..."
                        disabled={false}
                      />
                      <div className="absolute top-1 right-1 flex items-center space-x-1">
                        {currentNote && (
                          <div className="bg-green-100 px-2 py-1 rounded shadow-sm">
                            <Save className="w-2 h-2 sm:w-3 sm:h-3 text-green-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;