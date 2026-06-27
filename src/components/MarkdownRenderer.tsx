import { FC, useMemo } from 'react';
import ReactMarkdown, { Components, defaultUrlTransform } from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
  imageUrls?: Record<string, string>;
  className?: string;
}

const remarkPlugins = [remarkMath];
const rehypePlugins = [rehypeKatex];

const markdownComponents: Components = {
  img: ({ node, ...props }) => (
    <img 
      {...props} 
      className="max-w-full h-auto rounded-lg shadow-sm my-4 mx-auto block max-h-[60vh] object-contain" 
      loading="lazy" 
    />
  ),
  p: ({ node, ...props }) => (
    <p {...props} className="mb-2 last:mb-0 whitespace-pre-wrap" />
  ),
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" />
  ),
  ul: ({ node, ...props }) => (
    <ul {...props} className="list-disc list-inside mb-2" />
  ),
  ol: ({ node, ...props }) => (
    <ol {...props} className="list-decimal list-inside mb-2" />
  ),
  strong: ({ node, ...props }) => (
    <strong {...props} className="font-bold" />
  ),
  em: ({ node, ...props }) => (
    <em {...props} className="italic" />
  ),
  code: ({ node, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match && !className?.includes('language-');
    return isInline ? (
      <code {...props} className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-sm font-mono text-zinc-800 dark:text-zinc-200">
        {children}
      </code>
    ) : (
      <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto text-sm font-mono text-zinc-800 dark:text-zinc-200 my-4">
        <code {...props} className={className}>
          {children}
        </code>
      </pre>
    );
  }
};

const urlTransform = (url: string) => {
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return defaultUrlTransform(url);
};

export const MarkdownRenderer: FC<MarkdownRendererProps> = ({ content, imageUrls = {}, className = '' }) => {
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
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={markdownComponents}
        urlTransform={urlTransform}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
