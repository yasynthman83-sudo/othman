import { useState, useEffect } from 'react';
import { InventoryItem } from '../types/inventory';

const STORAGE_KEY = 'inventory_data';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxWSxzwLuSrXPmoXy2IT-YLF8RqMkGhQGJ9Fu06V2EpxSkZ_tv_aWqgo3sAomjYt0A2/exec';

// Load data from localStorage
const loadFromStorage = (): InventoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that it's an array
      if (Array.isArray(parsed)) {
        // Ensure all items have required string properties
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

// Test if the endpoint is reachable
const testEndpointConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Testing connection to:', GOOGLE_SCRIPT_URL);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for initial test
    
    // First try a simple GET request to test basic connectivity
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?test=1`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors', // Use CORS mode to properly test CORS headers
    });
    
    clearTimeout(timeoutId);
    
    console.log('Connection test response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        return {
          success: false,
          error: 'Access denied (403). The Google Apps Script deployment permissions may not be set to "Anyone". Please check the deployment settings.'
        };
      } else if (response.status === 404) {
        return {
          success: false,
          error: 'Script not found (404). Please verify the deployment URL is correct and the script is properly deployed.'
        };
      } else {
        return {
          success: false,
          error: `Server error (${response.status}): ${response.statusText}. Please check the Google Apps Script deployment.`
        };
      }
    }
    
    // Check CORS headers
    const corsHeader = response.headers.get('Access-Control-Allow-Origin');
    console.log('CORS header:', corsHeader);
    
    if (!corsHeader || (corsHeader !== '*' && !corsHeader.includes(window.location.origin))) {
      console.warn('CORS headers may not be properly configured');
    }
    
    return { success: true };
    
  } catch (error: any) {
    console.error('Connection test failed:', error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Connection timeout. The Google Apps Script may be slow to respond or unavailable.'
      };
    } else if (error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: 'Network error: Cannot reach Google Apps Script. This could be due to CORS restrictions, network connectivity issues, or incorrect deployment permissions.'
      };
    } else {
      return {
        success: false,
        error: `Connection error: ${error.message}`
      };
    }
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

  // Auto-load data on component mount if no data exists
  useEffect(() => {
    if (data.length === 0) {
      console.log('No data in localStorage, attempting to load from Google Sheets...');
      loadData();
    } else {
      console.log(`Loaded ${data.length} items from localStorage`);
    }
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => {
        console.log('Could not play notification sound:', err);
      });
    } catch (err) {
      console.log('Audio not available:', err);
    }
  };

  const showNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    playNotificationSound();
  };

  const hideToast = () => {
    setShowToast(false);
  };

  const updateLocalNote = (vfid: string, note: string) => {
    setData(prevData => {
      const updatedData = prevData.map(item => 
        item.VFID === vfid 
          ? { ...item, Notes: note }
          : item
      );
      saveToStorage(updatedData);
      return updatedData;
    });

    // Send update to Google Sheets
    updateGoogleSheets(vfid, { Notes: note });
  };

  const updateLocalChecked = (vfid: string, checked: boolean) => {
    setData(prevData => {
      const updatedData = prevData.map(item => 
        item.VFID === vfid 
          ? { ...item, Checked: checked }
          : item
      );
      saveToStorage(updatedData);
      return updatedData;
    });

    // Send update to Google Sheets
    updateGoogleSheets(vfid, { Checked: checked });
  };

  const updateGoogleSheets = async (vfid: string, updates: { Notes?: string; Checked?: boolean }) => {
    try {
      console.log('Updating Google Sheets for VFID:', vfid, 'Updates:', updates);
      
      const updateData: any = {
        action: 'update',
        vfid: vfid
      };
      
      if (updates.Notes !== undefined) {
        updateData.notes = updates.Notes;
      }
      
      if (updates.Checked !== undefined) {
        updateData.checked = updates.Checked.toString();
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for updates

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
        signal: controller.signal,
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('Failed to update Google Sheets:', response.status, response.statusText);
      } else {
        console.log('Successfully updated Google Sheets');
      }
    } catch (error: any) {
      console.warn('Error updating Google Sheets:', error);
      if (error.name !== 'AbortError') {
        // Don't show error toast for background updates, just log
        console.warn('Background update failed, but local data is preserved');
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Starting data load from Google Apps Script...');
      
      // Test connection first
      const connectionTest = await testEndpointConnection();
      if (!connectionTest.success) {
        throw new Error(connectionTest.error || 'Connection test failed');
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout for data loading
      
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      clearTimeout(timeoutId);

      console.log('Response received:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied (403). The Google Apps Script deployment permissions are not set to "Anyone". Please redeploy with proper permissions.');
        } else if (response.status === 404) {
          throw new Error('Script not found (404). Please verify the deployment URL is correct and the script is properly deployed as a web app.');
        } else if (response.status === 500) {
          throw new Error('Internal server error (500). There may be an issue with the Google Apps Script code or Google Sheets access.');
        } else {
          throw new Error(`Server error (${response.status}): ${response.statusText}. Please check the Google Apps Script deployment and logs.`);
        }
      }

      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      let jsonData;
      try {
        jsonData = await response.json();
      } catch (parseError) {
        const text = await response.text();
        console.error('Failed to parse JSON:', parseError);
        throw new Error(`Invalid JSON response from Google Apps Script. Response: ${text.substring(0, 200)}`);
      }

      console.log('Raw data received:', jsonData);
      
      if (!Array.isArray(jsonData)) {
        console.warn('Data is not an array, attempting to extract array from response');
        // Sometimes Google Apps Script wraps data in an object
        if (jsonData && jsonData.data && Array.isArray(jsonData.data)) {
          jsonData = jsonData.data;
        } else {
          throw new Error('Expected array of data from Google Sheets. Please check the Apps Script response format.');
        }
      }

      const transformedData = transformGoogleSheetsData(jsonData);
      console.log('Transformed data:', transformedData);
      
      setData(transformedData);
      saveToStorage(transformedData);
      showNotification(`✅ Successfully loaded ${transformedData.length} items from Google Sheets`);
      
    } catch (err: any) {
      console.error('Error loading data:', err);
      
      let errorMessage = 'Unable to load data from Google Apps Script';
      
      if (err.name === 'AbortError') {
        errorMessage = 'Request timed out. The Google Apps Script may be slow or unavailable.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error: Cannot reach Google Apps Script. Please ensure:\n• The script is deployed as a web app with /exec URL\n• Deployment permissions are set to "Anyone"\n• CORS headers are properly configured in the script\n• Your internet connection is working';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      showNotification(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Starting file upload:', file.name);
      
      const formData = new FormData();
      formData.append('action', 'upload');
      formData.append('file', file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for file uploads

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
        signal: controller.signal,
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Upload failed! status: ${response.status} - ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON response, got: ${contentType}. Response: ${text.substring(0, 200)}`);
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.success) {
        throw new Error('Upload was not successful');
      }

      // Reload data after successful upload
      showNotification(`✅ File uploaded successfully: ${file.name}`);
      await loadData();
      
    } catch (err: any) {
      console.error('Error uploading file:', err);
      
      let errorMessage = 'Failed to upload file';
      
      if (err.name === 'AbortError') {
        errorMessage = 'Upload timed out. Large files may take longer to process.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error during upload. Please check your connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      showNotification(`❌ Upload Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await loadData();
  };

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