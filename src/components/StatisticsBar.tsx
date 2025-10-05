import React from 'react';
import { CheckCircle, Package, RotateCcw } from 'lucide-react';

interface StatisticsBarProps {
  checkedCount: number;
  totalCount: number;
  remainingCount: number;
}

const StatisticsBar: React.FC<StatisticsBarProps> = ({ 
  checkedCount, 
  totalCount, 
  remainingCount 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-green-100 rounded-full">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 font-inter">Checked Items</p>
            <p className="text-lg sm:text-2xl font-bold text-green-600 font-inter">{checkedCount}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-fedshrim-purple/10 rounded-2xl">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-fedshrim-purple" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 font-inter">Total Items</p>
            <p className="text-lg sm:text-2xl font-bold text-fedshrim-purple font-inter">{totalCount}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-orange-100 rounded-full">
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 font-inter">Remaining</p>
            <p className="text-lg sm:text-2xl font-bold text-orange-600 font-inter">{remainingCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsBar;