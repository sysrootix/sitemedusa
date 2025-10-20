/**
 * Keyboard Layout Converter
 * Converts between Russian and English keyboard layouts
 */

// Russian to English keyboard layout mapping
const ruToEn: Record<string, string> = {
  'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u', 'ш': 'i', 'щ': 'o', 'з': 'p', 'х': '[', 'ъ': ']',
  'ф': 'a', 'ы': 's', 'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k', 'д': 'l', 'ж': ';', 'э': '\'',
  'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b', 'т': 'n', 'ь': 'm', 'б': ',', 'ю': '.',
  'Й': 'Q', 'Ц': 'W', 'У': 'E', 'К': 'R', 'Е': 'T', 'Н': 'Y', 'Г': 'U', 'Ш': 'I', 'Щ': 'O', 'З': 'P', 'Х': '{', 'Ъ': '}',
  'Ф': 'A', 'Ы': 'S', 'В': 'D', 'А': 'F', 'П': 'G', 'Р': 'H', 'О': 'J', 'Л': 'K', 'Д': 'L', 'Ж': ':', 'Э': '"',
  'Я': 'Z', 'Ч': 'X', 'С': 'C', 'М': 'V', 'И': 'B', 'Т': 'N', 'Ь': 'M', 'Б': '<', 'Ю': '>'
};

// English to Russian keyboard layout mapping
const enToRu: Record<string, string> = {
  'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 'u': 'г', 'i': 'ш', 'o': 'щ', 'p': 'з', '[': 'х', ']': 'ъ',
  'a': 'ф', 's': 'ы', 'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р', 'j': 'о', 'k': 'л', 'l': 'д', ';': 'ж', '\'': 'э',
  'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и', 'n': 'т', 'm': 'ь', ',': 'б', '.': 'ю',
  'Q': 'Й', 'W': 'Ц', 'E': 'У', 'R': 'К', 'T': 'Е', 'Y': 'Н', 'U': 'Г', 'I': 'Ш', 'O': 'Щ', 'P': 'З', '{': 'Х', '}': 'Ъ',
  'A': 'Ф', 'S': 'Ы', 'D': 'В', 'F': 'А', 'G': 'П', 'H': 'Р', 'J': 'О', 'K': 'Л', 'L': 'Д', ':': 'Ж', '"': 'Э',
  'Z': 'Я', 'X': 'Ч', 'C': 'С', 'V': 'М', 'B': 'И', 'N': 'Т', 'M': 'Ь', '<': 'Б', '>': 'Ю'
};

/**
 * Convert Russian keyboard layout to English
 */
export function russianToEnglish(text: string): string {
  return text.split('').map(char => ruToEn[char] || char).join('');
}

/**
 * Convert English keyboard layout to Russian
 */
export function englishToRussian(text: string): string {
  return text.split('').map(char => enToRu[char] || char).join('');
}

/**
 * Check if text contains mostly Russian characters
 */
export function isRussian(text: string): boolean {
  const russianChars = text.match(/[а-яА-ЯёЁ]/g);
  return russianChars ? russianChars.length > text.length / 2 : false;
}

/**
 * Check if text contains mostly English characters
 */
export function isEnglish(text: string): boolean {
  const englishChars = text.match(/[a-zA-Z]/g);
  return englishChars ? englishChars.length > text.length / 2 : false;
}

/**
 * Get alternative layout variant of the search query
 * If input is Russian, returns English variant
 * If input is English, returns Russian variant
 */
export function getAlternativeLayout(text: string): string | null {
  if (!text || text.trim().length === 0) {
    return null;
  }

  if (isRussian(text)) {
    return russianToEnglish(text);
  } else if (isEnglish(text)) {
    return englishToRussian(text);
  }

  return null;
}

/**
 * Get all possible search variants (original + alternative layout)
 */
export function getSearchVariants(text: string): string[] {
  const variants = [text];
  const alternative = getAlternativeLayout(text);
  
  if (alternative && alternative !== text) {
    variants.push(alternative);
  }

  return variants;
}

