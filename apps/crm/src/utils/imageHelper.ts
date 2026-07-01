/**
 * Resolves an image URL or relative path to the correct absolute URL.
 * If the path is relative (e.g. starting with '/uploads/'), it resolves it
 * to either the frontend local files or the backend CMS url.
 */
export const getImageUrl = (src: string | null | undefined): string => {
  if (!src) {
    return 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=150&q=80';
  }
  
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  const cleanSrc = src.startsWith('/') ? src : `/${src}`;
  
  // Check if it is an uploaded file
  if (cleanSrc.startsWith('/uploads/')) {
    const pathParts = cleanSrc.split('/').filter(Boolean); // e.g. ["uploads", "projectId", "file.png"] or ["uploads", "file.png"]
    
    // Prepend backend URL if:
    // - It has a project ID subfolder (length > 2)
    // - Or it is a backend upload like logo.png/favicon.ico (doesn't start with timestamp prefix)
    const isLocalUpload = pathParts.length === 2 && /^\d+-/.test(pathParts[1]);
    if (!isLocalUpload) {
      const backendUrl = process.env.NEXT_PUBLIC_GLOBAL_BACKEND_URL || 'http://localhost:3000';
      return `${backendUrl}${cleanSrc}`;
    }
  }
  
  // Otherwise, return as-is (relative to frontend root)
  return cleanSrc;
};
