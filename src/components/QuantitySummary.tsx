import React from 'react';
import { ShoppingCart } from 'lucide-react';

interface QuantitySummaryProps {
  data: any[];
}

const QuantitySummary: React.FC<QuantitySummaryProps> = ({ data }) => {
  const totalOrdersCount = data.reduce((sum, item) => sum + (item.OrdersCount || 0), 0);

  return (
    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg border border-purple-200 p-4 sm:p-6 mb-6 sm:mb-8 text-white">
      <div className="flex items-center justify-center space-x-3 sm:space-x-4">
        <div className="p-2 sm:p-3 bg-white/20 rounded-full">
          <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="text-center">
          <p className="text-sm sm:text-base font-medium text-purple-100 mb-1">Orders Quantity </p>
          <p className="text-2xl sm:text-4xl font-bold text-white">
            {totalOrdersCount.toLocaleString()}
          </p>
          <p className="text-xs sm:text-sm text-purple-200 mt-1">
            Sum of all orders in current view
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuantitySummary;