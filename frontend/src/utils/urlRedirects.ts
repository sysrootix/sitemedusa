/**
 * URL redirects configuration for legacy category URLs
 *
 * This file contains mappings from old category slugs to new category slugs
 * to maintain backward compatibility with old URLs from the previous site.
 */

/**
 * Category slug redirects map
 * Key: Old category slug path (as it appears in URL)
 * Value: New category slug path (what it should redirect to)
 */
export const categoryRedirects: Record<string, string> = {
  // Картриджи испарители -> Картриджи испарители для под-систем
  // Важно: более специфичные пути должны быть ПЕРВЫМИ
  'vape_industriya/kartridzhi_ispariteli/kartridzhi': 'vape_industriya/kartridzhi_ispariteli_dlya_pod-sistem/kartridzhi',
  'vape_industriya/kartridzhi_ispariteli': 'vape_industriya/kartridzhi_ispariteli_dlya_pod-sistem',

  // Можно добавить другие редиректы здесь
  // 'old/category/path': 'new/category/path',
};

/**
 * Checks if a given category path needs to be redirected
 * @param categoryPath - Category path from URL (e.g., "vape_industriya/kartridzhi_ispariteli")
 * @returns Redirected path if found, null otherwise
 */
export function checkCategoryRedirect(categoryPath: string): string | null {
  // Direct match
  if (categoryRedirects[categoryPath]) {
    return categoryRedirects[categoryPath];
  }

  // Check if any part of the path needs redirecting
  // This handles cases where the URL has product slug at the end
  for (const [oldPath, newPath] of Object.entries(categoryRedirects)) {
    // Check if path starts with old path followed by / (to avoid partial matches)
    const oldPathWithSlash = oldPath + '/';
    const newPathWithSlash = newPath + '/';

    if (categoryPath.startsWith(oldPathWithSlash)) {
      // Skip if already using new path (avoid double redirect)
      if (categoryPath.startsWith(newPathWithSlash)) {
        continue;
      }
      // Replace only the beginning part
      return newPath + categoryPath.substring(oldPath.length);
    }
  }

  return null;
}

/**
 * Builds a full redirect URL based on original pathname
 * @param pathname - Original URL pathname
 * @param categoryPath - Category path that needs redirecting
 * @param redirectedPath - New category path
 * @returns Full redirect pathname
 */
export function buildRedirectUrl(
  pathname: string,
  categoryPath: string,
  redirectedPath: string
): string {
  // Replace the old category path with the new one in the full pathname
  return pathname.replace(
    `/catalog/${categoryPath}`,
    `/catalog/${redirectedPath}`
  );
}
