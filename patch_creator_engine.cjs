const fs = require('fs');

let content = fs.readFileSync('src/hooks/useCreatorEngine.ts', 'utf8');

// Replace arguments
content = content.replace(
  'initialImages?: Record<string, Blob>,',
  'initialImageNames?: string[],\n  sourceSessionId?: string'
);

// Replace state
content = content.replace(
  'const [images, setImages] = useState<Record<string, Blob>>(initialImages || {});',
  `const [images, setImages] = useState<Record<string, Blob>>({});
  const [existingImages, setExistingImages] = useState<Set<string>>(new Set(initialImageNames || []));
  const [deletedImages, setDeletedImages] = useState<Set<string>>(new Set());`
);

// Update activeImageKey to check both
content = content.replace(
  'const foundKey = Object.keys(images).find(k => k.toLowerCase() === tagFileName);',
  `let foundKey = Object.keys(images).find(k => k.toLowerCase() === tagFileName);
      if (!foundKey) {
        foundKey = Array.from(existingImages).find(k => k.toLowerCase() === tagFileName);
      }`
);

content = content.replace(
  `return Object.keys(images).find(k => {`,
  `const allKeys = [...Object.keys(images), ...Array.from(existingImages)];
    return allKeys.find(k => {`
);

// Update activeImageUrl useEffect
content = content.replace(
  `useEffect(() => {
    if (!activeImageKey || !images[activeImageKey]) {
      setActiveImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(images[activeImageKey]);
    setActiveImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [activeImageKey, images]);`,
  `useEffect(() => {
    if (!activeImageKey) {
      setActiveImageUrl(null);
      return;
    }
    let isMounted = true;
    let url: string | null = null;
    
    if (images[activeImageKey]) {
      url = URL.createObjectURL(images[activeImageKey]);
      setActiveImageUrl(url);
    } else if (existingImages.has(activeImageKey) && sourceSessionId) {
       import('../utils/db').then(({ getSessionImage }) => {
          getSessionImage(sourceSessionId, activeImageKey).then(blob => {
             if (blob && isMounted) {
                url = URL.createObjectURL(blob);
                setActiveImageUrl(url);
             }
          });
       });
    } else {
      setActiveImageUrl(null);
    }
    
    return () => {
      isMounted = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [activeImageKey, images, existingImages, sourceSessionId]);`
);

// handleImageUpload
content = content.replace(
  `const handleImageUpload = (file: File) => {`,
  `const handleImageUpload = (file: File) => {
    // If it overwrites an existing image, we don't necessarily delete it from existingImages,
    // because new images override them anyway when rendering, but to be safe:`
);

// handleImageDelete
content = content.replace(
  `const handleImageDelete = () => {
    if (!activeImageKey || !activeQuestion) return;
    setImages(prev => {
      const next = { ...prev };
      delete next[activeImageKey];
      return next;
    });`,
  `const handleImageDelete = () => {
    if (!activeImageKey || !activeQuestion) return;
    setImages(prev => {
      const next = { ...prev };
      delete next[activeImageKey];
      return next;
    });
    setDeletedImages(prev => new Set(prev).add(activeImageKey));
    setExistingImages(prev => {
      const next = new Set(prev);
      next.delete(activeImageKey);
      return next;
    });`
);

// return object
content = content.replace(
  `images, setImages,`,
  `images, setImages, existingImages, deletedImages, sourceSessionId,`
);

fs.writeFileSync('src/hooks/useCreatorEngine.ts', content);
