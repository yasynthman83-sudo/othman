import React, { useState, useEffect } from 'react';
import { Package, Box, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aqbpbptnfhbwlzuprbns.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYnBicHRuZmhid2x6dXByYm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDY0ODQsImV4cCI6MjA3NTEyMjQ4NH0.wwzhmTQvzBl1kp2hOnex1kLyoKpmsolC-oSpuk_K8x8';
const supabase = createClient(supabaseUrl, supabaseKey);

interface BoxRequirement {
  boxType: string;
  count: number;
  vfids: string[];
}

interface ItemNote {
  VFID: string;
  box_type: string;
}

interface BoxRequirementsProps {
  currentData: any[];
}

const BoxRequirements: React.FC<BoxRequirementsProps> = ({ currentData }) => {
  const [boxRequirements, setBoxRequirements] = useState<BoxRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    calculateBoxRequirements();
  }, [currentData]);

  const calculateBoxRequirements = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get item_notes data from database
      const { data: itemNotes, error: notesError } = await supabase
        .from('item_notes')
        .select('VFID, box_type');

      if (notesError) {
        throw new Error(`Failed to fetch item notes: ${notesError.message}`);
      }

      if (!itemNotes || itemNotes.length === 0) {
        setError('No item notes found in database');
        setLoading(false);
        return;
      }

      // Create a map of VFID to box_type
      const vfidToBoxType = new Map<string, string>();
      itemNotes.forEach((note: ItemNote) => {
        if (note.VFID && note.box_type) {
          vfidToBoxType.set(note.VFID, note.box_type);
        }
      });

      // Calculate box requirements based on current data
      const boxCounts = new Map<string, { count: number; vfids: string[] }>();

      currentData.forEach(item => {
        const vfid = item.VFID;
        const boxType = vfidToBoxType.get(vfid);

        if (boxType) {
          if (!boxCounts.has(boxType)) {
            boxCounts.set(boxType, { count: 0, vfids: [] });
          }
          
          const current = boxCounts.get(boxType)!;
          current.count += 1;
          current.vfids.push(vfid);
        }
      });

      // Convert to array format
      const requirements: BoxRequirement[] = Array.from(boxCounts.entries()).map(
        ([boxType, data]) => ({
          boxType,
          count: data.count,
          vfids: data.vfids
        })
      );

      // Sort by count (descending)
      requirements.sort((a, b) => b.count - a.count);

      setBoxRequirements(requirements);
    } catch (err: any) {
      setError(err.message);
      console.error('Error calculating box requirements:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalBoxes = () => {
    return boxRequirements.reduce((total, req) => total + req.count, 0);
  };

  const getBoxTypeColor = (boxType: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
    ];
    
    const hash = boxType.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-fedshi-purple animate-spin mr-3" />
          <span className="text-gray-600">Calculating box requirements...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-inter">Box Requirements</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={calculateBoxRequirements}
            className="mt-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 sm:p-3 bg-fedshi-purple/10 rounded-2xl">
            <Box className="w-4 h-4 sm:w-5 sm:h-5 text-fedshi-purple" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-inter">Box Requirements</h2>
        </div>
        <div className="flex items-center space-x-2 bg-fedshi-purple/10 px-3 py-2 rounded-lg">
          <Package className="w-4 h-4 text-fedshi-purple" />
          <span className="text-fedshi-purple font-bold text-sm">
            Total: {getTotalBoxes()} boxes
          </span>
        </div>
      </div>

      {boxRequirements.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Box className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No box requirements found</p>
          <p className="text-gray-400 text-sm mt-1">
            Make sure item_notes table has data for current VFIDs
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boxRequirements.map((requirement, index) => (
            <div
              key={requirement.boxType}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getBoxTypeColor(
                    requirement.boxType
                  )}`}
                >
                  {requirement.boxType}
                </span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {requirement.count}
                  </div>
                  <div className="text-xs text-gray-500">boxes</div>
                </div>
              </div>
              
              <div className="text-xs text-gray-600">
                <div className="font-medium mb-1">VFIDs ({requirement.vfids.length}):</div>
                <div className="max-h-20 overflow-y-auto">
                  {requirement.vfids.slice(0, 5).map((vfid, idx) => (
                    <span key={vfid} className="inline-block mr-1 mb-1">
                      <span className="bg-white px-2 py-1 rounded text-xs font-mono">
                        {vfid}
                      </span>
                      {idx < Math.min(4, requirement.vfids.length - 1) && ', '}
                    </span>
                  ))}
                  {requirement.vfids.length > 5 && (
                    <span className="text-gray-400 text-xs">
                      +{requirement.vfids.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Based on {currentData.length} items in current data</span>
          <button
            onClick={calculateBoxRequirements}
            className="flex items-center space-x-1 text-fedshi-purple hover:text-fedshi-purple-dark transition-colors"
          >
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoxRequirements;