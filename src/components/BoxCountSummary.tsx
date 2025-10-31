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
  refreshTrigger?: number; // Used to trigger refresh when new data is uploaded
}

const BoxCountSummary: React.FC<BoxCountSummaryProps> = ({ refreshTrigger }) => {
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
    fetchBoxCounts();
  }, [refreshTrigger]);

  const fetchBoxCounts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Execute the JOIN query to get box counts directly from database
      const { data: queryResult, error: queryError } = await supabase
        .rpc('get_box_counts');

      if (queryError) {
        // If RPC doesn't exist, fall back to manual query
        console.warn('RPC not found, using manual query:', queryError.message);
        await fetchBoxCountsManual();
        return;
      }

      if (!queryResult) {
        throw new Error('No data returned from box counts query');
      }

      // Process the query results
      const countsMap = new Map<string, number>();
      
      // Initialize all box types with 0
      boxTypes.forEach(box => countsMap.set(box.type.toLowerCase(), 0));

      // Update counts from query results
      queryResult.forEach((row: any) => {
        const boxType = row.box_type?.toLowerCase() || '';
        const count = parseInt(row.total_count) || 0;

        // Map note_content to box types
        if (boxType.includes('bubble')) countsMap.set('bubble', count);
        else if (boxType.includes('big')) countsMap.set('big', count);
        else if (boxType.includes('small')) countsMap.set('small', count);
        else if (boxType.includes('bag')) countsMap.set('bag', count);
        else if (boxType.includes('large')) countsMap.set('large', count);
        else if (boxType.includes('medium')) countsMap.set('medium', count);
      });

      // Create box count objects with colors and icons
      const boxCountsArray: BoxCount[] = boxTypes.map(boxType => ({
        type: boxType.type,
        count: countsMap.get(boxType.type.toLowerCase()) || 0,
        color: boxType.color,
        icon: boxType.icon
      }));

      setBoxCounts(boxCountsArray);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching box counts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoxCountsManual = async () => {
    try {
      // Manual JOIN query as fallback
      const { data: joinResult, error: joinError } = await supabase
        .from('Picklist')
        .select(`
          VFID,
          item_notes!inner(
            vfid,
            note_content
          )
        `);

      if (joinError) {
        throw new Error(`Failed to join tables: ${joinError.message}`);
      }

      if (!joinResult || joinResult.length === 0) {
        // Initialize all counts to 0 if no data
        const boxCountsArray: BoxCount[] = boxTypes.map(boxType => ({
          type: boxType.type,
          count: 0,
          color: boxType.color,
          icon: boxType.icon
        }));
        setBoxCounts(boxCountsArray);
        return;
      }

      // Count box types from joined data
      const countsMap = new Map<string, number>();
      boxTypes.forEach(box => countsMap.set(box.type.toLowerCase(), 0));

      joinResult.forEach((item: any) => {
        const noteContent = item.item_notes?.note_content?.toLowerCase() || '';
        
        // Map note_content to box types
        if (noteContent.includes('bubble')) {
          countsMap.set('bubble', (countsMap.get('bubble') || 0) + 1);
        } else if (noteContent.includes('big')) {
          countsMap.set('big', (countsMap.get('big') || 0) + 1);
        } else if (noteContent.includes('small')) {
          countsMap.set('small', (countsMap.get('small') || 0) + 1);
        } else if (noteContent.includes('bag')) {
          countsMap.set('bag', (countsMap.get('bag') || 0) + 1);
        } else if (noteContent.includes('large')) {
          countsMap.set('large', (countsMap.get('large') || 0) + 1);
        } else if (noteContent.includes('medium')) {
          countsMap.set('medium', (countsMap.get('medium') || 0) + 1);
        }
      });

      // Create box count objects with colors and icons
      const boxCountsArray: BoxCount[] = boxTypes.map(boxType => ({
        type: boxType.type,
        count: countsMap.get(boxType.type.toLowerCase()) || 0,
        color: boxType.color,
        icon: boxType.icon
      }));

      setBoxCounts(boxCountsArray);
    } catch (err: any) {
      throw new Error(`Manual query failed: ${err.message}`);
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
          <span className="text-gray-600">Loading box counts from database...</span>
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
            onClick={fetchBoxCounts}
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
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-fedshi-purple/10 px-3 py-2 rounded-lg">
            <Package className="w-4 h-4 text-fedshi-purple" />
            <span className="text-fedshi-purple font-bold text-sm">
              Total: {getTotalBoxes()} boxes
            </span>
          </div>
          <button
            onClick={fetchBoxCounts}
            className="flex items-center space-x-1 text-fedshi-purple hover:text-fedshi-purple-dark transition-colors px-3 py-2 rounded-lg hover:bg-fedshi-purple/5"
            title="Refresh box counts"
          >
            <span className="text-sm">Refresh</span>
          </button>
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
          <span>Data fetched directly from Picklist ⋈ item_notes tables</span>
          <span className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BoxCountSummary;