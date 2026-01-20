'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package, Play } from 'lucide-react';

interface ProductGalleryProps {
  mainImage: string;
  productName: string;
  extraImages?: string[];
  videoUrl?: string;
}

export default function ProductGallery({
  mainImage,
  productName,
  extraImages = [],
  videoUrl
}: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string>(mainImage);
  const [selectedType, setSelectedType] = useState<'image' | 'video'>('image');

  const allImages = [mainImage, ...extraImages.slice(0, 5)];

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;

    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
    }
    return null;
  };

  const handleThumbnailClick = (image: string, type: 'image' | 'video') => {
    setSelectedImage(image);
    setSelectedType(type);
  };

  return (
    <div className="space-y-4">
      <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative">
        {selectedType === 'image' ? (
          selectedImage ? (
            <Image
              src={selectedImage}
              alt={productName}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-4"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-32 h-32 text-gray-400" />
            </div>
          )
        ) : (
          <iframe
            src={getYouTubeEmbedUrl(selectedImage) || ''}
            title={productName}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      {(allImages.length > 1 || videoUrl) && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={`image-${index}`}
              onClick={() => handleThumbnailClick(image, 'image')}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                selectedImage === image && selectedType === 'image'
                  ? 'border-[#D91E7A] shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {image ? (
                <Image
                  src={image}
                  alt={`${productName} - Vista ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </button>
          ))}

          {videoUrl && getYouTubeEmbedUrl(videoUrl) && (
            <button
              onClick={() => handleThumbnailClick(videoUrl, 'video')}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                selectedImage === videoUrl && selectedType === 'video'
                  ? 'border-[#D91E7A] shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600">
                <Play className="w-10 h-10 text-white" fill="white" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] font-medium py-0.5 text-center">
                VIDEO
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
