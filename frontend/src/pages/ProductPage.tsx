import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductModal from '../components/ProductModal';
import type { ProductDetailsData } from '../hooks/useProductDetails';

interface ProductPageProps {
  productSlug: string;
  categoryPath: string[];
  initialProduct?: ProductDetailsData | null;
}

const ProductPage = ({ productSlug, categoryPath, initialProduct = null }: ProductPageProps) => {
  const navigate = useNavigate();

  const backUrl = useMemo(() => {
    if (!categoryPath || categoryPath.length === 0) {
      return '/catalog';
    }
    return `/catalog/${categoryPath.join('/')}`;
  }, [categoryPath]);

  return (
    <ProductModal
      displayMode="page"
      productSlug={productSlug}
      initialProduct={initialProduct ?? null}
      onNavigateBack={() => navigate(backUrl)}
    />
  );
};

export default ProductPage;
