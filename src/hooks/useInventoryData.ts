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
  updateLocalNote: (vfid: string, note: string) => void;
  updateLocalChecked: (vfid: string, checked: boolean) => void;
  loadData: () => Promise<void>;
  uploadFile: (file: File) => Promise<void>; 
}


export const useInventoryData = (): UseInventoryDataReturn => {
  const [data, setData] = useState<InventoryItem[]>(() => loadFromStorage());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (data.length === 0) {
      loadData();
    }
    
    // Set up auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadDataSilently();
    }, 10000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);
  
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
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Silent data loading for auto-refresh (no loading indicators or notifications)
  const loadDataSilently = async () => {
    try {
      const { data: inventoryData, error: dbError } = await supabase
        .from('Picklist')
        .select('*');

      if (dbError) throw new Error(dbError.message);

      setData(inventoryData || []);
      saveToStorage(inventoryData || []);
      
    } catch (err: any) {
      // Silent failure - don't show error notifications for auto-refresh
      console.warn('Auto-refresh failed:', err.message);
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
      console.error('Failed to save note:', dbError.message);
      loadData(); 
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
      console.error('Failed to save update:', dbError.message);
      loadData(); 
    }
  };

  // --- ✅ دالة رفع الملفات الجديدة والكاملة ---
  const uploadFile = async (file: File) => {
    setLoading(true);
    setError(null);
    
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
          const { error: deleteError } = await supabase
            .from('Picklist')
            .delete()
            .neq('id', 0); // شرط لحذف كل الصفوف

          if (deleteError) throw new Error(deleteError.message);

          // 2. إضافة البيانات الجديدة
          const { error: insertError } = await supabase
            .from('Picklist')
            .insert(dataToInsert);

          if (insertError) throw new Error(insertError.message);

          await loadData(); // إعادة تحميل البيانات الجديدة

        } catch (procError: any) {
          setError(procError.message);
          console.error('File processing failed:', procError.message);
          setLoading(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (err: any) {
      setError(err.message);
      console.error('File reading failed:', err.message);
      setLoading(false);
    }
  };

  const refetch = () => loadData();

  return { 
    data, loading, error, refetch, updateLocalNote, updateLocalChecked, loadData, uploadFile
  };
};