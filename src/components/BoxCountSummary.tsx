import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2, Package } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aqbpbptnfhbwlzuprbns.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYnBicHRuZmhid2x6dXByYm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDY0ODQsImV4cCI6MjA3NTEyMjQ4NH0.wwzhmTQvzBl1kp2hOnex1kLyoKpmsolC-oSpuk_K8x8';
const supabase = createClient(supabaseUrl, supabaseKey);

interface BoxCountSummaryProps {
  refreshTrigger?: number;
}

interface BoxCount {
  type: string;
  count: number;
  emoji: string;
  color: string;
}

const BoxCountSummary: React.FC<BoxCountSummaryProps> = ({ refreshTrigger = 0 }) => {
  const [boxCounts, setBoxCounts] = useState<BoxCount[]>([
    { type: 'Bubble', count: 0, emoji: '🫧', color: 'bg-pink-100 text-pink-800' },
    { type: 'Big', count: 0, emoji: '📦', color: 'bg-blue-100 text-blue-800' },
    { type: 'Small', count: 0, emoji: '📋', color: 'bg-green-100 text-green-800' },
    { type: 'Bag', count: 0, emoji: '🛍️', color: 'bg-purple-100 text-purple-800' },
    { type: 'Large', count: 0, emoji: '📊', color: 'bg-orange-100 text-orange-800' },
    { type: 'Medium', count: 0, emoji: '📄', color: 'bg-yellow-100 text-yellow-800' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBoxCounts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Query to join Picklist with item_notes and get box counts
      const { data, error: queryError } = await supabase
        .from('Picklist')
        .select(`
          VFID,
          item_notes!inner(
            vfid,
            note_content
          )
        `);

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Process the data to count box types
      const counts: Record<string, number> = {
        bubble: 0,
        big: 0,
        small: 0,
        bag: 0,
        large: 0,
        medium: 0,
      };

      data?.forEach(item => {
        const noteContent = item.item_notes?.note_content?.toLowerCase() || '';
        
        if (noteContent.includes('bubble')) counts.bubble++;
        else if (noteContent.includes('big')) counts.big++;
        else if (noteContent.includes('small')) counts.small++;
        else if (noteContent.includes('bag')) counts.bag++;
        else if (noteContent.includes('large')) counts.large++;
        else if (noteContent.includes('medium')) counts.medium++;
      });

      // Update box counts
      setBoxCounts(prev => prev.map(box => ({
        ...box,
        count: counts[box.type.toLowerCase()] || 0
      })));

      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch box counts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoxCounts();
  }, [refreshTrigger]);

  const totalBoxes = boxCounts.reduce((sum, box) => sum + box.count, 0);

  const handleRefresh = () => {
    fetchBoxCounts();
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Package className="w-5 h-5 sm:w-6 sm:h-6 text-fedshi-purple" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-inter">
            Box Count Summary
          </h2>
          <span className="px-2 py-1 bg-fedshi-purple/10 text-fedshi-purple text-xs font-medium rounded-full">
            {totalBoxes} total
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 bg-fedshi-yellow text-fedshi-purple rounded-xl hover:bg-fedshi-yellow-dark transition-all duration-200 disabled:opacity-50"
          title="Refresh Box Counts"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm font-medium">Error loading box counts:</p>
          <p className="text-red-600 text-xs mt-1">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {boxCounts.map((box) => (
          <div
            key={box.type}
            className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center hover:shadow-md transition-all duration-200 hover:-translate-y-1"
          >
            <div className="text-2xl sm:text-3xl mb-2">{box.emoji}</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              {box.count}
            </div>
            <div className={`text-xs sm:text-sm font-medium px-2 py-1 rounded-full ${box.color}`}>
              {box.type}
            </div>
          </div>
        ))}
      </div>

      {lastUpdated && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default BoxCountSummary;