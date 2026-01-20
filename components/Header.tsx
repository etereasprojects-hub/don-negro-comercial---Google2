'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Facebook, Instagram, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { FaTiktok, FaReddit, FaLinkedin, FaYoutube, FaWhatsapp } from 'react-icons/fa';

interface SocialMedia {
  id: string;
  platform: string;
  url: string;
  icon_name: string;
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

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsapp247, setWhatsapp247] = useState('');
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    loadStoreConfig();
    loadSocialMedia();
  }, []);

  const loadStoreConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('store_configuration')
        .select('store_name, logo_url, whatsapp_number, whatsapp_24_7')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        if (data.store_name) setStoreName(data.store_name);
        if (data.logo_url) setLogoUrl(data.logo_url);
        if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
        if (data.whatsapp_24_7) setWhatsapp247(data.whatsapp_24_7);
      }
    } catch (error) {
      console.error('Error loading store configuration:', error);
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

  const scrollToSection = (id: string) => {
    if (!isHomePage) {
      window.location.href = `/#${id}`;
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const handleWhatsAppClick = (number: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={storeName}
                className="h-16 object-contain"
              />
            ) : (
              <>
                <Image
                  src="/whatsapp_image_2025-12-11_at_20.49.07.jpeg"
                  alt={storeName}
                  width={60}
                  height={60}
                  className="rounded-lg"
                />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-[#D91E7A] to-[#6B4199] bg-clip-text text-transparent">
                    {storeName}
                  </h1>
                </div>
              </>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-700 hover:text-[#D91E7A] transition-colors font-medium"
            >
              Inicio
            </Link>
            <Link
              href="/productos"
              className="text-gray-700 hover:text-[#D91E7A] transition-colors font-medium"
            >
              Catálogo
            </Link>
            <button
              onClick={() => scrollToSection('nosotros')}
              className="text-gray-700 hover:text-[#D91E7A] transition-colors font-medium"
            >
              Nosotros
            </button>
            <button
              onClick={() => scrollToSection('contacto')}
              className="text-gray-700 hover:text-[#D91E7A] transition-colors font-medium"
            >
              Contacto
            </button>

            {(socialMedia.length > 0 || whatsappNumber || whatsapp247) && (
              <div className="flex gap-2 ml-2 pl-2 border-l border-gray-300">
                {socialMedia.map((social) => {
                  const Icon = socialIcons[social.platform] || Facebook;
                  const color = socialColors[social.platform] || '#6B4199';
                  return (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-all hover:scale-110 shadow-sm"
                      style={{ backgroundColor: color }}
                      title={social.platform}
                    >
                      <Icon size={16} />
                    </a>
                  );
                })}
                {whatsappNumber && (
                  <button
                    onClick={() => handleWhatsAppClick(whatsappNumber)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-all hover:scale-110 shadow-sm"
                    style={{ backgroundColor: '#25D366' }}
                    title="WhatsApp"
                  >
                    <FaWhatsapp size={16} />
                  </button>
                )}
                {whatsapp247 && (
                  <div className="relative">
                    <span className="absolute inset-[-2px] rounded-full animate-spin-slow">
                      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 to-yellow-400 opacity-60 blur-[2px]"></span>
                    </span>
                    <button
                      onClick={() => handleWhatsAppClick(whatsapp247)}
                      className="relative w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-all hover:scale-110 shadow-sm animate-wiggle"
                      style={{ backgroundColor: '#128C7E' }}
                      title="WhatsApp 24/7"
                    >
                      <FaWhatsapp size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 flex flex-col gap-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left text-gray-700 hover:text-[#D91E7A] transition-colors font-medium py-2"
            >
              Inicio
            </Link>
            <Link
              href="/productos"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left text-gray-700 hover:text-[#D91E7A] transition-colors font-medium py-2"
            >
              Catálogo
            </Link>
            <button
              onClick={() => scrollToSection('nosotros')}
              className="text-left text-gray-700 hover:text-[#D91E7A] transition-colors font-medium py-2"
            >
              Nosotros
            </button>
            <button
              onClick={() => scrollToSection('contacto')}
              className="text-left text-gray-700 hover:text-[#D91E7A] transition-colors font-medium py-2"
            >
              Contacto
            </button>

            {(socialMedia.length > 0 || whatsappNumber || whatsapp247) && (
              <div className="flex gap-2 pt-3 border-t border-gray-200 flex-wrap">
                {socialMedia.map((social) => {
                  const Icon = socialIcons[social.platform] || Facebook;
                  const color = socialColors[social.platform] || '#6B4199';
                  return (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-all hover:scale-110 shadow-sm"
                      style={{ backgroundColor: color }}
                      title={social.platform}
                    >
                      <Icon size={20} />
                    </a>
                  );
                })}
                {whatsappNumber && (
                  <button
                    onClick={() => handleWhatsAppClick(whatsappNumber)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-all hover:scale-110 shadow-sm"
                    style={{ backgroundColor: '#25D366' }}
                    title="WhatsApp"
                  >
                    <FaWhatsapp size={20} />
                  </button>
                )}
                {whatsapp247 && (
                  <div className="relative">
                    <span className="absolute inset-[-2px] rounded-full animate-spin-slow">
                      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 via-purple-500 to-yellow-400 opacity-60 blur-[2px]"></span>
                    </span>
                    <button
                      onClick={() => handleWhatsAppClick(whatsapp247)}
                      className="relative w-10 h-10 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-all hover:scale-110 shadow-sm animate-wiggle"
                      style={{ backgroundColor: '#128C7E' }}
                      title="WhatsApp 24/7"
                    >
                      <FaWhatsapp size={20} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
