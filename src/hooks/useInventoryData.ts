import { useState, useEffect } from 'react';
import { InventoryItem } from '../types/inventory';

const STORAGE_KEY = 'inventory_data';
// --- ✅ تأكد من وضع آخر رابط نشرته هنا ---
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw8XcxDTfm7p0a8_bJ2MqVvScyH6D2cXQJaqDMQfYd1ERgjkNQ_gv5F-Q-JBtyDd5z-/exec';

// (بقية الدوال المساعدة تبقى كما هي)
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

const saveToStorage = (data: InventoryItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save data to localStorage:', error);
  }
};

const transformGoogleSheetsData = (rawData: any[]): InventoryItem[] => {
  return rawData.map(item => ({
    ProductName: String(item.ProductName || item['Product Name'] || ''),
    Location: String(item.Location || ''),
    VFID: String(item.VFID || item.VF_ID || item['VF ID'] || ''),
    SkuNumber: String(item.SkuNumber || item['Sku Number'] || item.SKU || ''),
    Notes: String(item.Notes || item.Note || ''),
    Quantity: Number(item.Quantity) || 0,
    OrdersCount: Number(item.OrdersCount || item['Orders Count'] || item.Orders || 0),
    Checked: item.Checked === 'TRUE' || item.Checked === true,
    "1": Number(item["1"]) || 0,
    "3": Number(item["3"]) || 0,
  }));
};


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
      audio.play().catch(err => console.log('Could not play sound:', err));
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

  // --- دالة إرسال التحديثات المعدلة ---
  const updateGoogleSheets = async (payload: object) => {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors',
      });
      
      const result = await response.json(); // اقرأ الرد دائماً

      if (response.ok && result.status === 'success') {
        console.log('Update successful:', result.message);
        showNotification(`✅ ${result.message}`); // أظهر رسالة نجاح
      } else {
        // إذا فشل الحفظ، أظهر رسالة الخطأ من السكربت
        console.warn('Update failed:', result.message);
        showNotification(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error updating sheet:', error);
      showNotification(`❌ خطأ في الشبكة أثناء الحفظ.`);
    }
  };

  // --- دالة تحديث الملاحظات المعدلة ---
  const updateLocalNote = (vfid: string, note: string) => {
    // 1. تحديث الواجهة فوراً
    setData(prevData => {
      const updatedData = prevData.map(item => 
        item.VFID === vfid ? { ...item, Notes: note } : item
      );
      saveToStorage(updatedData);
      return updatedData;
    });
    // 2. إرسال البيانات إلى السكربت
    updateGoogleSheets({
      action: 'updateNote',
      VFID: vfid,
      Note: note,
    });
  };

  // --- دالة تحديث خانة الاختيار المعدلة ---
  const updateLocalChecked = (vfid: string, checked: boolean) => {
    // 1. تحديث الواجهة فوراً
    setData(prevData => {
      const updatedData = prevData.map(item => 
        item.VFID === vfid ? { ...item, Checked: checked } : item
      );
      saveToStorage(updatedData);
      return updatedData;
    });
    // 2. إرسال البيانات إلى السكربت
    updateGoogleSheets({
      action: 'updateChecked',
      VFID: vfid,
      Checked: checked,
    });
  };
  
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
      if (!response.ok) throw new Error('Failed to fetch data from the server.');
      
      const result = await response.json();
      if (result.status !== 'success') throw new Error(result.message);

      const transformedData = transformGoogleSheetsData(result.data);
      setData(transformedData);
      saveToStorage(transformedData);
      showNotification(`✅ Successfully loaded ${transformedData.length} items.`);
      
    } catch (err: any) {
      setError(err.message);
      showNotification(`❌ Error: ${err.message}`);
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

      if (!response.ok) throw new Error(`Upload failed!`);

      const result = await response.json();
      if (result.status !== 'success') throw new Error(result.message);

      showNotification(`✅ File uploaded successfully!`);
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