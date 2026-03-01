import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Bell, Volume2, VolumeX, LogOut } from 'lucide-react';

interface Order {
  id: number;
  table_number: string;
  items: { name: string; quantity: number; label?: string; price: number }[];
  total: number;
  status: string;
  type: 'order' | 'help';
  created_at: string;
}

export default function Kitchen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const lastOrderCount = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    fetchOrders();
    const interval = setInterval(fetchOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      
      // Check for new orders to play sound
      if (data.length > lastOrderCount.current && soundEnabled) {
        playSound();
      }
      lastOrderCount.current = data.length;
      
      setOrders(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    }
  };

  const playSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log('Audio play failed', e));
  };

  const completeOrder = async (id: number) => {
    await fetch(`/api/orders/${id}/complete`, { method: 'PUT' });
    fetchOrders();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center text-2xl">Loading Kitchen Display...</div>;

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-[#1a1a1a] p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white tracking-wider">KITCHEN DISPLAY</h1>
          <div className="bg-amber-600 px-3 py-1 rounded text-sm font-bold text-white">
            {orders.length} PENDING
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-white text-sm font-bold">ADMIN</button>
          <button onClick={() => navigate('/reception')} className="text-amber-500 hover:text-amber-400 text-sm font-bold">RECEPTION</button>
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-full ${soundEnabled ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
          >
            {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
          <button onClick={handleLogout} className="p-3 bg-red-900/30 text-red-400 rounded-full hover:bg-red-900/50">
            <LogOut size={24} />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-32 text-gray-600">
            <CheckCircle size={64} className="mb-4 opacity-20" />
            <h2 className="text-2xl font-bold opacity-50">All Caught Up</h2>
            <p>Waiting for new orders...</p>
          </div>
        )}

        {orders.map(order => (
          <div 
            key={order.id} 
            className={`relative flex flex-col rounded-xl overflow-hidden border-2 shadow-2xl transition-all duration-300 ${
              order.type === 'help' 
                ? 'bg-red-950 border-red-500 animate-pulse' 
                : 'bg-[#1a1a1a] border-amber-500/30'
            }`}
          >
            {/* Card Header */}
            <div className={`p-4 flex justify-between items-center ${
              order.type === 'help' ? 'bg-red-900' : 'bg-amber-900/20'
            }`}>
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-widest">Table</span>
                <div className="text-4xl font-bold text-white">{order.table_number}</div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-gray-400 text-sm mb-1 justify-end">
                  <Clock size={14} />
                  {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                  order.type === 'help' ? 'bg-white text-red-900' : 'bg-amber-500 text-black'
                }`}>
                  {order.type === 'help' ? 'WAITER' : 'ORDER'}
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="flex-1 p-4 space-y-3">
              {order.type === 'order' ? (
                <ul className="space-y-3">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-start text-lg border-b border-white/5 pb-2 last:border-0">
                      <div className="flex gap-3">
                        <span className="font-bold text-amber-500 min-w-[24px]">{item.quantity}x</span>
                        <span className="text-gray-200 font-medium leading-tight">
                          {item.name}
                          {item.label && <span className="block text-sm text-gray-500 font-normal">{item.label}</span>}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <Bell size={48} className="text-red-500 mb-4 animate-bounce" />
                  <h3 className="text-2xl font-bold text-white mb-2">ASSISTANCE NEEDED</h3>
                  <p className="text-red-300">Customer requested a waiter</p>
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div className="p-4 bg-black/20 border-t border-white/5">
              <button 
                onClick={() => completeOrder(order.id)}
                className={`w-full py-4 rounded-lg font-bold text-xl flex items-center justify-center gap-2 transition-colors ${
                  order.type === 'help'
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-green-700 hover:bg-green-600 text-white'
                }`}
              >
                <CheckCircle size={24} />
                {order.type === 'help' ? 'ATTENDED' : 'COMPLETE'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
