import React, { useState, useEffect } from 'react';
import { Package, Box, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aqbpbptnfhbwlzuprbns.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYnBicHRuZmhid2x6dXByYm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDY0ODQsImV4cCI6MjA3NTEyMjQ4NH0.wwzhmTQvzBl1kp2hOnex1kLyoKpmsolC-oSpuk_K8x8';
const supabase = createClient(supabaseUrl, supabaseKey);

interface BoxCount {
  type: string;
  count: number;
  color: string;
  icon: string;
}

interface BoxCountSummaryProps {
  picklistData: any[];
}

const BoxCountSummary: React.FC<BoxCountSummaryProps> = ({ picklistData }) => {
  const [boxCounts, setBoxCounts] = useState<BoxCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define the box types with their colors and icons
  const boxTypes = [
    { type: 'Bubble', color: 'bg-pink-100 text-pink-800 border-pink-200', icon: '🫧' },
    { type: 'Big', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '📦' },
    { type: 'Small', color: 'bg-green-100 text-green-800 border-green-200', icon: '📋' },
    { type: 'Bag', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🛍️' },
    { type: 'Large', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '📊' },
    { type: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '📄' }
  ];

  useEffect(() => {
    calculateBoxCounts();
  }, [picklistData]);

  const calculateBoxCounts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get item_notes data from database
      const { data: itemNotes, error: notesError } = await supabase
        .from('item_notes')
        .select('vfid, note_content');

      if (notesError) {
        throw new Error(`Failed to fetch item notes: ${notesError.message}`);
      }

      if (!itemNotes || itemNotes.length === 0) {
        setError('No item notes found in database');
        setLoading(false);
        return;
      }

      // Create a map of VFID to box type from note_content
      const vfidToBoxType = new Map<string, string>();
      itemNotes.forEach((note: any) => {
        if (note.vfid && note.note_content) {
          // Extract box type from note_content
          const noteContent = note.note_content.toLowerCase().trim();
          
          // Match box types in note_content (case insensitive)
          let boxType = '';
          if (noteContent.includes('bubble')) boxType = 'Bubble';
          else if (noteContent.includes('big')) boxType = 'Big';
          else if (noteContent.includes('small')) boxType = 'Small';
          else if (noteContent.includes('bag')) boxType = 'Bag';
          else if (noteContent.includes('large')) boxType = 'Large';
          else if (noteContent.includes('medium')) boxType = 'Medium';
          
          if (boxType) {
            vfidToBoxType.set(note.vfid, boxType);
          }
        }
      });

      // Initialize counts for all box types
      const counts = new Map<string, number>();
      boxTypes.forEach(box => counts.set(box.type, 0));

      // Count boxes based on current picklist data
      picklistData.forEach(item => {
        const vfid = item.VFID;
        const boxType = vfidToBoxType.get(vfid);
        
        if (boxType && counts.has(boxType)) {
          counts.set(boxType, counts.get(boxType)! + 1);
        }
      });

      // Create box count objects with colors and icons
      const boxCountsArray: BoxCount[] = boxTypes.map(boxType => ({
        type: boxType.type,
        count: counts.get(boxType.type) || 0,
        color: boxType.color,
        icon: boxType.icon
      }));

      setBoxCounts(boxCountsArray);
    } catch (err: any) {
      setError(err.message);
      console.error('Error calculating box counts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalBoxes = () => {
    return boxCounts.reduce((total, box) => total + box.count, 0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 sm:p-3 bg-fedshi-purple/10 rounded-2xl">
            <Box className="w-4 h-4 sm:w-5 sm:h-5 text-fedshi-purple" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-inter">Box Count Summary</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-fedshi-purple animate-spin mr-3" />
          <span className="text-gray-600">Calculating box counts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-inter">Box Count Summary</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={calculateBoxCounts}
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
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-inter">Box Count Summary</h2>
        </div>
        <div className="flex items-center space-x-2 bg-fedshi-purple/10 px-3 py-2 rounded-lg">
          <Package className="w-4 h-4 text-fedshi-purple" />
          <span className="text-fedshi-purple font-bold text-sm">
            Total: {getTotalBoxes()} boxes
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {boxCounts.map((box) => (
          <div
            key={box.type}
            className={`${box.color} rounded-xl p-4 border-2 hover:shadow-lg transition-all duration-200 text-center`}
          >
            <div className="text-2xl mb-2">{box.icon}</div>
            <div className="font-bold text-lg mb-1">{box.count}</div>
            <div className="text-sm font-medium">{box.type}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Based on {picklistData.length} items in Picklist table</span>
          <button
            onClick={calculateBoxCounts}
            className="flex items-center space-x-1 text-fedshi-purple hover:text-fedshi-purple-dark transition-colors"
          >
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoxCountSummary;