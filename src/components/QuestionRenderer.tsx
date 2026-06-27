import { useState, useEffect, useMemo, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { getSessionImage } from '../utils/db';
import { MarkdownRenderer } from './MarkdownRenderer';

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
  const { t } = useTranslation();
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const urlsToRevoke: string[] = [];

    const loadImages = async () => {
      setIsLoading(true);
      const extractedFiles = new Set<string>();

      const regex = /\[img\](.*?)\[\/img\]/gi;
      let match;
      while ((match = regex.exec(text)) !== null) {
        extractedFiles.add(match[1].trim());
      }

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
          const key = Object.keys(localImages).find(k => k.toLowerCase() === fileName.toLowerCase());
          if (key) blob = localImages[key];
        } else if (sessionId) {
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

  const hasParsedTags = useMemo(() => {
    const regex = /\[img\](.*?)\[\/img\]/gi;
    return regex.test(text);
  }, [text]);

  const fallbackNode = useMemo(() => {
    if (!hasParsedTags && Object.keys(imageUrls).length > 0) {
      const firstUrl = Object.values(imageUrls)[0];
      return (
        <div className="mt-4 flex justify-center animate-fadeIn">
          <img 
            src={firstUrl} 
            alt={t('components.questionRenderer.imageAlt')} 
            className="max-w-full h-auto max-h-[60vh] rounded-lg shadow-sm block object-contain" 
          />
        </div>
      );
    }
    return null;
  }, [hasParsedTags, imageUrls, t]);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute top-0 right-0 p-2">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full animate-pulse border border-zinc-200 dark:border-zinc-700">
            {t('components.questionRenderer.loadingImage') || 'Loading...'}
          </span>
        </div>
      )}
      <MarkdownRenderer content={text} imageUrls={imageUrls} />
      {fallbackNode}
    </div>
  );
};

