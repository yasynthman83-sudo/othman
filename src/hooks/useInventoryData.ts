import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { InventoryItem } from '../types/inventory';
import * as XLSX from 'xlsx'; // --- ✅ استيراد مكتبة معالجة ملفات Excel/CSV ---

const STORAGE_KEY = 'inventory_data';

// --- إعداد الاتصال بقاعدة بيانات Supabase ---
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
  
  const showNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const hideToast = () => setShowToast(false);
  
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: inventoryData, error: dbError } = await supabase
        .from('Picklist')
        .select('*');

      if (dbError) throw new Error(dbError.message);

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

  const updateLocalNote = async (vfid: string, note: string) => {
    setData(prev => {
      const newData = prev.map(item => item.VFID === vfid ? { ...item, Notes: note } : item);
      saveToStorage(newData);
      return newData;
    });

    const { error: dbError } = await supabase
      .from('Picklist')
      .update({ Notes: note })
      .eq('VFID', vfid);

    if (dbError) {
      showNotification(`❌ فشل حفظ الملاحظة: ${dbError.message}`);
      loadData(); 
    } else {
      showNotification(`✅ تم حفظ الملاحظة.`);
    }
  };

  const updateLocalChecked = async (vfid: string, checked: boolean) => {
    setData(prev => {
      const newData = prev.map(item => item.VFID === vfid ? { ...item, Checked: checked } : item);
      saveToStorage(newData);
      return newData;
    });

    const { error: dbError } = await supabase
      .from('Picklist')
      .update({ Checked: checked })
      .eq('VFID', vfid);

    if (dbError) {
      showNotification(`❌ فشل حفظ التحديث: ${dbError.message}`);
      loadData(); 
    } else {
      showNotification(`✅ تم حفظ التحديث.`);
    }
  };

  // --- ✅ دالة رفع الملفات الجديدة والكاملة ---
  const uploadFile = async (file: File) => {
    setLoading(true);
    setError(null);
    showNotification("🔄 جاري معالجة الملف...");
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const binaryStr = event.target?.result;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            throw new Error("الملف فارغ أو بصيغة غير صحيحة.");
          }

          // تحضير البيانات لإدخالها في قاعدة البيانات
          const dataToInsert = jsonData.map(row => ({
            ProductName: row['Product Name'] || row.ProductName,
            Location: row.Location,
            VFID: row.VFID,
            SkuNumber: row['Sku Number'] || row.SkuNumber,
            Quantity: row.Quantity,
            OrdersCount: row['Orders Count'] || row.OrdersCount,
            Checked: false, // القيمة الافتراضية عند الرفع
            Notes: '', // القيمة الافتراضية
            '1': row['1'],
            '3': row['3'],
          }));

          // 1. حذف كل البيانات القديمة من الجدول
          showNotification("⏳ جاري حذف البيانات القديمة...");
          const { error: deleteError } = await supabase
            .from('Picklist')
            .delete()
            .neq('id', 0); // شرط لحذف كل الصفوف

          if (deleteError) throw new Error(deleteError.message);

          // 2. إضافة البيانات الجديدة
          showNotification("⏳ جاري إضافة البيانات الجديدة...");
          const { error: insertError } = await supabase
            .from('Picklist')
            .insert(dataToInsert);

          if (insertError) throw new Error(insertError.message);

          showNotification(`✅ تم رفع ومعالجة ${dataToInsert.length} عنصراً بنجاح!`);
          await loadData(); // إعادة تحميل البيانات الجديدة

        } catch (procError: any) {
          setError(procError.message);
          showNotification(`❌ فشل في معالجة الملف: ${procError.message}`);
          setLoading(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (err: any) {
      setError(err.message);
      showNotification(`❌ خطأ في قراءة الملف: ${err.message}`);
      setLoading(false);
    }
  };

  const refetch = () => loadData();

  return { 
    data, loading, error, refetch, showToast, toastMessage, hideToast,
    updateLocalNote, updateLocalChecked, loadData, uploadFile
  };
};