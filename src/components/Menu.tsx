import React, { useEffect, useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'react-qr-code';

interface PriceOption {
  label?: string;
  price: number;
}

interface MenuItemProps {
  id?: number;
  name: string;
  description?: string;
  image_url?: string;
  prices: PriceOption[];
  icon?: string;
  onAdd?: (price: number, label?: string) => void;
}

interface Category {
  id: number;
  name: string;
  items: MenuItemProps[];
}

interface CartItem {
  name: string;
  price: number;
  label?: string;
  quantity: number;
}

const MenuItem = ({ name, description, image_url, prices, icon, onAdd }: MenuItemProps) => {
  const IconComponent = icon && (Icons as any)[icon] ? (Icons as any)[icon] : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-4 group hover:border-amber-500/30 transition-colors"
    >
      <div className="flex">
        {image_url && (
          <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
            <img 
              src={image_url} 
              alt={name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-white">{name}</h3>
              {IconComponent && <span className="text-amber-500 opacity-60"><IconComponent size={16} /></span>}
            </div>
            {description && <p className="text-sm text-gray-400 line-clamp-2 leading-snug mb-2">{description}</p>}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {prices.map((p, index) => (
              <button 
                key={index} 
                onClick={() => onAdd?.(p.price, p.label)}
                className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1 rounded-full transition-all active:scale-95"
              >
                {p.label && <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{p.label}</span>}
                <span className="font-bold text-amber-500">R$ {p.price}</span>
                <Icons.Plus size={12} className="text-amber-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Menu() {
  const [showQR, setShowQR] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showWaiterModal, setShowWaiterModal] = useState(false);
  const [menuData, setMenuData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [orderSent, setOrderSent] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
  
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        setMenuData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load menu", err);
        setLoading(false);
      });
  }, []);

  const filteredMenu = useMemo(() => {
    return menuData.map(cat => ({
      ...cat,
      items: cat.items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(cat => 
      (activeCategory === 'all' || cat.id === activeCategory) && 
      cat.items.length > 0
    );
  }, [menuData, searchQuery, activeCategory]);

  const addToCart = (itemName: string, price: number, label?: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.name === itemName && i.price === price && i.label === label);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { name: itemName, price, label, quantity: 1 }];
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const sendOrder = async () => {
    if (!tableNumber) {
      alert('Por favor, informe o número da mesa');
      return;
    }
    
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: tableNumber,
          items: cart,
          total: cartTotal,
          type: 'order'
        })
      });
      
      if (res.ok) {
        setOrderSent(true);
        setCart([]);
        setTimeout(() => {
          setOrderSent(false);
          setShowCart(false);
        }, 3000);
      }
    } catch (error) {
      alert('Falha ao enviar pedido');
    }
  };

  const callWaiter = async () => {
    if (!tableNumber) {
      alert('Por favor, informe o número da mesa');
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: tableNumber,
          items: [],
          total: 0,
          type: 'help'
        })
      });
      
      if (res.ok) {
        setWaiterCalled(true);
        setTimeout(() => {
          setWaiterCalled(false);
          setShowWaiterModal(false);
        }, 3000);
      }
    } catch (error) {
      alert('Falha ao chamar garçom');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-amber-500">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-amber-500/30 pb-32">
      {/* Texture Overlay */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/black-felt.png")' }}>
      </div>

      {/* Header Section */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=1920" 
          className="w-full h-full object-cover opacity-60"
          alt="Bar Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/40"></div>
        
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
          <div className="flex flex-col">
            <h1 className="text-4xl font-serif font-bold text-white drop-shadow-lg">Quilombar</h1>
            <p className="text-amber-500 font-medium tracking-widest uppercase text-xs mt-1">Gastrobar & Cultura</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowWaiterModal(true)}
              className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-full transition-colors border border-red-500/20 backdrop-blur-md"
            >
              <Icons.Bell size={20} />
            </button>
            <button 
              onClick={() => setShowQR(true)}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10 backdrop-blur-md"
            >
              <Icons.QrCode size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="max-w-2xl mx-auto px-6 -mt-12 relative z-10">
        <div className="bg-[#1a1a1a] p-4 rounded-2xl shadow-2xl border border-white/5 space-y-4">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="O que você procura?"
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-amber-500/50 outline-none transition-colors"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeCategory === 'all' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              Todos
            </button>
            {menuData.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeCategory === cat.id ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-2xl mx-auto px-6 mt-8">
        {filteredMenu.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Icons.Search size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhum item encontrado</p>
          </div>
        ) : (
          filteredMenu.map(category => (
            <div key={category.id} className="mb-10">
              <h2 className="text-2xl font-serif font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-amber-500"></span>
                {category.name}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {category.items.map((item, idx) => (
                  <MenuItem 
                    key={idx}
                    {...item}
                    onAdd={(price, label) => addToCart(item.name, price, label)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Cart */}
      <AnimatePresence>
        {cart.length > 0 && !showCart && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 z-40 max-w-md mx-auto"
          >
            <button 
              onClick={() => setShowCart(true)}
              className="w-full bg-amber-500 text-black p-4 rounded-2xl shadow-[0_10px_40px_rgba(245,158,11,0.3)] flex justify-between items-center font-bold active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                  {cart.reduce((a,b) => a + b.quantity, 0)}
                </div>
                <span>Ver Pedido</span>
              </div>
              <span className="text-lg">R$ {cartTotal}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals (Waiter, Cart, QR) - Reusing existing logic but with updated styles */}
      {/* Waiter Modal */}
      <AnimatePresence>
        {showWaiterModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setShowWaiterModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] text-white p-8 rounded-3xl max-w-sm w-full shadow-2xl relative border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowWaiterModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><Icons.X size={24} /></button>
              {waiterCalled ? (
                <div className="flex flex-col items-center text-center text-green-400 py-8">
                  <Icons.CheckCircle size={64} className="mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Garçom Chamado!</h3>
                  <p className="text-gray-400">Um atendente virá até você em breve.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <Icons.Bell size={48} className="mx-auto text-red-500 mb-4" />
                    <h3 className="text-2xl font-serif font-bold">Chamar Garçom</h3>
                    <p className="text-gray-400 text-sm">Selecione sua mesa para ajuda.</p>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        onClick={() => setTableNumber(num.toString())}
                        className={`py-4 rounded-xl text-xl font-bold border transition-all ${tableNumber === num.toString() ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-black/40 border-white/10 text-white hover:border-white/30'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={callWaiter} 
                    disabled={!tableNumber}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 text-white py-4 rounded-xl font-bold text-lg transition-colors"
                  >
                    Chamar Agora
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm sm:p-4"
            onClick={() => setShowCart(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-[#1a1a1a] text-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-t border-white/10 sm:border"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-2xl font-serif font-bold">Seu Pedido</h3>
                <button onClick={() => setShowCart(false)} className="text-gray-500"><Icons.X size={28} /></button>
              </div>

              {orderSent ? (
                <div className="p-12 flex flex-col items-center text-center text-green-400">
                  <Icons.CheckCircle size={64} className="mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Pedido Enviado!</h3>
                  <p className="text-gray-400">Obrigado! Seu pedido já está sendo preparado.</p>
                </div>
              ) : (
                <>
                  <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div>
                          <div className="font-bold text-lg">{item.name}</div>
                          <div className="text-sm text-gray-400">
                            {item.label && `${item.label} • `}{item.price}$ x {item.quantity}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-bold text-amber-500">R$ {item.price * item.quantity}</div>
                          <button onClick={() => removeFromCart(idx)} className="text-red-500/50 hover:text-red-500 p-2"><Icons.Trash2 size={20} /></button>
                        </div>
                      </div>
                    ))}
                    {cart.length === 0 && <div className="text-center text-gray-500 py-12">Seu carrinho está vazio</div>}
                  </div>

                  <div className="p-6 bg-black/40 border-t border-white/10 space-y-6">
                    <div className="flex justify-between items-end">
                      <span className="text-gray-400 font-medium">Total do Pedido</span>
                      <span className="text-3xl font-bold text-amber-500">R$ {cartTotal}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-sm text-gray-400 font-bold uppercase tracking-wider">Selecione sua Mesa</label>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map(num => (
                          <button
                            key={num}
                            onClick={() => setTableNumber(num.toString())}
                            className={`py-3 rounded-xl text-lg font-bold border transition-all ${tableNumber === num.toString() ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-black/40 border-white/10 text-white hover:border-white/30'}`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={sendOrder}
                      disabled={cart.length === 0}
                      className="w-full bg-amber-500 disabled:bg-gray-800 disabled:text-gray-600 text-black py-5 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all"
                    >
                      Confirmar Pedido
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setShowQR(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-black p-10 rounded-3xl max-w-sm w-full shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500"><Icons.X size={24} /></button>
              <div className="flex flex-col items-center text-center space-y-8">
                <div className="space-y-2">
                  <h3 className="text-3xl font-serif font-bold text-gray-900">Quilombar</h3>
                  <p className="text-gray-500 font-medium">Aponte a câmera para o menu</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-3xl shadow-inner border border-gray-100">
                  <QRCode value={currentUrl} size={220} viewBox={`0 0 256 256`} />
                </div>
                <button 
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-colors"
                >
                  <Icons.Printer size={20} />
                  <span>Imprimir QR Code</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
