import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CatalogHierarchicalV2 from './CatalogHierarchicalV2';
import ProductPage from './ProductPage';
import SkeletonLoader from '../components/SkeletonLoader';
import api from '../services/api';
import type { ProductDetailsData } from '../hooks/useProductDetails';
import { parseProductUrl, buildProductUrl, extractProductIdFromSlug, buildFallbackProductSlug } from '../utils/catalogUrl';

const buildCanonicalProductPath = (
  product: ProductDetailsData,
  slug: string,
  existingCategoryPath: string[]
) => {
  const categoryPath =
    product.product.characteristics?.full_path ||
    (product.product as any)?.category_path ||
    (existingCategoryPath.length > 0 ? existingCategoryPath.join('/') : null);

  return buildProductUrl(slug, categoryPath);
};

const CatalogRouter = () => {
  const location = useLocation();
  const locationState = (location.state as { fallbackProductId?: string } | null) ?? null;
  const navigate = useNavigate();
  const hasRedirectedRef = useRef(false);
  const processedPathRef = useRef<string | null>(null);
  const [{ state, product, slug }, setRouteState] = useState<{
    state: 'category' | 'product' | 'loading' | 'not_found';
    product: ProductDetailsData | null;
    slug: string | null;
  }>({ state: 'category', product: null, slug: null });

  const { categoryPath, productSlug } = useMemo(
    () => parseProductUrl(location.pathname),
    [location.pathname]
  );

  useEffect(() => {
    if (processedPathRef.current === location.pathname) {
      return;
    }

    let cancelled = false;
    hasRedirectedRef.current = false;
    processedPathRef.current = location.pathname;

    const resolveRoute = async () => {
      if (!productSlug) {
        console.log('[CatalogRouter] No product slug detected, showing catalog view.');
        setRouteState({ state: 'category', product: null, slug: null });
        processedPathRef.current = location.pathname;
        return;
      }

      console.log('[CatalogRouter] Resolving product slug:', productSlug);
      setRouteState({ state: 'loading', product: null, slug: productSlug });

      try {
        const data = await api.tryGetProductBySlug(productSlug);

        if (cancelled) return;

        if (data) {
          console.log('[CatalogRouter] Product resolved, showing product page:', data.product?.id);
          const backendSlug = data.product?.slug;
          if (
            backendSlug &&
            backendSlug !== productSlug &&
            !cancelled &&
            !hasRedirectedRef.current
          ) {
            const canonicalPath = buildCanonicalProductPath(data, backendSlug, categoryPath);
            const canonicalSlug = canonicalPath.replace(/^\/catalog\/?/, '').split('/').filter(Boolean).pop();

            if (canonicalSlug && canonicalSlug !== productSlug && canonicalPath !== location.pathname) {
              console.log('[CatalogRouter] Redirecting to canonical product path:', canonicalPath);
              hasRedirectedRef.current = true;
              setRouteState({ state: 'loading', product: null, slug: canonicalSlug });
              navigate(canonicalPath, { replace: true });
              return;
            }
          }

          setRouteState({ state: 'product', product: data, slug: productSlug });
          processedPathRef.current = location.pathname;
        } else {
          const fallbackProductId =
            extractProductIdFromSlug(productSlug) ||
            locationState?.fallbackProductId ||
            null;

          if (fallbackProductId) {
            try {
              const productById = await api.getProductById(fallbackProductId);
              if (cancelled) return;

              if (productById?.product?.id) {
                const backendSlug = productById.product.slug;
                const preferredSlug = backendSlug
                  ? backendSlug
                  : buildFallbackProductSlug(productById.product.name, productById.product.id);

                if (
                  backendSlug &&
                  backendSlug !== productSlug &&
                  !cancelled &&
                  !hasRedirectedRef.current
                ) {
                  const canonicalPath = buildCanonicalProductPath(productById, backendSlug, categoryPath);
                  console.log('[CatalogRouter] Redirecting to backend slug after ID lookup:', canonicalPath);
                  hasRedirectedRef.current = true;
                  setRouteState({ state: 'loading', product: null, slug: backendSlug });
                  navigate(canonicalPath, { replace: true, state: { fallbackProductId } });
                  return;
                }

                if (
                  !backendSlug &&
                  preferredSlug !== productSlug &&
                  !cancelled &&
                  !hasRedirectedRef.current
                ) {
                  const fallbackPath = buildCanonicalProductPath(productById, preferredSlug, categoryPath);
                  console.log('[CatalogRouter] Redirecting to fallback slug with embedded ID:', fallbackPath);
                  hasRedirectedRef.current = true;
                  setRouteState({ state: 'loading', product: null, slug: preferredSlug });
                  navigate(fallbackPath, { replace: true, state: { fallbackProductId } });
                  return;
                }

                console.log('[CatalogRouter] Product resolved by ID fallback:', fallbackProductId);
                setRouteState({ state: 'product', product: productById, slug: preferredSlug });
                processedPathRef.current = location.pathname;
                return;
              }
            } catch (fallbackErr) {
              if (!cancelled) {
                console.error('[CatalogRouter] Fallback lookup by product ID failed:', fallbackProductId, fallbackErr);
              }
            }
          }

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
  }, [productSlug, location.pathname, categoryPath, navigate, locationState?.fallbackProductId]);

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
        productId={product?.product?.id}
        categoryPath={categoryPath}
        initialProduct={product}
      />
    );
  }

  return <CatalogHierarchicalV2 />;
};

export default CatalogRouter;
