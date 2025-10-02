import React, { useState, useEffect } from "react";
import { useInventoryData } from "../hooks/useInventoryData";
import LocationFilter from "../components/LocationFilter";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function LocationFilterPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useInventoryData();
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const handleLocationFilter = (locations: string[]) => {
    setSelectedLocations(locations);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Location Filter</h1>
          
          {loading && (
            <div className="text-center py-8">
              <div className="text-gray-600">Loading data...</div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-red-600">Error: {error}</div>
            </div>
          )}

          {data && data.length > 0 && (
            <LocationFilter 
              data={data} 
              selectedLocations={selectedLocations}
              onLocationFilter={handleLocationFilter}
            />
          )}

          {data && data.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-600">No data available. Please load data first.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LocationFilterPage;