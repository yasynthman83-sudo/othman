import React, { useState } from 'react';
import { MapPin, Check, X } from 'lucide-react';

interface LocationFilterProps {
  data: any[];
  onLocationFilter: (selectedLocations: string[]) => void;
  selectedLocations: string[];
}

const LocationFilter: React.FC<LocationFilterProps> = ({ 
  data, 
  onLocationFilter, 
  selectedLocations 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSelectedLocations, setTempSelectedLocations] = useState<string[]>(selectedLocations);

  // Extract unique base locations with precise matching
  const getUniqueBaseLocations = () => {
    const allLocations = data
      .map(item => item.Location?.trim())
      .filter(location => location && location !== '');

    const baseLocations = new Set<string>();
    
    allLocations.forEach(location => {
      const upperLocation = location.toUpperCase();
      
      // Match patterns like A1, A2, etc. (not A10, A11)
      const aMatch = upperLocation.match(/^A(\d+)(?![0-9])/);
      if (aMatch) {
        baseLocations.add(`A${aMatch[1]}`);
        return;
      }
      
      // Match B locations
      const bMatch = upperLocation.match(/^B(\d*)/);
      if (bMatch) {
        baseLocations.add(bMatch[1] ? `B${bMatch[1]}` : 'B');
        return;
      }
      
      // Match AG locations
      if (upperLocation.startsWith('AG')) {
        baseLocations.add('AG');
        return;
      }
    });

    return Array.from(baseLocations).sort((a, b) => {
      // Sort A1, A2, ... A9, then B locations, then AG
      const aMatchA = a.match(/^A(\d+)/);
      const aMatchB = b.match(/^A(\d+)/);
      
      if (aMatchA && aMatchB) {
        return parseInt(aMatchA[1]) - parseInt(aMatchB[1]);
      }
      if (aMatchA && !aMatchB) return -1;
      if (!aMatchA && aMatchB) return 1;
      
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
    // Convert base locations to actual location matches
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
            // Precise matching for A locations
            const baseNum = upperBase.substring(1);
            const regex = new RegExp(`^A${baseNum}(?![0-9])`, 'i');
            if (regex.test(upperLocation)) {
              matchingLocations.push(location);
            }
          } else if (upperBase.startsWith('B')) {
            // B location matching
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
            // AG location matching
            if (upperLocation.startsWith('AG')) {
              matchingLocations.push(location);
            }
          }
        });
      });
      
      onLocationFilter([...new Set(matchingLocations)]);
    }
    
    setIsModalOpen(false);
  };

  const handleClearFilter = () => {
    setTempSelectedLocations([]);
  };

  const openModal = () => {
    setTempSelectedLocations(selectedLocations);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTempSelectedLocations(selectedLocations);
  };

  return (
    <>
      {/* Location Filter Button */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Location Filter</h3>
            {selectedLocations.length > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {selectedLocations.length} selected
              </span>
            )}
          </div>
          
          <button
            onClick={openModal}
            className="flex items-center space-x-1 sm:space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Choose Location</span>
          </button>
        </div>
        
        {selectedLocations.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Active Filter:</strong> Showing items from {selectedLocations.join(', ')}
            </p>
            <button
              onClick={() => onLocationFilter([])}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Select Base Locations</h3>
              </div>
              <button
                onClick={closeModal}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                {uniqueBaseLocations.map(baseLocation => (
                  <label
                    key={baseLocation}
                    className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      tempSelectedLocations.includes(baseLocation)
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={tempSelectedLocations.includes(baseLocation)}
                      onChange={() => handleLocationToggle(baseLocation)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className={`text-sm font-medium ${
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
                onClick={closeModal}
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
      )}
    </>
  );
};

export default LocationFilter;