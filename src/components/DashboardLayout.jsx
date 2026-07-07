import { useState } from 'react';
import { GripVertical } from 'lucide-react';

const DashboardLayout = ({ children, onReorder }) => {
  const [items, setItems] = useState(children);

  // Simples: botões para mostrar/ocultar
  return (
    <div className="space-y-4">
      {items.map((child, index) => (
        <div key={index} className="relative">
          <div className="absolute top-2 right-2 flex gap-1">
            <button 
              onClick={() => {
                const newItems = [...items];
                newItems.splice(index, 1);
                setItems(newItems);
                if (onReorder) onReorder(newItems);
              }}
              className="text-xs text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
          {child}
        </div>
      ))}
    </div>
  );
};

export default DashboardLayout;