"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useMemo, useCallback } from "react";
import { HighResChartViewer } from "@/components/high-res-chart-viewer";
import { ZoomIn } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Detects whether content is HTML or Markdown and renders it appropriately.
 *
 * - If content starts with `<` (after trimming whitespace) and contains HTML tags,
 *   render as HTML with dangerouslySetInnerHTML (legacy seeded content).
 * - Otherwise, render as Markdown with react-markdown + GFM support.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const [imageError, setImageError] = useState<Set<string>>(new Set());
  // Image currently opened in the high-res viewer (null = viewer closed)
  const [viewerImage, setViewerImage] = useState<{ src: string; alt: string } | null>(null);

  const isHtml = useMemo(() => {
    const trimmed = content.trim();
    // Heuristic: if it starts with an HTML tag and contains closing tags
    return (
      trimmed.startsWith("<") &&
      /<\/?[a-z][\s\S]*>/i.test(trimmed) &&
      !trimmed.startsWith("<#") // not a markdown heading
    );
  }, [content]);

  const openViewer = useCallback((src: string, alt: string) => {
    setViewerImage({ src, alt });
  }, []);

  const closeViewer = useCallback(() => {
    setViewerImage(null);
  }, []);

  if (!content || content.trim() === "") {
    return (
      <div className={`${className || ""} text-muted-foreground italic`}>
        Contenido no disponible
      </div>
    );
  }

  if (isHtml) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Render tables with shadcn-like styling
          table: ({ children, ...props }) => (
            <div className="my-4 overflow-x-auto">
              <table
                className="w-full border-collapse text-sm"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-navy text-white">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-navy/20 px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-slate-200 dark:border-slate-700 px-3 py-2">
              {children}
            </td>
          ),
          // Style headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-navy dark:text-white mt-6 mb-3 pb-2 border-b-2 border-amber-500">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-navy dark:text-white mt-5 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-navy dark:text-white mt-4 mb-2">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-navy dark:text-white mt-3 mb-1">
              {children}
            </h4>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="my-2 leading-relaxed text-sm">{children}</p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc pl-6 my-2 space-y-1 text-sm">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 my-2 space-y-1 text-sm">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          // Code blocks
          code: ({ className: codeClass, children, ...props }) => {
            const isInline = !codeClass;
            return isInline ? (
              <code
                className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-amber-700 dark:text-amber-400"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className={codeClass} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-3 text-xs">
              {children}
            </pre>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-amber-500 pl-4 my-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          // Links
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-700 dark:text-amber-400 underline"
            >
              {children}
            </a>
          ),
          // Images - render with high-res support, click-to-zoom, and error fallback
          img: ({ src, alt }) => {
            const srcStr = typeof src === "string" ? src : "";
            if (imageError.has(srcStr)) {
              return (
                <span className="text-xs text-muted-foreground italic">
                  [Imagen no disponible: {alt}]
                </span>
              );
            }
            return (
              <figure
                className="my-4 relative group cursor-zoom-in"
                onClick={() => openViewer(srcStr, alt || "")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openViewer(srcStr, alt || "");
                  }
                }}
                aria-label={`Ampliar imagen: ${alt || ""}`}
              >
                <img
                  src={src}
                  alt={alt || ""}
                  className="w-full max-h-[70vh] object-contain rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-shadow group-hover:shadow-md"
                  onError={() =>
                    setImageError((prev) => new Set(prev).add(srcStr))
                  }
                />
                {/* Zoom hint overlay */}
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <ZoomIn className="size-3" />
                  <span>Ampliar</span>
                </div>
                {alt && (
                  <figcaption className="text-xs text-muted-foreground italic mt-1.5 text-center">
                    {alt}
                  </figcaption>
                )}
              </figure>
            );
          },
          // Horizontal rule
          hr: () => <hr className="my-4 border-slate-200 dark:border-slate-700" />,
          // Strong / emphasis
          strong: ({ children }) => (
            <strong className="font-bold text-navy dark:text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>

      {/* High-resolution chart viewer for images in this markdown content */}
      {viewerImage && (
        <HighResChartViewer
          charts={[
            {
              type: "ENRC",
              name: viewerImage.alt,
              file: viewerImage.alt,
              url: viewerImage.src,
            },
          ]}
          initialIndex={0}
          isOpen={true}
          onClose={closeViewer}
          airportIcao="ENR 6.1"
          airportName="Carta de Navegación en Ruta"
        />
      )}
    </div>
  );
}
