import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  inline = false,
}) => {
  if (!content) return null;

  // Render a single LaTeX formula safely
  const renderFormula = (latex: string, isBlock: boolean) => {
    try {
      const html = katex.renderToString(latex.trim(), {
        displayMode: isBlock,
        throwOnError: false,
        output: 'html',
      });
      return (
        <span
          key={Math.random()}
          className={isBlock ? 'my-2 block overflow-x-auto py-1 font-mono-code' : 'inline-block px-0.5 align-middle'}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch {
      return (
        <code key={Math.random()} className="bg-amber-100 px-1 text-black">
          {latex}
        </code>
      );
    }
  };

  // Parse text that might have $$...$$, $...$, and markdown bold (**...**)
  const parseParagraph = (text: string) => {
    // Split by block math $$...$$ first
    const blockParts = text.split(/(\$\$[\s\S]*?\$\$)/g);

    return blockParts.map((blockPart, bIdx) => {
      if (blockPart.startsWith('$$') && blockPart.endsWith('$$')) {
        const mathContent = blockPart.slice(2, -2);
        return renderFormula(mathContent, true);
      }

      // Inside non-block, parse inline math $...$
      const inlineParts = blockPart.split(/(\$[^$\n]+?\$)/g);
      return (
        <span key={bIdx}>
          {inlineParts.map((inlinePart) => {
            if (inlinePart.startsWith('$') && inlinePart.endsWith('$')) {
              const mathContent = inlinePart.slice(1, -1);
              return renderFormula(mathContent, false);
            }

            // Parse simple markdown bold **text**
            const boldParts = inlinePart.split(/(\*\*.*?\*\*)/g);
            return boldParts.map((boldPart, boldIdx) => {
              if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                return (
                  <strong key={boldIdx} className="font-bold text-black">
                    {boldPart.slice(2, -2)}
                  </strong>
                );
              }
              return <React.Fragment key={boldIdx}>{boldPart}</React.Fragment>;
            });
          })}
        </span>
      );
    });
  };

  if (inline) {
    return <span className={`inline-math ${className}`}>{parseParagraph(content)}</span>;
  }

  // Split content by newlines into paragraphs
  const paragraphs = content.split('\n');

  return (
    <div className={`space-y-2 leading-relaxed text-neutral-900 ${className}`}>
      {paragraphs.map((p, idx) => {
        const trimmed = p.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }
        // Check if list item
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const isNumbered = /^\d+\.\s/.test(trimmed);

        return (
          <div
            key={idx}
            className={`${
              isBullet ? 'pl-4 flex items-start gap-1.5' : isNumbered ? 'pl-2' : ''
            }`}
          >
            {isBullet && <span className="font-bold text-black select-none">•</span>}
            <div className="flex-1">
              {parseParagraph(isBullet ? trimmed.slice(2) : trimmed)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
