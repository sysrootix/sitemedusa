import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductModal from '../components/ProductModal';
import type { ProductDetailsData } from '../hooks/useProductDetails';

interface ProductPageProps {
  productSlug: string;
  productId?: string | null;
  categoryPath: string[];
  initialProduct?: ProductDetailsData | null;
}

const ProductPage = ({
  productSlug,
  productId = null,
  categoryPath,
  initialProduct = null,
}: ProductPageProps) => {
  const navigate = useNavigate();

  const backUrl = useMemo(() => {
    if (!categoryPath || categoryPath.length === 0) {
      return '/catalog';
    }
    return `/catalog/${categoryPath.join('/')}`;
  }, [categoryPath]);

  const resolvedProductId = productId ?? initialProduct?.product.id ?? null;
  const resolvedProductSlug = initialProduct?.product.slug
    ? initialProduct.product.slug
    : resolvedProductId
      ? undefined
      : productSlug;

  return (
    <ProductModal
      displayMode="page"
      productId={resolvedProductId ?? undefined}
      productSlug={resolvedProductSlug}
      initialProduct={initialProduct ?? null}
      onNavigateBack={() => navigate(backUrl)}
    />
  );
};

export default ProductPage;
