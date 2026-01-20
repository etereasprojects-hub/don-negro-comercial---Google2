'use client';

import { useState, useEffect } from 'react';
import { Facebook, Instagram, Phone, Mail, MapPin, Twitter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FaTiktok, FaReddit, FaLinkedin, FaYoutube, FaWhatsapp } from 'react-icons/fa';

interface StoreConfig {
  store_name: string;
  logo_url: string | null;
  email: string | null;
  whatsapp_number: string | null;
  whatsapp_24_7: string | null;
}

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string | null;
}

interface SocialMedia {
  id: string;
  platform: string;
  url: string;
  icon_name: string;
}

interface StoreHours {
  id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

const socialIcons: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  tiktok: FaTiktok,
  reddit: FaReddit,
  linkedin: FaLinkedin,
  youtube: FaYoutube,
  whatsapp: FaWhatsapp,
};

const socialColors: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  tiktok: '#000000',
  reddit: '#FF4500',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  whatsapp: '#25D366',
};

const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([]);
  const [hours, setHours] = useState<StoreHours[]>([]);
  const [creatorLogoUrl, setCreatorLogoUrl] = useState('');

  useEffect(() => {
    loadConfiguration();
    loadLocations();
    loadSocialMedia();
    loadHours();
    loadCreatorLogo();
  }, []);

  const loadConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('store_configuration')
        .select('store_name, logo_url, email, whatsapp_number, whatsapp_24_7')
        .maybeSingle();

      if (error) throw error;
      if (data) setConfig(data);
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const handleWhatsAppClick = (number: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('store_locations')
        .select('*')
        .order('created_at');

      if (error) throw error;
      if (data) setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadSocialMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('store_social_media')
        .select('*')
        .order('display_order');

      if (error) throw error;
      if (data) setSocialMedia(data);
    } catch (error) {
      console.error('Error loading social media:', error);
    }
  };

  const loadHours = async () => {
    try {
      const { data, error } = await supabase
        .from('store_hours')
        .select('*')
        .order('day_of_week');

      if (error) throw error;
      if (data) setHours(data);
    } catch (error) {
      console.error('Error loading hours:', error);
    }
  };

  const loadCreatorLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('creator_logo_url')
        .single();

      if (error) {
        console.error('Error loading creator logo:', error);
        return;
      }

      if (data?.creator_logo_url) {
        setCreatorLogoUrl(data.creator_logo_url);
      }
    } catch (error) {
      console.error('Error loading creator logo:', error);
    }
  };

  return (
    <>
      <footer className="bg-[#2E3A52] text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              {config?.logo_url ? (
                <img src={config.logo_url} alt={config.store_name} className="h-16 object-contain mb-4" />
              ) : (
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-[#D91E7A] to-[#6B4199] bg-clip-text text-transparent">
                  {config?.store_name || 'Mi Comercio'}
                </h3>
              )}
              <p className="text-gray-300 mb-4">
                Tu comercial de confianza. Calidad, variedad y la mejor atención.
              </p>
              {(socialMedia.length > 0 || config?.whatsapp_number || config?.whatsapp_24_7) && (
                <div className="flex gap-3 flex-wrap">
                  {socialMedia.map((social) => {
                    const Icon = socialIcons[social.platform] || Facebook;
                    const color = socialColors[social.platform] || '#6B4199';
                    return (
                      <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-all hover:scale-110 shadow-md"
                        style={{ backgroundColor: color }}
                        title={social.platform}
                      >
                        <Icon size={20} />
                      </a>
                    );
                  })}
                  {config?.whatsapp_number && (
                    <button
                      onClick={() => handleWhatsAppClick(config.whatsapp_number!)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-all hover:scale-110 shadow-md"
                      style={{ backgroundColor: '#25D366' }}
                      title="WhatsApp"
                    >
                      <FaWhatsapp size={20} />
                    </button>
                  )}
                  {config?.whatsapp_24_7 && (
                    <div className="relative">
                      <span className="absolute inset-[-2px] rounded-full animate-spin-slow">
                        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 to-yellow-400 opacity-60 blur-[2px]"></span>
                      </span>
                      <button
                        onClick={() => handleWhatsAppClick(config.whatsapp_24_7!)}
                        className="relative w-10 h-10 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-all hover:scale-110 shadow-md animate-wiggle"
                        style={{ backgroundColor: '#128C7E' }}
                        title="WhatsApp 24/7"
                      >
                        <FaWhatsapp size={20} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/" className="text-gray-300 hover:text-[#D91E7A] transition-colors">
                    Inicio
                  </a>
                </li>
                <li>
                  <a href="/productos" className="text-gray-300 hover:text-[#D91E7A] transition-colors">
                    Productos
                  </a>
                </li>
                <li>
                  <a href="#nosotros" className="text-gray-300 hover:text-[#D91E7A] transition-colors">
                    Nosotros
                  </a>
                </li>
                <li>
                  <a href="#contacto" className="text-gray-300 hover:text-[#D91E7A] transition-colors">
                    Contacto
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Contáctanos</h4>
              <ul className="space-y-3">
                {config?.email && (
                  <li className="flex items-center gap-2 text-gray-300">
                    <Mail size={18} className="flex-shrink-0" />
                    <span>{config.email}</span>
                  </li>
                )}
                {locations.slice(0, 2).map((location) => (
                  <li key={location.id} className="space-y-2">
                    <div className="flex items-start gap-2 text-gray-300">
                      <MapPin size={18} className="flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold">{location.name}</p>
                        <p>{location.address}</p>
                      </div>
                    </div>
                    {location.phone && (
                      <div className="flex items-center gap-2 text-gray-300 ml-6">
                        <Phone size={18} className="flex-shrink-0" />
                        <span>{location.phone}</span>
                      </div>
                    )}
                  </li>
                ))}
                {hours.length > 0 && (
                  <li className="pt-2 border-t border-white/10">
                    <div className="text-gray-300 text-sm space-y-1">
                      <p className="font-semibold mb-1">Horarios:</p>
                      {hours.map((hour) => (
                        <p key={hour.id}>
                          {daysOfWeek[hour.day_of_week]}:{' '}
                          {hour.is_closed
                            ? 'Cerrado'
                            : `${hour.open_time} - ${hour.close_time}`}
                        </p>
                      ))}
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-gray-400">
            <p>&copy; {currentYear} {config?.store_name || 'Mi Comercio'}. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {creatorLogoUrl && (
        <div className="bg-gray-100 py-3 border-t">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
              <span>Esta web fue creada por:</span>
              <img
                src={creatorLogoUrl}
                alt="Creator Logo"
                className="h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
