import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CatalogHierarchicalV2 from './CatalogHierarchicalV2';
import ProductPage from './ProductPage';
import SkeletonLoader from '../components/SkeletonLoader';
import api from '../services/api';
import type { ProductDetailsData } from '../hooks/useProductDetails';
import { parseProductUrl } from '../utils/catalogUrl';

const CatalogRouter = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [{ state, product, slug }, setRouteState] = useState<{
    state: 'category' | 'product' | 'loading' | 'not_found';
    product: ProductDetailsData | null;
    slug: string | null;
  }>({ state: 'category', product: null, slug: null });

  const { categoryPath, productSlug } = parseProductUrl(location.pathname);

  useEffect(() => {
    let cancelled = false;

    const resolveRoute = async () => {
      if (!productSlug) {
        setRouteState({ state: 'category', product: null, slug: null });
        return;
      }

      setRouteState({ state: 'loading', product: null, slug: productSlug });

      try {
        const data = await api.tryGetProductBySlug(productSlug);

        if (cancelled) return;

        if (data) {
          setRouteState({ state: 'product', product: data, slug: productSlug });
        } else {
          setRouteState({ state: 'not_found', product: null, slug: productSlug });
        }
      } catch (err) {
        if (cancelled) return;
        console.warn('Product lookup failed, falling back to catalog view:', productSlug, err);
        setRouteState({ state: 'not_found', product: null, slug: productSlug });
      }
    };

    resolveRoute();

    return () => {
      cancelled = true;
    };
  }, [productSlug, location.pathname]);

  useEffect(() => {
    if (state === 'not_found') {
      const categoryPathOnly = categoryPath.length > 0 ? `/catalog/${categoryPath.join('/')}` : '/catalog';
      navigate(categoryPathOnly, { replace: true });
    }
  }, [state, categoryPath, navigate]);

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
