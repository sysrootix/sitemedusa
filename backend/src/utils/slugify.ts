/**
 * Utility for generating SEO-friendly URL slugs from product names
 * Supports Russian to Latin transliteration
 */

// Mapping for Russian to Latin transliteration (GOST 7.79-2000 System B)
const transliterationMap: { [key: string]: string } = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
  'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
  'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
  'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
  'я': 'ya',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
  'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
  'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts',
  'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
  'Я': 'Ya'
};

/**
 * Transliterate Russian characters to Latin
 * @param text - Text to transliterate
 * @returns Transliterated text
 */
function transliterate(text: string): string {
  return text.split('').map(char => transliterationMap[char] || char).join('');
}

/**
 * Generate URL-friendly slug from product name
 * @param name - Product name (can contain Cyrillic, Latin, numbers, special chars)
 * @param maxLength - Maximum length of the slug (default: 200)
 * @returns URL-friendly slug
 * 
 * @example
 * slugify("Картридж JustFog Minifit S (0,2 Ом) 1,9 мл") 
 * // => "kartridzh_justfog_minifit_s_0_2_om_1_9_ml"
 * 
 * slugify("POD Система OXVA XLIM PRO 30W")
 * // => "pod_sistema_oxva_xlim_pro_30w"
 */
export function slugify(name: string, maxLength: number = 200): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  let slug = name.trim();
  
  // Transliterate Cyrillic to Latin
  slug = transliterate(slug);
  
  // Convert to lowercase
  slug = slug.toLowerCase();
  
  // Replace special characters and spaces with underscores
  // Keep only: letters (a-z), numbers (0-9), and convert spaces/special chars to underscores
  slug = slug.replace(/[^a-z0-9]+/g, '_');
  
  // Remove leading/trailing underscores
  slug = slug.replace(/^_+|_+$/g, '');
  
  // Replace multiple consecutive underscores with single underscore
  slug = slug.replace(/_+/g, '_');
  
  // Truncate to max length
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Remove trailing underscore if truncation created one
    slug = slug.replace(/_+$/g, '');
  }
  
  return slug;
}

/**
 * Generate unique slug by appending shop_code if needed
 * @param name - Product name
 * @param shopCode - Shop code to append for uniqueness
 * @param maxLength - Maximum length of the slug (default: 200)
 * @returns Unique slug with shop code suffix
 */
export function slugifyWithShopCode(name: string, shopCode: string, maxLength: number = 200): string {
  const baseSlug = slugify(name, maxLength - shopCode.length - 1); // Reserve space for _shopcode
  return `${baseSlug}_${shopCode}`;
}

/**
 * Generate slug from product name and ensure uniqueness
 * This is the main function to use for product slug generation
 * @param name - Product name
 * @param shopCode - Shop code (optional, for uniqueness)
 * @returns URL-friendly unique slug
 */
export function generateProductSlug(name: string, shopCode?: string): string {
  if (shopCode) {
    return slugifyWithShopCode(name, shopCode);
  }
  return slugify(name);
}

export default { slugify, slugifyWithShopCode, generateProductSlug };



