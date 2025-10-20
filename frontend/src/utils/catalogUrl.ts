/**
 * Utility functions for building and parsing hierarchical catalog URLs
 * 
 * URL Structure:
 * - Categories: /catalog/category1/category2/category3
 * - Products: /catalog/category1/category2/product-slug
 * 
 * Product details are resolved by slug. Legacy URLs with query params are
 * redirected to the new structure.
 */

/**
 * Transliteration map for Cyrillic to Latin
 */
const translitMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
  'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
};

/**
 * Converts a string to URL-friendly slug with transliteration
 * @param text - Text to slugify
 * @returns URL-friendly slug
 */
export function slugify(text: string): string {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Transliterate Cyrillic to Latin
    .split('')
    .map(char => translitMap[char] || char)
    .join('')
    // Replace spaces, slashes, and special chars with underscores
    .replace(/[\s\/\\,.:;!?()[\]{}'"]+/g, '_')
    // Remove all non-alphanumeric characters except underscores and hyphens
    .replace(/[^a-z0-9\-_]/g, '')
    // Replace multiple underscores with single underscore
    .replace(/_{2,}/g, '_')
    // Replace multiple hyphens with single hyphen
    .replace(/-{2,}/g, '-')
    // Remove leading/trailing underscores and hyphens
    .replace(/^[\-_]+|[\-_]+$/g, '')
    // Limit length to avoid extremely long URLs
    .substring(0, 100);
}

/**
 * Builds hierarchical category path from full_path string
 * @param fullPath - Full category path like "Вейп индустрия > Картриджи испарители > Картриджи"
 * @returns Array of slugified category names
 */
export function buildCategoryPath(fullPath: string | null | undefined): string[] {
  if (!fullPath || typeof fullPath !== 'string') return [];
  
  let parts: string[];

  if (fullPath.includes('>')) {
    parts = fullPath.split('>');
  } else if (fullPath.includes('/')) {
    parts = fullPath.split('/');
  } else {
    parts = [fullPath];
  }

  return parts
    .map(part => part.trim())
    .filter(Boolean)
    .map(slugify)
    .filter(slug => slug.length > 0); // Remove empty slugs
}

/**
 * Builds full product URL with hierarchical categories
 * @param productSlug - Product slug
 * @param categoryPath - Full category path (e.g., "Вейп индустрия > Картриджи испарители > Картриджи")
 * @returns Full URL path like /catalog/vape_industriya/kartridzhi_ispariteli/kartridzhi/product-slug
 */
export function buildProductUrl(
  productSlug: string,
  categoryPath?: string | null
): string {
  const categories = buildCategoryPath(categoryPath);
  
  if (categories.length === 0) {
    // If no category path, use simple structure
    return `/catalog/${productSlug}`;
  }
  
  return `/catalog/${categories.join('/')}/${productSlug}`;
}

const FALLBACK_SLUG_DELIMITER = '--pid-';

export function buildFallbackProductSlug(name: string | null | undefined, id: string): string {
  const base = slugify(name ?? '') || 'product';
  const safeId = id.trim();
  return `${base}${FALLBACK_SLUG_DELIMITER}${safeId}`;
}

export function extractProductIdFromSlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const delimiterIndex = slug.indexOf(FALLBACK_SLUG_DELIMITER);
  if (delimiterIndex === -1) {
    return null;
  }
  const extracted = slug.slice(delimiterIndex + FALLBACK_SLUG_DELIMITER.length).trim();
  return extracted.length > 0 ? extracted : null;
}

/**
 * Builds category URL
 * @param categoryPath - Full category path
 * @returns Full URL path
 */
export function buildCategoryUrl(categoryPath: string | null | undefined): string {
  const categories = buildCategoryPath(categoryPath);
  
  if (categories.length === 0) {
    return '/catalog';
  }
  
  return `/catalog/${categories.join('/')}`;
}

/**
 * Parses URL path and extracts category slugs and product slug
 * @param pathname - URL pathname like /catalog/vape_industriya/kartridzhi_ispariteli/kartridzhi/product-slug
 * @returns Object with categoryPath array and productSlug
 */
export function parseProductUrl(pathname: string): {
  categoryPath: string[];
  productSlug: string | null;
} {
  // Remove /catalog prefix
  const pathWithoutCatalog = pathname.replace(/^\/catalog\/?/, '');
  
  if (!pathWithoutCatalog) {
    return { categoryPath: [], productSlug: null };
  }
  
  const parts = pathWithoutCatalog.split('/').filter(Boolean);
  
  if (parts.length === 0) {
    return { categoryPath: [], productSlug: null };
  }
  
  // Check if last part looks like a product slug
  // (products typically have longer slugs with underscores or hyphens)
  const lastPart = parts[parts.length - 1];
  
  // Heuristic: if it contains certain patterns, it's likely a product
  // We'll treat the last part as product if there are multiple parts
  if (parts.length > 1) {
    return {
      categoryPath: parts.slice(0, -1),
      productSlug: lastPart
    };
  }
  
  // Single part - could be either category or product
  // We'll check later via API
  return {
    categoryPath: [],
    productSlug: lastPart
  };
}

/**
 * Parses URL path and extracts only category path
 * @param pathname - URL pathname
 * @returns Array of category slugs
 */
export function parseCategoryUrl(pathname: string): string[] {
  const pathWithoutCatalog = pathname.replace(/^\/catalog\/?/, '');
  
  if (!pathWithoutCatalog) {
    return [];
  }
  
  return pathWithoutCatalog.split('/').filter(Boolean);
}

/**
 * Checks if a slug is likely a product slug (vs category slug)
 * @param slug - Slug to check
 * @returns true if likely a product slug
 */
export function isLikelyProductSlug(slug: string): boolean {
  // Products typically have longer, more descriptive slugs
  // with multiple underscores or specific patterns
  return (
    slug.length > 20 || // Long slugs are usually products
    /\d/.test(slug) || // Contains numbers (like specifications)
    slug.split('_').length > 4 // Many parts usually indicate product
  );
}

/**
 * Gets the last segment of a path (useful for breadcrumbs)
 * @param fullPath - Full category path
 * @returns Last category name
 */
export function getLastCategoryName(fullPath: string | null | undefined): string {
  if (!fullPath) return '';
  
  const parts = fullPath.split('>').map(p => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || '';
}
