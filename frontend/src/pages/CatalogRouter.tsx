import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import CatalogHierarchicalV2 from './CatalogHierarchicalV2';
import ProductPage from './ProductPage';
import SkeletonLoader from '../components/SkeletonLoader';
import api from '../services/api';
import type { ProductDetailsData } from '../hooks/useProductDetails';
import { parseProductUrl } from '../utils/catalogUrl';

const CatalogRouter = () => {
  const location = useLocation();
  const [{ state, product, slug }, setRouteState] = useState<{
    state: 'category' | 'product' | 'loading';
    product: ProductDetailsData | null;
    slug: string | null;
  }>({ state: 'category', product: null, slug: null });

  const { categoryPath, productSlug } = parseProductUrl(location.pathname);

  useEffect(() => {
    let cancelled = false;

    if (!productSlug) {
      setRouteState({ state: 'category', product: null, slug: null });
      return;
    }

    setRouteState({ state: 'loading', product: null, slug: productSlug });

    api.getProductBySlug(productSlug)
      .then((data) => {
        if (cancelled) return;
        setRouteState({ state: 'product', product: data, slug: productSlug });
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Product not found for slug, falling back to catalog view:', productSlug, err);
        setRouteState({ state: 'category', product: null, slug: null });
      });

    return () => {
      cancelled = true;
    };
  }, [productSlug, location.pathname]);

  if (state === 'loading') {
    return (
      <div className="py-16 flex justify-center">
        <SkeletonLoader variant="product-modal" count={1} />
      </div>
    );
  }

  if (state === 'product' && slug) {
    return (
      <ProductPage
        productSlug={slug}
        categoryPath={categoryPath}
        initialProduct={product}
      />
    );
  }

  return <CatalogHierarchicalV2 />;
};

export default CatalogRouter;
