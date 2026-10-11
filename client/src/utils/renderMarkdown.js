import { marked } from 'marked';
import katex from 'katex'; // a very fast JavaScript library created by Khan Academy that renders math formulas on web pages using LaTeX syntax
import DOMPurify from 'dompurify';
import 'katex/dist/katex.min.css';

// Replacer function to convert raw mermaid diagram code blocks into mermaid.ink <img> tags
function replaceMermaidCodeBlock(matchString, diagramContentString) {
  try {
    var trimmedDiagramText = diagramContentString.trim();
    if (!trimmedDiagramText) {
      return matchString;
    }

    // Step A: Build the JSON payload object containing diagram text and theme settings
    var payloadObject = {
      code: trimmedDiagramText,
      mermaid: {
        theme: 'default'
      }
    };
    var jsonStringPayload = JSON.stringify(payloadObject);

    // Step B: Base64-encode the JSON string using browser's built-in btoa() function
    var rawBase64String = btoa(unescape(encodeURIComponent(jsonStringPayload)));

    // Step C: Convert Base64 to URL-safe Base64 using simple string replacements
    var urlSafeBase64String = rawBase64String.replace(/\+/g, '-');
    urlSafeBase64String = urlSafeBase64String.replace(/\//g, '_');
    urlSafeBase64String = urlSafeBase64String.replace(/=/g, '');

    // Step D: Construct the final mermaid.ink diagram image URL
    var mermaidImageUrl = 'https://mermaid.ink/img/' + urlSafeBase64String;

    // Step E: Return HTML image tag wrapped in a centered div container
    var imageHtmlString = '<div style="display: flex; justify-content: center; margin: 16px 0;"><img src="' + mermaidImageUrl + '" alt="diagram" style="max-width: 100%; height: auto; border-radius: 8px;" /></div>';

    return imageHtmlString;
  } catch (conversionError) {
    return matchString;
  }
}

// Replacer function for block math wrapped in $$ ... $$
function replaceBlockMathDollar(matchString, mathContentString) {
  try {
    const trimmedMathString = mathContentString.trim();
    const katexBlockOptions = {
      displayMode: true,
      throwOnError: false
    };
    return katex.renderToString(trimmedMathString, katexBlockOptions);
  } catch (katexRenderError) {
    return matchString;
  }
}

// Replacer function for block math wrapped in \[ ... \]
function replaceBlockMathBracket(matchString, mathContentString) {
  try {
    const trimmedMathString = mathContentString.trim();
    const katexBlockOptions = {
      displayMode: true,
      throwOnError: false
    };
    return katex.renderToString(trimmedMathString, katexBlockOptions);
  } catch (katexRenderError) {
    return matchString;
  }
}

// Replacer function for inline math wrapped in $ ... $
function replaceInlineMathDollar(matchString, mathContentString) {
  try {
    const trimmedMathString = mathContentString.trim();
    const katexInlineOptions = {
      displayMode: false,
      throwOnError: false
    };
    return katex.renderToString(trimmedMathString, katexInlineOptions);
  } catch (katexRenderError) {
    return matchString;
  }
}

// Replacer function for inline math wrapped in \( ... \)
function replaceInlineMathParenthesis(matchString, mathContentString) {
  try {
    const trimmedMathString = mathContentString.trim();
    const katexInlineOptions = {
      displayMode: false,
      throwOnError: false
    };
    return katex.renderToString(trimmedMathString, katexInlineOptions);
  } catch (katexRenderError) {
    return matchString;
  }
}

// Function that takes raw Markdown text, renders KaTeX math formulas and Markdown HTML, and sanitizes the output.
// Step 1: Pre-process mermaid code blocks into mermaid.ink <img> tags.
// Step 2: Pre-process block math ($$ ... $$ and \[ ... \]) into KaTeX display math HTML.
// Step 3: Pre-process inline math ($ ... $ and \( ... \)) into KaTeX inline math HTML.
// Step 4: Parse Markdown to raw HTML using the marked library.
// Step 5: Sanitize raw HTML with DOMPurify while keeping KaTeX SVG and MathML tags and attributes intact.
// Step 6: Return clean, safe HTML string.
export function renderMarkdown(markdownString) {
  if (!markdownString) {
    return '';
  }

  // Step 1: Replace mermaid code blocks (```mermaid ... ```) with mermaid.ink <img> tags
  let processedMarkdownText = markdownString.replace(/```mermaid\s*([\s\S]*?)```/gi, replaceMermaidCodeBlock);

  // Step 2: Replace block math ($$ ... $$ and \[ ... \])
  processedMarkdownText = processedMarkdownText.replace(/\$\$([\s\S]+?)\$\$/g, replaceBlockMathDollar);
  processedMarkdownText = processedMarkdownText.replace(/\\\[([\s\S]+?)\\\]/g, replaceBlockMathBracket);

  // Step 3: Replace inline math ($ ... $ and \( ... \))
  processedMarkdownText = processedMarkdownText.replace(/\$([^\$\n]+?)\$/g, replaceInlineMathDollar);
  processedMarkdownText = processedMarkdownText.replace(/\\\(([^\$\n]+?)\\\)/g, replaceInlineMathParenthesis);

  // Step 4: Convert Markdown to raw HTML
  const markedParseOptions = {
    gfm: true,
    breaks: true
  };
  const rawHtmlString = marked.parse(processedMarkdownText, markedParseOptions);

  // Step 5: Sanitize raw HTML with KaTeX whitelist
  const allowedMathMlAndSvgTagsArray = [
    'math',
    'annotation',
    'semantics',
    'mrow',
    'msup',
    'msub',
    'mfrac',
    'mover',
    'munder',
    'msubsup',
    'msqrt',
    'mroot',
    'mtable',
    'mtr',
    'mtd',
    'mtext',
    'mspace',
    'ms',
    'mglyph',
    'mpadded',
    'mphantom',
    'polyline',
    'path',
    'svg',
    'rect',
    'line',
    'g'
  ];

  const allowedMathMlAndSvgAttributesArray = [
    'encoding',
    'aria-hidden',
    'xmlns',
    'viewBox',
    'width',
    'height',
    'fill',
    'stroke',
    'stroke-width',
    'd',
    'points',
    'x',
    'y',
    'x1',
    'y1',
    'x2',
    'y2',
    'class',
    'style'
  ];

  const domPurifySanitizeOptions = {
    ADD_TAGS: allowedMathMlAndSvgTagsArray,
    ADD_ATTR: allowedMathMlAndSvgAttributesArray
  };

  const cleanSanitizedHtmlString = DOMPurify.sanitize(rawHtmlString, domPurifySanitizeOptions);

  // Step 6: Return safe HTML string
  return cleanSanitizedHtmlString;
}

