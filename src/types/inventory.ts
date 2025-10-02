export interface InventoryItem {
  ProductName: string;
  Location: string;
  VFID: string;
  Quantity: number;
  OrdersCount: number;
  SkuNumber: string;
  Checked?: boolean;
  Notes?: string;
  [key: string]: string | number | undefined; // For dynamic numeric columns like "1", "2", "3", etc.
}

export type FilterType = 'A1-A6' | 'A7-A12' | 'B-AG';