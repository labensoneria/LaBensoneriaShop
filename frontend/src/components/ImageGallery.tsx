import { useState } from 'react';
import LoadingRipple from './LoadingRipple';
import type { ProductImage } from '../types';

interface Props {
  images: ProductImage[];
  name: string;
}

export default function ImageGallery({ images, name }: Props) {
  const [selected, setSelected] = useState(0);
  const [mainLoaded, setMainLoaded] = useState(false);
  const [thumbsLoaded, setThumbsLoaded] = useState<Record<string, boolean>>({});

  function handleSelect(i: number) {
    setMainLoaded(false);
    setSelected(i);
  }

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-brand-cream rounded-2xl flex items-center justify-center text-6xl">
        🧶
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square bg-brand-cream rounded-2xl overflow-hidden relative">
        {!mainLoaded && <LoadingRipple className="h-full" />}
        <img
          src={images[selected].cloudinaryUrl}
          alt={name}
          onLoad={() => setMainLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-200 ${mainLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => handleSelect(i)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === selected ? 'border-brand-green' : 'border-transparent'
              }`}
            >
              {!thumbsLoaded[img.id] && <LoadingRipple className="h-full" />}
              <img
                src={img.cloudinaryUrl}
                alt={`${name} ${i + 1}`}
                onLoad={() => setThumbsLoaded((prev) => ({ ...prev, [img.id]: true }))}
                className={`w-full h-full object-cover ${thumbsLoaded[img.id] ? 'opacity-100' : 'opacity-0'}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
