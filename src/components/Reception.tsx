import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  Bell, 
  Volume2, 
  VolumeX, 
  LogOut, 
  DollarSign, 
  Users, 
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Order {
  id: number;
  table_number: string;
  items: { name: string; quantity: number; label?: string; price: number }[];
  total: number;
  status: string;
  type: 'order' | 'help';
  created_at: string;
}

export default function Reception() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stats, setStats] = useState({ totalSales: 0, orderCount: 0, helpCount: 0 });
  const lastOrderCount = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
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
      
      // Calculate simple stats from current pending
      const total = data.reduce((acc: number, curr: Order) => acc + (curr.type === 'order' ? curr.total : 0), 0);
      const help = data.filter((o: Order) => o.type === 'help').length;
      setStats({
        totalSales: total,
        orderCount: data.filter((o: Order) => o.type === 'order').length,
        helpCount: help
      });

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

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 font-medium tracking-widest uppercase text-sm">Carregando Recepção...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans">
      {/* Sidebar / Header */}
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
        
        {/* Left Panel - Stats & Controls */}
        <div className="w-full lg:w-80 bg-[#141414] border-r border-white/5 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <ShoppingBag className="text-black" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">RECEPÇÃO</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Painel de Controle</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 text-gray-400 mb-2">
                <DollarSign size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Vendas Pendentes</span>
              </div>
              <div className="text-2xl font-bold text-amber-500">R$ {stats.totalSales.toFixed(2)}</div>
            </div>

            <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 text-gray-400 mb-2">
                <ShoppingBag size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Pedidos Ativos</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.orderCount}</div>
            </div>

            <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 text-gray-400 mb-2">
                <Bell size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Chamadas de Garçom</span>
              </div>
              <div className="text-2xl font-bold text-red-500">{stats.helpCount}</div>
            </div>
          </div>

          <div className="mt-auto pt-6 space-y-3">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${soundEnabled ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-gray-800/50 text-gray-500 border border-white/5'}`}
            >
              <span className="text-sm font-bold uppercase tracking-wider">Som de Alerta</span>
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all"
            >
              <span className="text-sm font-bold uppercase tracking-wider">Sair</span>
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Main Content - Orders List */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-gradient-to-br from-[#0a0a0a] to-[#111]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-serif font-bold">Pedidos em Tempo Real</h2>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Monitorando...
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {orders.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full flex flex-col items-center justify-center py-32 text-gray-600"
                >
                  <CheckCircle size={80} className="mb-6 opacity-10" />
                  <h3 className="text-2xl font-bold opacity-30">Nenhum pedido pendente</h3>
                  <p className="opacity-30">Tudo em dia por aqui!</p>
                </motion.div>
              ) : (
                orders.map(order => (
                  <motion.div
                    layout
                    key={order.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className={`group relative bg-[#1a1a1a] rounded-3xl border transition-all duration-300 overflow-hidden ${
                      order.type === 'help' 
                        ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)]' 
                        : 'border-white/5 hover:border-amber-500/30'
                    }`}
                  >
                    {/* Order Header */}
                    <div className={`p-6 flex justify-between items-start ${
                      order.type === 'help' ? 'bg-red-500/10' : 'bg-white/5'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${
                          order.type === 'help' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
                        }`}>
                          <span className="text-[10px] font-bold uppercase opacity-70">Mesa</span>
                          <span className="text-2xl font-black leading-none">{order.table_number}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              order.type === 'help' ? 'bg-red-500 text-white' : 'bg-amber-500/20 text-amber-500'
                            }`}>
                              {order.type === 'help' ? 'Chamada' : 'Pedido'}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">#{order.id}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                            <Clock size={14} />
                            {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {order.type === 'order' && (
                          <div className="text-2xl font-bold text-white">R$ {order.total.toFixed(2)}</div>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-6">
                      {order.type === 'order' ? (
                        <div className="space-y-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center group/item">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-amber-500 font-bold text-sm">
                                  {item.quantity}
                                </span>
                                <div>
                                  <div className="text-gray-200 font-medium">{item.name}</div>
                                  {item.label && <div className="text-xs text-gray-500">{item.label}</div>}
                                </div>
                              </div>
                              <div className="text-gray-500 text-sm">R$ {(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <Bell size={40} className="text-red-500 mb-3 animate-bounce" />
                          <h4 className="text-lg font-bold text-white">CHAMADA DE GARÇOM</h4>
                          <p className="text-gray-400 text-sm">O cliente na mesa {order.table_number} precisa de ajuda.</p>
                        </div>
                      )}
                    </div>

                    {/* Order Actions */}
                    <div className="p-6 pt-0">
                      <button 
                        onClick={() => completeOrder(order.id)}
                        className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                          order.type === 'help'
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_10px_20px_rgba(239,68,68,0.2)]'
                            : 'bg-white text-black hover:bg-gray-200 shadow-[0_10px_20px_rgba(255,255,255,0.1)]'
                        }`}
                      >
                        {order.type === 'help' ? (
                          <>
                            <CheckCircle size={18} />
                            Marcar como Atendido
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            Finalizar e Receber
                            <ArrowRight size={18} className="ml-1" />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
