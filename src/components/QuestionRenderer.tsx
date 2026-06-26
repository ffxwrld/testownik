import { useState, useEffect, useMemo, FC, ReactNode } from 'react';
import { getSessionImage } from '../utils/db';

interface QuestionRendererProps {
  text: string;
  sourceFile?: string;
  sessionId?: string;
  localImages?: Record<string, Blob>;
  className?: string;
}

export const QuestionRenderer: FC<QuestionRendererProps> = ({
  text,
  sourceFile,
  sessionId,
  localImages,
  className = '',
}) => {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const urlsToRevoke: string[] = [];

    const loadImages = async () => {
      setIsLoading(true);
      const extractedFiles = new Set<string>();

      // Extract all [img] tags
      const regex = /\[img\](.*?)\[\/img\]/gi;
      let match;
      while ((match = regex.exec(text)) !== null) {
        extractedFiles.add(match[1].trim());
      }

      // Fallback: If no [img] tags, check if a file with the same name as sourceFile exists
      const hasImgTags = extractedFiles.size > 0;
      if (!hasImgTags && sourceFile) {
        const baseName = sourceFile.replace(/\.txt$/i, '');
        const possibleNames = [`${baseName}.png`, `${baseName}.jpg`, `${baseName}.jpeg`, `${baseName}.gif`];
        for (const p of possibleNames) {
          extractedFiles.add(p);
        }
      }

      const newUrls: Record<string, string> = {};

      for (const fileName of Array.from(extractedFiles)) {
        let blob: Blob | undefined;
        
        if (localImages) {
          // If we have localImages (e.g. from CreatorView)
          const key = Object.keys(localImages).find(k => k.toLowerCase() === fileName.toLowerCase());
          if (key) blob = localImages[key];
        } else if (sessionId) {
          // Fetch from IndexedDB (exact match first)
          blob = await getSessionImage(sessionId, fileName);
          
          // Case sensitivity fallback
          if (!blob) {
            blob = await getSessionImage(sessionId, fileName.toUpperCase());
            if (!blob) blob = await getSessionImage(sessionId, fileName.toLowerCase());
          }
        }

        if (blob && isMounted) {
          const url = URL.createObjectURL(blob);
          urlsToRevoke.push(url);
          newUrls[fileName] = url;
          if (!hasImgTags) break; // If this was a fallback check, stop at the first found extension
        }
      }

      if (isMounted) {
        setImageUrls(newUrls);
        setIsLoading(false);
      }
    };

    loadImages();

    return () => {
      isMounted = false;
      urlsToRevoke.forEach(URL.revokeObjectURL);
    };
  }, [text, sourceFile, sessionId, localImages]);

  // Parse text into parts (text and images) — memoized
  const { parts, fallbackNode } = useMemo(() => {
    const parts: ReactNode[] = [];
    const regex = /\[img\](.*?)\[\/img\]/gi;
    let lastIndex = 0;
    let match;
    let hasParsedTags = false;

    while ((match = regex.exec(text)) !== null) {
      hasParsedTags = true;
      
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
      }
      
      const fileName = match[1].trim();
      const url = imageUrls[fileName];
      
      if (url) {
        parts.push(
          <div key={`img-container-${match.index}`} className="my-3 flex justify-center">
            <img
              src={url}
              alt={fileName}
              className="max-w-full h-auto max-h-96 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 object-contain"
            />
          </div>
        );
      } else {
        if (isLoading) {
          parts.push(
            <span key={`loading-${match.index}`} className="inline-block px-2 py-1 mx-1 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-700 animate-pulse">
              [Ładowanie obrazka...]
            </span>
          );
        } else {
          parts.push(
            <span key={`missing-${match.index}`} className="inline-block px-2 py-1 mx-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded border border-red-200 dark:border-red-800/50">
              [Brak obrazka: {fileName}]
            </span>
          );
        }
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
    }

    // Handle fallback if no [img] tags were in text, but we found a matching image
    let fallbackNode: ReactNode = null;
    if (!hasParsedTags && Object.keys(imageUrls).length > 0) {
      const firstUrl = Object.values(imageUrls)[0];
      fallbackNode = (
        <div className="mt-4 flex justify-center animate-fadeIn">
          <img 
            src={firstUrl} 
            alt="Obrazek do pytania" 
            className="max-w-full h-auto max-h-96 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 object-contain" 
          />
        </div>
      );
    }

    return { parts, fallbackNode };
  }, [text, imageUrls, isLoading]);

  return (
    <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>
      {parts}
      {fallbackNode}
    </div>
  );
};
