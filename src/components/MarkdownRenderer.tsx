import { FC, useState, useMemo, memo } from 'react';
import ReactMarkdown, { Components, defaultUrlTransform } from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ZoomIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ImageLightboxModal } from './common/ImageLightboxModal';

interface MarkdownRendererProps {
  content: string;
  imageUrls?: Record<string, string>;
  className?: string;
  onImageClick?: (src: string, alt?: string) => void;
}

const remarkPlugins = [remarkMath];
const rehypePlugins = [rehypeKatex];

const urlTransform = (url: string) => {
  if (url.startsWith('blob:') || url.startsWith('data:image/')) {
    return url;
  }
  return defaultUrlTransform(url);
};

interface InteractiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  onZoom: (src: string, alt?: string) => void;
}

const InteractiveMarkdownImage: FC<InteractiveImageProps> = ({ src, alt, onZoom, ...props }) => {
  const { t } = useTranslation();
  if (!src) return null;

  return (
    <span className="group relative inline-block my-3 max-w-full text-center">
      <img
        {...props}
        src={src}
        alt={alt}
        loading="lazy"
        onClick={() => onZoom(src, alt)}
        className="max-w-full h-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs mx-auto block max-h-[60vh] object-contain cursor-zoom-in transition-transform duration-200 group-hover:scale-[1.01]"
      />
      <span className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-black/70 backdrop-blur-md text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 pointer-events-none shadow-md">
        <ZoomIn className="w-3.5 h-3.5" />
        <span>{t('components.questionRenderer.zoomHint') || 'Powiększ'}</span>
      </span>
    </span>
  );
};

export const MarkdownRenderer: FC<MarkdownRendererProps> = memo(({
  content,
  imageUrls = {},
  className = '',
  onImageClick,
}) => {
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt?: string } | null>(null);

  const handleImageZoom = (src: string, alt?: string) => {
    if (onImageClick) {
      onImageClick(src, alt);
    } else {
      setLightboxImage({ src, alt });
    }
  };

  const markdownComponents: Components = useMemo(
    () => ({
      img: ({ node, ...props }) => (
        <InteractiveMarkdownImage
          {...props}
          onZoom={handleImageZoom}
        />
      ),
      p: ({ node, ...props }) => (
        <p {...props} className="mb-2 last:mb-0 whitespace-pre-wrap leading-relaxed" />
      ),
      a: ({ node, ...props }) => (
        <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline" />
      ),
      ul: ({ node, ...props }) => (
        <ul {...props} className="list-disc list-inside mb-2 space-y-1" />
      ),
      ol: ({ node, ...props }) => (
        <ol {...props} className="list-decimal list-inside mb-2 space-y-1" />
      ),
      strong: ({ node, ...props }) => (
        <strong {...props} className="font-bold text-zinc-900 dark:text-zinc-100" />
      ),
      em: ({ node, ...props }) => (
        <em {...props} className="italic" />
      ),
      code: ({ node, className: codeClassName, children, ...props }) => {
        const match = /language-(\w+)/.exec(codeClassName || '');
        const isInline = !match && !codeClassName?.includes('language-');
        return isInline ? (
          <code {...props} className="bg-zinc-100 dark:bg-zinc-800/90 px-1.5 py-0.5 rounded-md text-sm font-mono text-zinc-800 dark:text-zinc-200 border border-zinc-200/50 dark:border-zinc-700/50">
            {children}
          </code>
        ) : (
          <pre className="bg-zinc-100 dark:bg-zinc-800/90 p-4 rounded-xl overflow-x-auto text-sm font-mono text-zinc-800 dark:text-zinc-200 my-3 border border-zinc-200/60 dark:border-zinc-700/60">
            <code {...props} className={codeClassName}>
              {children}
            </code>
          </pre>
        );
      }
    }),
    [onImageClick]
  );

  const processedContent = useMemo(() => {
    // Replace [img]...[/img] with ![image](...)
    // Also inject the resolved blob URL if available
    return content.replace(/\[img\](.*?)\[\/img\]/gi, (_, filename) => {
      const cleanFilename = filename.trim();
      const key = Object.keys(imageUrls).find(k => k.toLowerCase() === cleanFilename.toLowerCase());
      const url = key ? imageUrls[key] : cleanFilename;
      return `![${cleanFilename}](${url})`;
    });
  }, [content, imageUrls]);

  return (
    <>
      <div className={`markdown-body break-words [word-break:break-word] ${className}`}>
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={markdownComponents}
          urlTransform={urlTransform}
        >
          {processedContent}
        </ReactMarkdown>
      </div>

      <ImageLightboxModal
        isOpen={lightboxImage !== null}
        src={lightboxImage?.src || ''}
        alt={lightboxImage?.alt}
        onClose={() => setLightboxImage(null)}
      />
    </>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

