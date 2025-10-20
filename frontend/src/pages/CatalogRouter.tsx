import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CatalogHierarchicalV2 from './CatalogHierarchicalV2';
import ProductPage from './ProductPage';
import SkeletonLoader from '../components/SkeletonLoader';
import api from '../services/api';
import type { ProductDetailsData } from '../hooks/useProductDetails';
import { parseProductUrl, buildProductUrl } from '../utils/catalogUrl';

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
        console.log('[CatalogRouter] No product slug detected, showing catalog view.');
        setRouteState({ state: 'category', product: null, slug: null });
        return;
      }

      console.log('[CatalogRouter] Resolving product slug:', productSlug);
      setRouteState({ state: 'loading', product: null, slug: productSlug });

      try {
        const data = await api.tryGetProductBySlug(productSlug);

        if (cancelled) return;

        if (data) {
          const backendSlug = data.product?.slug;
          if (backendSlug && backendSlug !== productSlug) {
            const canonicalPath = buildProductUrl(
              backendSlug,
              data.product?.characteristics?.full_path || data.product?.category_path || (categoryPath.length > 0 ? categoryPath.join('/') : null)
            );
            console.log('[CatalogRouter] Slug mismatch detected. Redirecting to canonical path:', canonicalPath);
            navigate(canonicalPath, { replace: true });
            return;
          }

          console.log('[CatalogRouter] Product resolved, showing product page:', data.product?.id);
          setRouteState({ state: 'product', product: data, slug: productSlug });
        } else {
          console.warn('[CatalogRouter] Product not found, will fallback to category view:', productSlug);
          setRouteState({ state: 'not_found', product: null, slug: productSlug });
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[CatalogRouter] Product lookup failed:', productSlug, err);
        setRouteState({ state: 'not_found', product: null, slug: productSlug });
      }
    };

    resolveRoute();

    return () => {
      cancelled = true;
    };
  }, [productSlug, location.pathname, categoryPath, navigate]);

  useEffect(() => {
    if (state === 'not_found') {
      const categoryPathOnly = categoryPath.length > 0 ? `/catalog/${categoryPath.join('/')}` : '/catalog';
      console.log('[CatalogRouter] Redirecting to category due to missing product:', categoryPathOnly);
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
