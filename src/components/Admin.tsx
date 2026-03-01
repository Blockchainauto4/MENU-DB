import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Edit2, Save, X, CheckCircle, Clock } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  order: number;
  items: MenuItem[];
}

interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  image_url?: string;
  icon: string;
  prices: { label?: string; price: number }[];
  order: number;
}

interface Order {
  id: number;
  table_number: string;
  items: { name: string; quantity: number; label?: string; price: number }[];
  total: number;
  status: string;
  type: 'order' | 'help';
  created_at: string;
}

export default function Admin() {
  const [menu, setMenu] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('orders');
  const navigate = useNavigate();

  // Edit states
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItemCategory, setNewItemCategory] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
    
    // Poll for orders every 3 seconds
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchMenu(), fetchOrders()]);
    setLoading(false);
  };

  const fetchMenu = async () => {
    // Try to load from cache first
    const cachedMenu = localStorage.getItem('menu_cache');
    if (cachedMenu) {
      try {
        setMenu(JSON.parse(cachedMenu));
      } catch (e) {
        console.error("Failed to parse cached menu", e);
      }
    }

    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setMenu(data);
      localStorage.setItem('menu_cache', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to fetch menu', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const completeOrder = async (id: number) => {
    await fetch(`/api/orders/${id}/complete`, { method: 'PUT' });
    fetchOrders();
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    fetchMenu();
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('Delete category and all items?')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    fetchMenu();
  };

  const addCategory = async () => {
    if (!newCategoryName) return;
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName, order: menu.length + 1 }),
    });
    setNewCategoryName('');
    fetchMenu();
  };

  const saveItem = async (item: Partial<MenuItem>) => {
    const url = item.id ? `/api/items/${item.id}` : '/api/items';
    const method = item.id ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    setEditingItem(null);
    setNewItemCategory(null);
    fetchMenu();
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-gray-100 font-sans p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif">Menu Admin</h1>
          <div className="flex gap-4">
            <button onClick={() => navigate('/reception')} className="text-amber-500 hover:text-amber-400 font-bold">Reception View</button>
            <button onClick={() => navigate('/kitchen')} className="text-green-500 hover:text-green-400 font-bold">Kitchen View</button>
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white">View Menu</button>
            <button onClick={handleLogout} className="text-red-400 hover:text-red-300">Logout</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`pb-2 px-4 ${activeTab === 'orders' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-400'}`}
          >
            Orders ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            className={`pb-2 px-4 ${activeTab === 'menu' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-400'}`}
          >
            Menu Management
          </button>
        </div>

        {activeTab === 'orders' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.length === 0 && <div className="text-gray-500 col-span-full text-center py-12">No pending orders</div>}
            {orders.map(order => (
              <div 
                key={order.id} 
                className={`border rounded-xl p-6 flex flex-col shadow-lg ${
                  order.type === 'help' 
                    ? 'bg-red-900/20 border-red-500/50 animate-pulse' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`text-xl font-bold ${order.type === 'help' ? 'text-red-500' : 'text-amber-500'}`}>
                      Table {order.table_number}
                    </h3>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Clock size={12} />
                      {new Date(order.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    order.type === 'help' ? 'bg-red-500 text-white' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {order.type === 'help' ? 'Waiter Called' : order.status}
                  </div>
                </div>

                {order.type === 'order' && (
                  <>
                    <div className="flex-1 space-y-2 mb-6">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-200">
                            {item.quantity}x {item.name} {item.label && <span className="text-gray-500">({item.label})</span>}
                          </span>
                          <span className="text-gray-400">R$ {item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                      <div className="text-xl font-bold">R$ {order.total}</div>
                      <button 
                        onClick={() => completeOrder(order.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors"
                      >
                        <CheckCircle size={16} /> Complete
                      </button>
                    </div>
                  </>
                )}

                {order.type === 'help' && (
                  <div className="flex-1 flex flex-col justify-end">
                    <p className="text-gray-300 mb-6 italic">Customer is requesting assistance.</p>
                    <button 
                      onClick={() => completeOrder(order.id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-colors"
                    >
                      <CheckCircle size={16} /> Mark as Attended
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Menu Management Tab */
          <>
            {/* Add Category */}
            <div className="bg-white/5 p-4 rounded-lg mb-8 flex gap-2">
              <input
                type="text"
                placeholder="New Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2"
              />
              <button onClick={addCategory} className="bg-amber-600 px-4 py-2 rounded hover:bg-amber-700">Add Category</button>
            </div>

            <div className="space-y-8">
              {menu.map(category => (
                <div key={category.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                    <h2 className="text-xl font-serif text-amber-500">{category.name}</h2>
                    <button onClick={() => deleteCategory(category.id)} className="text-red-400 hover:bg-red-900/20 p-2 rounded">
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {category.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-black/20 p-3 rounded hover:bg-black/30">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-400">
                            {Array.isArray(item.prices) && item.prices.map(p => `${p.label ? p.label + ': ' : ''}R$ ${p.price}`).join(' / ')}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingItem(item)} className="p-2 text-blue-400 hover:bg-blue-900/20 rounded">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => deleteItem(item.id)} className="p-2 text-red-400 hover:bg-red-900/20 rounded">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => setNewItemCategory(category.id)}
                      className="w-full py-2 border border-dashed border-white/20 text-gray-400 rounded hover:bg-white/5 flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Add Item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit/Add Item Modal */}
      {(editingItem || newItemCategory) && (
        <ItemModal 
          item={editingItem} 
          categoryId={newItemCategory || editingItem?.category_id}
          onSave={saveItem} 
          onClose={() => { setEditingItem(null); setNewItemCategory(null); }} 
        />
      )}
    </div>
  );
}

function ItemModal({ item, categoryId, onSave, onClose }: any) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [imageUrl, setImageUrl] = useState(item?.image_url || '');
  const [icon, setIcon] = useState(item?.icon || '');
  const [prices, setPrices] = useState<{label: string, price: string}[]>(
    item?.prices?.map((p: any) => ({ label: p.label || '', price: p.price.toString() })) || [{ label: '', price: '' }]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: item?.id,
      category_id: categoryId,
      name,
      description,
      image_url: imageUrl,
      icon,
      prices: Array.isArray(prices) ? prices.map(p => ({ label: p.label, price: Number(p.price) })).filter(p => p.price > 0) : []
    });
  };

  const addPrice = () => setPrices([...prices, { label: '', price: '' }]);
  const removePrice = (index: number) => setPrices(prices.filter((_, i) => i !== index));

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2a2a] p-6 rounded-xl w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-serif mb-4">{item ? 'Edit Item' : 'New Item'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input className="w-full bg-black/20 border border-white/10 rounded px-3 py-2" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 h-20" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Image URL</label>
            <input className="w-full bg-black/20 border border-white/10 rounded px-3 py-2" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Icon (Lucide name)</label>
            <input className="w-full bg-black/20 border border-white/10 rounded px-3 py-2" value={icon} onChange={e => setIcon(e.target.value)} />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Prices</label>
            {Array.isArray(prices) && prices.map((price, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input 
                  placeholder="Label (e.g. 1 por)" 
                  className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-1 text-sm"
                  value={price.label}
                  onChange={e => {
                    const newPrices = [...prices];
                    newPrices[index].label = e.target.value;
                    setPrices(newPrices);
                  }}
                />
                <input 
                  placeholder="Price" 
                  type="number"
                  className="w-20 bg-black/20 border border-white/10 rounded px-2 py-1 text-sm"
                  value={price.price}
                  onChange={e => {
                    const newPrices = [...prices];
                    newPrices[index].price = e.target.value;
                    setPrices(newPrices);
                  }}
                  required
                />
                <button type="button" onClick={() => removePrice(index)} className="text-red-400"><X size={16} /></button>
              </div>
            ))}
            <button type="button" onClick={addPrice} className="text-sm text-amber-500 hover:text-amber-400">+ Add Price Option</button>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
            <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-amber-600 rounded hover:bg-amber-700 text-white">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
