import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { InventoryItem } from '../types/inventory';

interface InventoryTableProps {
  data: InventoryItem[];
  loading?: boolean;
  error?: string | null;
  // These functions are now required and will be passed from the parent page
  onLocalNoteUpdate: (vfid: string, note: string) => void;
  onLocalCheckedUpdate: (vfid: string, checked: boolean) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ data, loading, error, onLocalNoteUpdate, onLocalCheckedUpdate }) => {
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize local notes when data changes
    const initialNotes = data.reduce((acc, item) => {
      acc[item.VFID] = item.Notes || '';
      return acc;
    }, {} as Record<string, string>);
    setLocalNotes(initialNotes);
  }, [data]);

  const handleCheckboxChange = (vfid: string, checked: boolean) => {
    // Directly call the function passed via props
    onLocalCheckedUpdate(vfid, checked);
  };

  const handleNotesChange = (vfid: string, value: string) => {
    // Update the note in the local state for a responsive UI
    setLocalNotes(prev => ({ ...prev, [vfid]: value }));
  };

  const handleNotesBlur = (vfid: string) => {
    // When the user clicks away, call the prop function to save the change
    const finalNote = localNotes[vfid] || '';
    onLocalNoteUpdate(vfid, finalNote);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="ml-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-12 text-center text-red-600 font-semibold">{error}</div>;
  }
  
  if (data.length === 0) {
     return (
       <div className="bg-white rounded-xl shadow-lg p-12">
         <div className="text-center">
           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <span className="text-gray-400 text-2xl">📦</span>
           </div>
           <p className="text-gray-500 text-lg">لا توجد عناصر مطابقة للبحث أو الفلتر</p>
         </div>
       </div>
     );
   }

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 mb-8 w-full">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="bg-gradient-to-r from-fedshi-purple to-fedshi-purple-dark text-white sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-sm uppercase">Checked</th>
              <th className="px-4 py-3 text-left font-bold text-sm uppercase">Product Name</th>
              <th className="px-4 py-3 text-left font-bold text-sm uppercase bg-fedshi-purple-dark">Location</th>
              <th className="px-4 py-3 text-left font-bold text-sm uppercase">VFID</th>
              <th className="px-4 py-3 text-left font-bold text-sm uppercase">Quantity</th>
              <th className="px-4 py-3 text-left font-bold text-sm uppercase">SKU Number</th>
              <th className="px-4 py-3 text-left font-bold text-sm uppercase">1</th>
              <th className="px-4 py-3 text-left font-bold text-sm uppercase min-w-[250px]">Notes</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.VFID}
                className={`border-b border-gray-100 ${item.Checked ? 'bg-green-100' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={!!item.Checked}
                    onChange={(e) => handleCheckboxChange(item.VFID, e.target.checked)}
                    className="w-5 h-5 text-fedshi-purple rounded-lg focus:ring-fedshi-purple"
                  />
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900 text-sm">{item.ProductName}</td>
                <td className="px-4 py-3 text-gray-900 text-lg font-bold bg-fedshi-purple/5">{item.Location}</td>
                <td className="px-4 py-3 text-gray-900 font-mono text-lg font-bold">{item.VFID}</td>
                <td className="px-4 py-3 text-gray-900 font-bold text-sm">{item.Quantity}</td>
                <td className="px-4 py-3 text-gray-700 font-mono text-sm">{item.SkuNumber}</td>
                <td className="px-4 py-3 text-gray-700 text-sm">{item["1"] || 0}</td>
                <td className="px-4 py-3">
                  <textarea
                    value={localNotes[item.VFID] || ''}
                    onChange={(e) => handleNotesChange(item.VFID, e.target.value)}
                    onBlur={() => handleNotesBlur(item.VFID)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-fedshi-purple resize-none"
                    rows={2}
                    placeholder="Add notes..."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;