/**
 * Gutenberg Blocks <-> Classic HTML Converter
 */

export function blocksToHtml(blocks) {
  if (!blocks || !Array.isArray(blocks)) return '';
  return blocks.map(block => {
    switch (block.type) {
      case 'paragraph':
        return `<p>${block.data.text}</p>`;
      case 'header':
        return `<h${block.data.level || 2}>${block.data.text}</h${block.data.level || 2}>`;
      case 'list': {
        const tag = block.data.style === 'ordered' ? 'ol' : 'ul';
        const items = (block.data.items || []).map(item => `<li>${item}</li>`).join('');
        return `<${tag}>${items}</${tag}>`;
      }
      case 'quote':
        return `<blockquote>${block.data.text}${block.data.caption ? ` <cite>${block.data.caption}</cite>` : ''}</blockquote>`;
      case 'image': {
        const url = block.data.file?.url || block.data.url || '';
        const caption = block.data.caption || '';
        return `<figure><img src="${url}" alt="${caption}" /><figcaption>${caption}</figcaption></figure>`;
      }
      default:
        return '';
    }
  }).join('\n');
}

export function htmlToBlocks(html) {
  if (!html) return [];
  if (typeof window === 'undefined') return [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blocks = [];

    doc.body.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          blocks.push({
            type: 'paragraph',
            data: { text }
          });
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const element = node;
      const tag = element.tagName.toLowerCase();

      if (tag === 'p') {
        blocks.push({
          type: 'paragraph',
          data: { text: element.innerHTML }
        });
      } else if (/^h[1-6]$/.test(tag)) {
        const level = parseInt(tag[1]);
        blocks.push({
          type: 'header',
          data: {
            text: element.innerHTML,
            level: level
          }
        });
      } else if (tag === 'ul' || tag === 'ol') {
        const items = Array.from(element.querySelectorAll('li')).map(li => li.innerHTML);
        blocks.push({
          type: 'list',
          data: {
            style: tag === 'ol' ? 'ordered' : 'unordered',
            items: items
          }
        });
      } else if (tag === 'blockquote') {
        const cite = element.querySelector('cite');
        const citeText = cite ? cite.innerHTML : '';
        if (cite) cite.remove();
        blocks.push({
          type: 'quote',
          data: {
            text: element.innerHTML,
            caption: citeText,
            alignment: 'left'
          }
        });
      } else if (tag === 'figure' || tag === 'img') {
        const img = tag === 'img' ? element : element.querySelector('img');
        const caption = tag === 'figure' ? (element.querySelector('figcaption')?.innerHTML || '') : '';
        if (img) {
          blocks.push({
            type: 'image',
            data: {
              url: img.getAttribute('src') || '',
              caption: caption || img.getAttribute('alt') || '',
              withBorder: false,
              withBackground: false,
              stretched: false
            }
          });
        }
      } else {
        if (element.outerHTML) {
          blocks.push({
            type: 'paragraph',
            data: { text: element.outerHTML }
          });
        }
      }
    });

    return blocks;
  } catch (error) {
    console.error('Failed to parse HTML to blocks:', error);
    return [];
  }
}
