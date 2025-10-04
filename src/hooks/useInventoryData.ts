import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { InventoryItem } from '../types/inventory';

const STORAGE_KEY = 'inventory_data';

// --- ✅ تم إعداد الاتصال بقاعدة بيانات Supabase الجديدة ---
const supabaseUrl = 'https://aqbpbptnfhbwlzuprbns.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYnBicHRuZmhid2x6dXByYm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDY0ODQsImV4cCI6MjA3NTEyMjQ4NH0.wwzhmTQvzBl1kp2hOnex1kLyoKpmsolC-oSpuk_K8x8';
const supabase = createClient(supabaseUrl, supabaseKey);


// (الدوال المساعدة تبقى كما هي)
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
  uploadFile: (file: File) => Promise<void>; // Note: File upload needs a different setup with Supabase Storage
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
  
  const showNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const hideToast = () => setShowToast(false);
  
  // --- ✅ دالة جلب البيانات الجديدة باستخدام Supabase ---
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: inventoryData, error: dbError } = await supabase
        .from('inventory') // اسم الجدول
        .select('*');     // جلب كل الأعمدة

      if (dbError) {
        throw new Error(dbError.message);
      }

      setData(inventoryData || []);
      saveToStorage(inventoryData || []);
      showNotification(`✅ تم تحميل ${inventoryData?.length || 0} عنصراً بنجاح.`);
      
    } catch (err: any) {
      setError(err.message);
      showNotification(`❌ خطأ في تحميل البيانات: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- ✅ دالة تحديث الملاحظات الجديدة باستخدام Supabase ---
  const updateLocalNote = async (vfid: string, note: string) => {
    // 1. تحديث الواجهة فوراً لتجربة مستخدم سريعة
    setData(prev => {
      const newData = prev.map(item => item.VFID === vfid ? { ...item, Notes: note } : item);
      saveToStorage(newData);
      return newData;
    });

    // 2. إرسال التحديث إلى قاعدة البيانات
    const { error: dbError } = await supabase
      .from('inventory')
      .update({ Notes: note })
      .eq('VFID', vfid);

    if (dbError) {
      showNotification(`❌ فشل حفظ الملاحظة: ${dbError.message}`);
      // يمكنك إعادة تحميل البيانات لإلغاء التغيير المحلي عند الفشل
      loadData(); 
    } else {
      showNotification(`✅ تم حفظ الملاحظة.`);
    }
  };

  // --- ✅ دالة تحديث خانة الاختيار الجديدة باستخدام Supabase ---
  const updateLocalChecked = async (vfid: string, checked: boolean) => {
    // 1. تحديث الواجهة فوراً
    setData(prev => {
      const newData = prev.map(item => item.VFID === vfid ? { ...item, Checked: checked } : item);
      saveToStorage(newData);
      return newData;
    });

    // 2. إرسال التحديث إلى قاعدة البيانات
    const { error: dbError } = await supabase
      .from('inventory')
      .update({ Checked: checked })
      .eq('VFID', vfid);

    if (dbError) {
      showNotification(`❌ فشل حفظ التحديث: ${dbError.message}`);
      loadData(); // إعادة تحميل البيانات عند الفشل
    } else {
      showNotification(`✅ تم حفظ التحديث.`);
    }
  };

  // دالة رفع الملفات (ملاحظة: تحتاج لإعداد Supabase Storage لاحقاً)
  const uploadFile = async (file: File) => {
    showNotification("⚠️ وظيفة رفع الملفات لم يتم إعدادها بعد مع Supabase.");
    // This requires setting up Supabase Storage, which is a separate step.
    // For now, it will just show a warning.
    return Promise.resolve();
  };

  const refetch = () => loadData();

  return { 
    data, loading, error, refetch, showToast, toastMessage, hideToast,
    updateLocalNote, updateLocalChecked, loadData, uploadFile
  };
};