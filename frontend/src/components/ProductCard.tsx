import { useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingRipple from './LoadingRipple';
import type { Product } from '../types';

interface Props {
  product: Product;
  newProductDays?: number;
}

export default function ProductCard({ product, newProductDays = 14 }: Props) {
  const thumb = product.images[0]?.cloudinaryUrl;
  const price = parseFloat(product.price).toFixed(2);
  const isNew = (Date.now() - new Date(product.publishedAt).getTime()) < newProductDays * 24 * 60 * 60 * 1000;
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Link to={`/productos/${product.id}`} className="card">
      <div className="card__shine" />
      <div className="card__glow" />
      {isNew && <span className="card__badge">Nuevo!</span>}

      <div className="card__content">
        <div className="card__image">
          {thumb ? (
            <>
              {!imageLoaded && <LoadingRipple className="h-full" />}
              <img
                src={thumb}
                alt={product.name}
                onLoad={() => setImageLoaded(true)}
                className={imageLoaded ? '' : 'opacity-0'}
              />
            </>
          ) : (
            <div className="card__image-placeholder">🧶</div>
          )}
        </div>

        <div className="card__text">
          <h3 className="card__title">{product.name}</h3>
          {product.convertibleToKeychain && (
            <p className="card__description">+ versión llavero disponible</p>
          )}
        </div>

        <div className="card__footer">
          <span className="card__price">{price} €</span>
          <div className="card__button">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
