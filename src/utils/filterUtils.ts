import { InventoryItem, FilterType } from '../types/inventory';

// Extract numeric part from location string
const extractNumericPart = (location: string): number => {
  // Match A followed by digits, but ensure we get the full number
  const match = location.match(/^A(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
};

// Extract full numeric part for sorting (including B locations)
const extractSortingNumber = (location: string): number => {
  const aMatch = location.match(/^A(\d+)/i);
  if (aMatch) {
    return parseInt(aMatch[1], 10);
  }
  
  const bMatch = location.match(/^B(\d+)/i);
  if (bMatch) {
    return 100 + parseInt(bMatch[1], 10); // B locations come after A locations
  }
  
  return 999; // For AG and other locations
};

export const filterInventoryData = (data: InventoryItem[], filterType: FilterType): InventoryItem[] => {
  const filtered = data.filter(item => {
    const location = (item.Location || '').trim().toUpperCase();
    
    // Empty locations are included in all groups
    if (!location) {
      return true;
    }
    
    switch (filterType) {
      case 'A1-A6':
        if (location.startsWith('A')) {
          const numericPart = extractNumericPart(location);
          return numericPart >= 1 && numericPart <= 6;
        }
        return false;
      
      case 'A7-A12':
        if (location.startsWith('A')) {
          const numericPart = extractNumericPart(location);
          return numericPart >= 7 && numericPart <= 12;
        }
        return false;
      
      case 'B-AG':
        return location.startsWith('B') || location === 'AG';
      
      default:
        return false;
    }
  });
  
  // Sort by numeric part: A1, A2, ... A12, then B1, B2, ..., then empty locations last
  return filtered.sort((a, b) => {
    const locationA = (a.Location || '').trim().toUpperCase();
    const locationB = (b.Location || '').trim().toUpperCase();
    
    // Empty locations go last
    if (!locationA && !locationB) return 0;
    if (!locationA) return 1;
    if (!locationB) return -1;
    
    // Sort by extracted numeric part
    const numA = extractSortingNumber(locationA);
    const numB = extractSortingNumber(locationB);
    
    if (numA !== numB) {
      return numA - numB;
    }
    
    // If numeric parts are equal, sort alphabetically
    return locationA.localeCompare(locationB);
  });
};

export const getFilterTitle = (filterType: FilterType): string => {
  switch (filterType) {
    case 'A1-A6':
      return 'Locations A1-A6';
    case 'A7-A12':
      return 'Locations A7-A12';
    case 'B-AG':
      return 'Locations B/AG';
    default:
      return 'Inventory';
  }
};

// Search function for filtering data based on search term
export const searchInventoryData = (data: InventoryItem[], searchTerm: string): InventoryItem[] => {
  if (!searchTerm.trim()) {
    return data;
  }
  
  const term = searchTerm.toLowerCase().trim();
  
  return data.filter(item => {
    return (
      (item.ProductName || '').toLowerCase().includes(term) ||
      (item.VFID || '').toLowerCase().includes(term) ||
      (item.SkuNumber || '').toLowerCase().includes(term) ||
      (item.Location || '').toLowerCase().includes(term)
    );
  });
};