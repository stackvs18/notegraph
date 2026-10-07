import React, { useMemo, useRef, useEffect } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { renderMarkdown } from '../utils/renderMarkdown';

// This component renders sanitized HTML generated from markdown text and applies syntax highlighting to code blocks.
// Step 1: Extract markdown string from props.
// Step 2: Compute rendered HTML string using renderMarkdown utility.
// Step 3: Run side-effect after rendering to apply Highlight.js syntax highlighting to code blocks.
export default function MarkdownPreview(props) {
  const markdownTextString = props.markdown;
  const containerElementRef = useRef(null);

  // Step 2: Memoize HTML rendering based on input markdown text
  const renderedHtmlString = useMemo(function () {
    return renderMarkdown(markdownTextString);
  }, [markdownTextString]);

  // Step 3: Post-rendering DOM manipulation for code syntax highlighting
  useEffect(function () {
    const containerDOMElement = containerElementRef.current;
    if (!containerDOMElement) {
      return;
    }

    // Highlight code blocks using highlight.js
    const codeBlockElements = containerDOMElement.querySelectorAll('pre code');
    for (let blockIndex = 0; blockIndex < codeBlockElements.length; blockIndex = blockIndex + 1) {
      const codeBlockElement = codeBlockElements[blockIndex];
      try {
        hljs.highlightElement(codeBlockElement);
      } catch (highlightError) {
        console.error('Highlight error:', highlightError);
      }
    }
  }, [renderedHtmlString]);

  return (
    <div
      ref={containerElementRef}
      className="markdown-preview"
      style={{
        padding: '24px',
        overflowY: 'auto',
        height: '100%',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
        color: '#1D1D1F',
        lineHeight: '1.6',
      }}
      dangerouslySetInnerHTML={{ __html: renderedHtmlString }}
    />
  );
}



