"use client";

import React, { useState, useEffect } from "react";
import { ImageIcon, Loader2 } from "lucide-react";

interface FastraxLiveImageProps {
  sku: string;
  className?: string;
}

export default function FastraxLiveImage({ sku, className = "" }: FastraxLiveImageProps) {
  const [imgData, setImgData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      if (!sku) return;
      try {
        const res = await fetch('/api/fastrax/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ope: 3, sku: sku, img: 1 })
        });
        const data = await res.json();
        if (data.imageData) {
          setImgData(data.imageData);
        } else {
          setError(true);
        }
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [sku]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-800 animate-pulse ${className}`}>
        <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
      </div>
    );
  }

  if (error || !imgData) {
    return (
      <div className={`flex items-center justify-center bg-slate-900 border border-slate-800 ${className}`}>
        <ImageIcon className="w-6 h-6 text-slate-700" />
      </div>
    );
  }

  return (
    <img 
      src={imgData} 
      alt={`SKU ${sku}`} 
      className={`object-contain ${className}`}
      loading="lazy"
    />
  );
}