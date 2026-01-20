'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { FaWhatsapp } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import Cart from './Cart';
import ChatWidgetWrapper from './ChatWidgetWrapper';

export default function FloatingButtons() {
  const { items } = useCart();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsapp247, setWhatsapp247] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    loadWhatsAppNumbers();
  }, []);

  const loadWhatsAppNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from('store_configuration')
        .select('whatsapp_number, whatsapp_24_7')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
        if (data.whatsapp_24_7) setWhatsapp247(data.whatsapp_24_7);
      }
    } catch (error) {
      console.error('Error loading WhatsApp numbers:', error);
    }
  };

  const handleWhatsAppClick = (number: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex items-center justify-around px-2 py-3">
          {whatsapp247 && (
            <button
              onClick={() => handleWhatsAppClick(whatsapp247)}
              className="relative flex flex-col items-center gap-1 hover:scale-110 transition-transform active:scale-95"
              title="WhatsApp 24/7"
            >
              <div className="relative w-12 h-12 bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white rounded-full shadow-md flex items-center justify-center">
                <FaWhatsapp className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                  24/7
                </span>
              </div>
              <span className="text-[10px] text-gray-600 font-medium">Chat 24/7</span>
            </button>
          )}

          {whatsappNumber && (
            <button
              onClick={() => handleWhatsAppClick(whatsappNumber)}
              className="flex flex-col items-center gap-1 hover:scale-110 transition-transform active:scale-95"
              title="WhatsApp"
            >
              <div className="w-12 h-12 bg-[#25D366] text-white rounded-full shadow-md flex items-center justify-center">
                <FaWhatsapp className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-gray-600 font-medium">WhatsApp</span>
            </button>
          )}

          <button
            onClick={() => setIsChatOpen(true)}
            className="flex flex-col items-center gap-1 hover:scale-110 transition-transform active:scale-95"
            title="Chat con IA"
          >
            <div className="w-12 h-12 bg-cyan-400 text-white rounded-full shadow-md flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-gray-600 font-medium">Chat IA</span>
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center gap-1 hover:scale-110 transition-transform active:scale-95"
            title="Carrito"
          >
            <div className="relative w-12 h-12 bg-orange-500 text-white rounded-full shadow-md flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {items.length}
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-600 font-medium">Carrito</span>
          </button>
        </div>
      </div>

      <Cart open={isCartOpen} onOpenChange={setIsCartOpen} />
      <ChatWidgetWrapper open={isChatOpen} onOpenChange={setIsChatOpen} />
    </>
  );
}
