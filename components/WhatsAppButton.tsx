'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FaWhatsapp } from 'react-icons/fa';

export default function WhatsAppButton() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsapp247, setWhatsapp247] = useState('');

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

  if (!whatsappNumber && !whatsapp247) return null;

  return (
    <>
      {whatsappNumber && (
        <button
          onClick={() => handleWhatsAppClick(whatsappNumber)}
          className="hidden md:flex fixed bottom-[340px] right-6 w-16 h-16 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 items-center justify-center z-40 group"
          title="WhatsApp"
        >
          <FaWhatsapp className="w-8 h-8" />
          <span className="absolute bottom-full right-0 mb-2 mr-2 bg-white text-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Contáctanos por WhatsApp
          </span>
        </button>
      )}

      {whatsapp247 && (
        <div className="hidden md:block fixed bottom-[260px] right-6 z-40">
          <div className="relative">
            <span className="absolute inset-0 rounded-full animate-spin-slow">
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 via-blue-500 to-yellow-400 opacity-75 blur-sm"></span>
            </span>
            <span className="absolute inset-[-4px] rounded-full animate-spin-slow" style={{ animationDirection: 'reverse' }}>
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 via-red-500 to-blue-500 opacity-60 blur-md"></span>
            </span>
            <button
              onClick={() => handleWhatsAppClick(whatsapp247)}
              className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#25D366] to-[#128C7E] hover:from-[#20BA5A] hover:to-[#0E7A6E] text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center group animate-wiggle"
              title="WhatsApp 24/7"
            >
              <FaWhatsapp className="w-7 h-7 md:w-8 md:h-8" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                24/7
              </span>
              <span className="absolute bottom-full right-0 mb-2 mr-2 bg-white text-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                WhatsApp 24/7
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
