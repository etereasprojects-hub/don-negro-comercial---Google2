"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

interface Banner {
  id: string;
  desktop_image_url: string;
  mobile_image_url: string;
  link_url: string | null;
  order: number;
}

interface BannerSliderProps {
  banners: Banner[];
}

export default function BannerSlider({ banners }: BannerSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || banners.length <= 1) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [emblaApi, banners.length]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden bg-gray-50">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.id} className="flex-[0_0_100%] min-w-0 relative">
              <div className="relative w-full aspect-[2/1] md:aspect-[8/1]">
                {/* Desktop Image */}
                <div className="hidden md:block absolute inset-0">
                  <Image
                    src={banner.desktop_image_url}
                    alt="Banner promocional"
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority
                  />
                </div>
                {/* Mobile Image */}
                <div className="md:hidden absolute inset-0">
                  <Image
                    src={banner.mobile_image_url}
                    alt="Banner promocional"
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority
                  />
                </div>
                {banner.link_url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
                    <Button
                      asChild
                      size="lg"
                      className="bg-white/90 hover:bg-white text-gray-900 shadow-lg"
                    >
                      <a
                        href={banner.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gap-2"
                      >
                        Ver más
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
            aria-label="Next banner"
          >
            <ChevronRight className="w-6 h-6 text-gray-900" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === selectedIndex
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
