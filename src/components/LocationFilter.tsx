import React, { useState, useEffect } from 'react';
import { MapPin, Check, X } from 'lucide-react';

interface LocationFilterProps {
  data: any[];
  onLocationFilter: (selectedLocations: string[]) => void;
  selectedLocations: string[];
  onClose: () => void;
}

const LocationFilter: React.FC<LocationFilterProps> = ({ 
  data, 
  onLocationFilter, 
  selectedLocations,
  onClose
}) => {
  const [tempSelectedLocations, setTempSelectedLocations] = useState<string[]>(selectedLocations);

  useEffect(() => {
    setTempSelectedLocations(selectedLocations);
  }, [selectedLocations]);

  // Extract unique base locations with precise matching
  const getUniqueBaseLocations = () => {
    const allLocations = data
      .map(item => item.Location?.trim())
      .filter(location => location && location !== '');

    const baseLocations = new Set<string>();
    
    allLocations.forEach(location => {
      const upperLocation = location.toUpperCase();
      
      // Match A followed by digits to get base location (e.g., A4R1 -> A4, A10L1 -> A10)
      const aMatch = upperLocation.match(/^A(\d+)/);
      if (aMatch) {
        baseLocations.add(`A${aMatch[1]}`);
        return;
      }
      
      // Match B followed by optional digits (e.g., B5R1 -> B5, B -> B)
      const bMatch = upperLocation.match(/^B(\d*)/);
      if (bMatch) {
        baseLocations.add(bMatch[1] ? `B${bMatch[1]}` : 'B');
        return;
      }
      
      // Match AG locations (e.g., AG-001 -> AG)
      if (upperLocation.startsWith('AG')) {
        baseLocations.add('AG');
        return;
      }
    });

    return Array.from(baseLocations).sort((a, b) => {
      // Sort numerically: A1, A2, A10, A11, then B locations, then AG
      const aMatchA = a.match(/^A(\d+)/);
      const aMatchB = b.match(/^A(\d+)/);
      
      if (aMatchA && aMatchB) {
        return parseInt(aMatchA[1]) - parseInt(aMatchB[1]);
      }
      if (aMatchA && !aMatchB) return -1;
      if (!aMatchA && aMatchB) return 1;
      
      // For B locations, sort numerically too
      const bMatchA = a.match(/^B(\d+)/);
      const bMatchB = b.match(/^B(\d+)/);
      
      if (bMatchA && bMatchB) {
        return parseInt(bMatchA[1]) - parseInt(bMatchB[1]);
      }
      
      return a.localeCompare(b);
    });
  };

  const uniqueBaseLocations = getUniqueBaseLocations();

  const handleLocationToggle = (baseLocation: string) => {
    setTempSelectedLocations(prev => 
      prev.includes(baseLocation)
        ? prev.filter(loc => loc !== baseLocation)
        : [...prev, baseLocation]
    );
  };

  const handleSelectAll = () => {
    setTempSelectedLocations(
      tempSelectedLocations.length === uniqueBaseLocations.length 
        ? [] 
        : [...uniqueBaseLocations]
    );
  };

  const handleApplyFilter = () => {
    // Filter items based on selected base locations
    const matchingLocations: string[] = [];
    
    if (tempSelectedLocations.length === 0) {
      onLocationFilter([]);
    } else {
      data.forEach(item => {
        const location = item.Location?.trim();
        if (!location) return;
        
        const upperLocation = location.toUpperCase();
        
        tempSelectedLocations.forEach(baseLocation => {
          const upperBase = baseLocation.toUpperCase();
          
          if (upperBase.startsWith('A')) {
            // Match A locations: A4 should match A4, A4R1, A4L2, etc.
            const baseNum = upperBase.substring(1);
            if (upperLocation.startsWith(`A${baseNum}`)) {
              matchingLocations.push(location);
            }
          } else if (upperBase.startsWith('B')) {
            // Match B locations: B5 should match B5, B5R1, etc.
            if (upperBase === 'B') {
              if (upperLocation.startsWith('B')) {
                matchingLocations.push(location);
              }
            } else {
              const baseNum = upperBase.substring(1);
              if (upperLocation.startsWith(`B${baseNum}`)) {
                matchingLocations.push(location);
              }
            }
          } else if (upperBase === 'AG') {
            // Match AG locations: AG should match AG, AG-001, etc.
            if (upperLocation.startsWith('AG')) {
              matchingLocations.push(location);
            }
          }
        });
      });
      
      onLocationFilter([...new Set(matchingLocations)]);
    }
    
    onClose();
  };

  const handleClearFilter = () => {
    setTempSelectedLocations([]);
  };

  const handleClose = () => {
    setTempSelectedLocations(selectedLocations);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Select Base Locations</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Control Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              {tempSelectedLocations.length === uniqueBaseLocations.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={handleClearFilter}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Selection
            </button>
          </div>

          {/* Base Locations Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
            {uniqueBaseLocations.map(baseLocation => (
              <label
                key={baseLocation}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  tempSelectedLocations.includes(baseLocation)
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={tempSelectedLocations.includes(baseLocation)}
                  onChange={() => handleLocationToggle(baseLocation)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mr-2"
                />
                <span className={`text-sm font-bold ${
                  tempSelectedLocations.includes(baseLocation) ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {baseLocation}
                </span>
              </label>
            ))}
          </div>

          {/* Selection Summary */}
          <div className="text-sm text-gray-600 mb-4">
            {tempSelectedLocations.length > 0 ? (
              <span>
                <strong>{tempSelectedLocations.length}</strong> base location{tempSelectedLocations.length !== 1 ? 's' : ''} selected
              </span>
            ) : (
              <span>No locations selected - all items will be shown</span>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyFilter}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Check className="w-4 h-4" />
            <span>Apply Filter</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationFilter;