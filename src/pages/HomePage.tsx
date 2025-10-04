import React, { useState, useRef } from 'react';
import { Package, Upload, ArrowLeft, RotateCcw } from 'lucide-react';
import Toast from '../components/Toast';
import GlobalDashboard from '../components/GlobalDashboard';
import GlobalNotesTable from '../components/GlobalNotesTable';
import LocationFilter from '../components/LocationFilter';
import InventoryTable from '../components/InventoryTable';
import { useInventoryData } from '../hooks/useInventoryData';

export default function HomePage() {
  const { data, loading, error, showToast, toastMessage, hideToast, uploadFile, updateLocalNote, updateLocalChecked, refetch } = useInventoryData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const handleFileUpload = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- ✅ تم تصحيح منطق الفلترة هنا بشكل نهائي ودقيق ---
  const filteredData = selectedLocations.length > 0
    ? data.filter(item => {
        const itemLocation = item.Location?.trim().toUpperCase();
        if (!itemLocation) return false;
        
        // استخدام طريقة بحث دقيقة تمنع تطابق A1 مع A10
        return selectedLocations.some(sl => {
          const selectedLocationUpper = sl.toUpperCase();
          // هذا التعبير النمطي (Regex) يضمن أننا نبحث عن 'A1' بالضبط
          // كبداية للكلمة، بشرط ألا يتبعها رقم آخر.
          const regex = new RegExp(`^${selectedLocationUpper}(?!\\d)`);
          return regex.test(itemLocation);
        });
      })
    : [];

  // إذا كان الفلتر مفعلاً، اعرض الجدول فقط
  if (selectedLocations.length > 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Toast message={toastMessage} isVisible={showToast} onClose={hideToast} />
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">نتائج الفلتر ({filteredData.length})</h2>
          <button
            onClick={() => setSelectedLocations([])}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>العودة للوحة التحكم</span>
          </button>
        </div>
        <InventoryTable
          data={filteredData}
          loading={loading}
          error={error}
          onLocalNoteUpdate={updateLocalNote}
          onLocalCheckedUpdate={updateLocalChecked}
        />
      </div>
    );
  }

  // --- عرض لوحة التحكم الرئيسية (إذا لم يكن هناك فلتر) ---
  return (
    <>
      <Toast message={toastMessage} isVisible={showToast} onClose={hideToast} />
      
      <div className="min-h-screen bg-gray-50 font-inter">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-600 rounded-xl">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Picklist APP</h1>
            </div>
            <div className="flex items-center space-x-4">
               <button
                  onClick={refetch}
                  className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-transform transform hover:scale-110 shadow-lg"
                  title="Refresh Data"
                >
                  <RotateCcw className="w-6 h-6" />
                </button>
              <button
                onClick={handleFileUpload}
                className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-transform transform hover:scale-110 shadow-lg"
                title="Upload New CSV/Excel File"
              >
                <Upload className="w-6 h-6" />
              </button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
            </div>
          </div>
          
          <GlobalDashboard data={data} />

          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">اختر موقعاً لعرض المنتجات</h2>
            <LocationFilter data={data} onApplyFilter={setSelectedLocations} />
          </div>

          <GlobalNotesTable data={data} />
        </div>
      </div>
    </>
  );
}