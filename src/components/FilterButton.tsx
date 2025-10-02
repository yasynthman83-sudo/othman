import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FilterType } from '../types/inventory';

interface FilterButtonProps {
  filterType: FilterType;
  title: string;
  description: string;
  icon: React.ReactNode;
  itemCount: number;
  isSpecial?: boolean;
  specialRoute?: string;
}

const FilterButton: React.FC<FilterButtonProps> = ({ 
  filterType, 
  title, 
  description, 
  icon, 
  itemCount,
  isSpecial = false,
  specialRoute
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (isSpecial && specialRoute) {
      navigate(specialRoute);
    } else {
      navigate(`/inventory/${filterType}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`group w-full bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 sm:hover:-translate-y-3 border border-gray-200 ${
        isSpecial 
          ? 'hover:border-fedshi-purple hover:bg-fedshi-purple/5' 
          : 'hover:border-fedshi-purple hover:bg-fedshi-purple/5'
      }`}
    >
      <div className="p-4 sm:p-10 text-center">
        <div className="flex justify-center mb-4">
          <div className={`p-2 sm:p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 ${
            isSpecial 
              ? 'bg-fedshi-purple/10 group-hover:bg-fedshi-purple/20' 
              : 'bg-fedshi-purple/10 group-hover:bg-fedshi-purple/20'
          }`}>
            {icon}
          </div>
        </div>
        
        <h3 className={`text-lg sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 transition-colors duration-300 font-inter ${
          isSpecial 
            ? 'group-hover:text-fedshi-purple' 
            : 'group-hover:text-fedshi-purple'
        }`}>
          {title}
        </h3>
        
        <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-lg leading-relaxed font-inter">
          {description}
        </p>
        
        <div className={`inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 rounded-2xl transition-colors duration-300 ${
          isSpecial 
            ? 'bg-fedshi-yellow/20 group-hover:bg-fedshi-yellow/30' 
            : 'bg-fedshi-yellow/20 group-hover:bg-fedshi-yellow/30'
        }`}>
          <span className={`font-bold text-sm sm:text-lg font-inter ${
            isSpecial ? 'text-fedshi-purple' : 'text-fedshi-purple'
          }`}>
            {itemCount} items
          </span>
        </div>
      </div>
    </button>
  );
};

export default FilterButton;