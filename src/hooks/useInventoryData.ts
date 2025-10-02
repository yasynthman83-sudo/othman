import { useState, useEffect } from 'react';
import { InventoryItem } from '../types/inventory';

const STORAGE_KEY = 'inventory_data';
// --- ✅ تم تحديث الرابط هنا ---
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzmbsXCRdPvNxbnCxCwYEJgm2JtlxZ54H5WzANruMGrEmcICLZfLRrhp-JB8j5ntFEd/exec';

// Load data from localStorage
const loadFromStorage = (): InventoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          ...item,
          ProductName: String(item.ProductName || ''),
          Location: String(item.Location || ''),
          VFID: String(item.VFID || ''),
          SkuNumber: String(item.SkuNumber || ''),
          Notes: String(item.Notes || ''),
          Quantity: Number(item.Quantity) || 0,
          OrdersCount: Number(item.OrdersCount) || 0,
          Checked: Boolean(item.Checked),
          "1": Number(item["1"]) || 0,
          "3": Number(item["3"]) || 0,
        }));
      }
    }
  } catch (error) {
    console.warn('Failed to load data from localStorage:', error);
  }
  return [];
};

// Save data to localStorage
const saveToStorage = (data: InventoryItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save data to localStorage:', error);
  }
};

// Transform Google Sheets data to InventoryItem format
const transformGoogleSheetsData = (rawData: any[]): InventoryItem[] => {
  return rawData.map(item => ({
    ProductName: String(item.ProductName || item['Product Name'] || ''),
    Location: String(item.Location || ''),
    VFID: String(item.VFID || item.VF_ID || item['VF ID'] || ''),
    SkuNumber: String(item.SkuNumber || item['Sku Number'] || item.SKU || ''),
    Notes: String(item.Notes || item.Note || ''),
    Quantity: Number(item.Quantity) || 0,
    OrdersCount: Number(item.OrdersCount || item['Orders Count'] || item.Orders || 0),
    Checked: item.Checked === 'TRUE' || item.Checked === true || item.Checked === 'true' || false,
    "1": Number(item["1"]) || 0,
    "3": Number(item["3"]) || 0,
  }));
};

// ... (rest of the file remains the same)
// The full, correct file content is provided below for completeness

interface UseInventoryDataReturn {
  data: InventoryItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  showToast: boolean;
  toastMessage: string;
  hideToast: () => void;
  updateLocalNote: (vfid: string, note: string) => void;
  updateLocalChecked: (vfid: string, checked: boolean) => void;
  loadData: () => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
}

export const useInventoryData = (): UseInventoryDataReturn => {
  const [data, setData] = useState<InventoryItem[]>(() => loadFromStorage());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (data.length === 0) {
      loadData();
    }
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Could not play notification sound:', err));
    } catch (err) {
      console.log('Audio not available:', err);
    }
  };

  const showNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    playNotificationSound();
  };

  const hideToast = () => setShowToast(false);

  const updateLocalNote = (vfid: string, note: string) => {
    setData(prevData => {
      const updatedData = prevData.map(item => 
        item.VFID === vfid ? { ...item, Notes: note } : item
      );
      saveToStorage(updatedData);
      return updatedData;
    });
    updateGoogleSheets(vfid, { Notes: note });
  };

  const updateLocalChecked = (vfid: string, checked: boolean) => {
    setData(prevData => {
      const updatedData = prevData.map(item => 
        item.VFID === vfid ? { ...item, Checked: checked } : item
      );
      saveToStorage(updatedData);
      return updatedData;
    });
    updateGoogleSheets(vfid, { Checked: checked });
  };

  const updateGoogleSheets = async (vfid: string, updates: { Notes?: string; Checked?: boolean }) => {
    try {
      let action = '';
      let payload: any = { VFID: vfid };

      if (updates.Notes !== undefined) {
        action = 'updateNote';
        payload.Note = updates.Notes;
      }
      
      if (updates.Checked !== undefined) {
        action = 'updateChecked';
        payload.Checked = updates.Checked;
      }
      
      payload.action = action;

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          console.log('Successfully updated Google Sheets');
        } else {
          console.warn('Failed to update Google Sheets:', result.message);
        }
      } else {
        console.warn('Failed to update Google Sheets:', response.statusText);
      }
    } catch (error) {
      console.warn('Error updating Google Sheets:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        mode: 'cors',
      });

      if (!response.ok) throw new Error(`Server error (${response.status}): ${response.statusText}`);
      
      let jsonData = await response.json();
      
      if (jsonData && jsonData.data && Array.isArray(jsonData.data)) {
        jsonData = jsonData.data;
      } else if (!Array.isArray(jsonData)) {
        throw new Error('Expected array of data from Google Sheets.');
      }

      const transformedData = transformGoogleSheetsData(jsonData);
      setData(transformedData);
      saveToStorage(transformedData);
      showNotification(`✅ Successfully loaded ${transformedData.length} items.`);
      
    } catch (err: any) {
      setError(err.message);
      showNotification(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formData,
        mode: 'cors'
      });

      if (!response.ok) throw new Error(`Upload failed! status: ${response.status} - ${response.statusText}`);

      const result = await response.json();

      if (result.status === 'error') {
        throw new Error(result.message || 'An unknown error occurred during upload.');
      }

      if (result.status !== 'success') {
        throw new Error('Upload was not successful.');
      }

      showNotification(`✅ File uploaded successfully: ${file.name}`);
      await loadData();
      
    } catch (err: any) {
      setError(err.message);
      showNotification(`❌ Upload Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => loadData();

  return { 
    data, 
    loading, 
    error, 
    refetch, 
    showToast, 
    toastMessage, 
    hideToast,
    updateLocalNote,
    updateLocalChecked,
    loadData,
    uploadFile
  };
};