import React from 'react';
import { CheckCircle, Package, RotateCcw } from 'lucide-react';
import { InventoryItem } from '../types/inventory';

interface GlobalDashboardProps {
  data: InventoryItem[];
}

const GlobalDashboard: React.FC<GlobalDashboardProps> = ({ data }) => {
  const totalItems = data.length;
  const checkedItems = data.filter(item => item.Checked).length;
  const remainingItems = totalItems - checkedItems;

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 text-center font-inter"> Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-fedshi-purple/10 rounded-2xl">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-fedshi-purple" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 font-inter">Total SKU</p>
            <p className="text-lg sm:text-2xl font-bold text-fedshi-purple font-inter">{totalItems}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-green-100 rounded-full">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 font-inter">picked Items</p>
            <p className="text-lg sm:text-2xl font-bold text-green-600 font-inter">{checkedItems}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-orange-100 rounded-full">
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 font-inter">Remaining Items</p>
            <p className="text-lg sm:text-2xl font-bold text-orange-600 font-inter">{remainingItems}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalDashboard;