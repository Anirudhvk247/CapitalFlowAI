export function formatTickerValue(name, price) {
  if (price === null || price === undefined) return "--";
  if (!name) return price.toLocaleString();
  
  if (name === "FII Net Flow" || name === "DII Net Flow" || name === "Total Net Flow") {
      const sign = price >= 0 ? "+₹" : "-₹";
      return `${sign}${Math.abs(price).toLocaleString()} Cr INR`;
  }
  
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("yield") || lowerName === "vix" || lowerName.includes("bond")) {
      return `${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 3})}%`;
  }
  
  if (lowerName.includes("dollar index") || lowerName === "dxy") {
      return `${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} Pts`;
  }
  
  if (lowerName.includes("nifty") || lowerName === "usd/inr") {
      return `₹${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} INR`;
  }
  
  if (lowerName.includes("s&p 500") || lowerName.includes("nasdaq") || lowerName === "gold" || lowerName === "silver" || lowerName === "copper" || lowerName.includes("brent") || lowerName === "bitcoin" || lowerName === "ethereum") {
      return `$${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} USD`;
  }
  
  if (lowerName.includes("ftse")) {
      return `£${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} GBP`;
  }
  if (lowerName.includes("cac 40") || lowerName.includes("stoxx")) {
      return `€${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} EUR`;
  }
  
  if (lowerName.includes("nikkei")) {
      return `¥${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} JPY`;
  }
  
  if (lowerName.includes("shanghai") || lowerName.includes("china")) {
      return `¥${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} CNY`;
  }
  
  if (lowerName.includes("taiex") || lowerName.includes("taiwan")) {
      return `NT$${price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})} TWD`;
  }
  
  return price.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2});
}

function parseInline(text) {
  let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
      
  // Bold (**text**)
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic (*text*)
  escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Code (`code`)
  escaped = escaped.replace(/`(.*?)`/g, '<code>$1</code>');
  
  return escaped;
}

export function markdownToHtml(md) {
  if (!md) return "";
  let lines = md.split('\n');
  let html = [];
  let inList = false;
  
  for (let line of lines) {
      let trimmed = line.trim();
      
      // Horizontal Rule
      if (trimmed === '---' || trimmed === '***' || trimmed === '===') {
          if (inList) { html.push('</ul>'); inList = false; }
          html.push('<hr>');
          continue;
      }
      
      // Headers
      if (trimmed.startsWith('# ')) {
          if (inList) { html.push('</ul>'); inList = false; }
          html.push(`<h1>${parseInline(trimmed.substring(2))}</h1>`);
          continue;
      }
      if (trimmed.startsWith('## ')) {
          if (inList) { html.push('</ul>'); inList = false; }
          html.push(`<h2>${parseInline(trimmed.substring(3))}</h2>`);
          continue;
      }
      if (trimmed.startsWith('### ')) {
          if (inList) { html.push('</ul>'); inList = false; }
          html.push(`<h3>${parseInline(trimmed.substring(4))}</h3>`);
          continue;
      }
      
      // Blockquote
      if (trimmed.startsWith('> ')) {
          if (inList) { html.push('</ul>'); inList = false; }
          html.push(`<blockquote>${parseInline(trimmed.substring(2))}</blockquote>`);
          continue;
      }
      
      // Unordered List Items
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          if (!inList) { html.push('<ul>'); inList = true; }
          html.push(`<li>${parseInline(trimmed.substring(2))}</li>`);
          continue;
      }
      
      // Ordered List Items
      let olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (olMatch) {
          if (inList) { html.push('</ul>'); inList = false; }
          html.push(`<p><strong>${olMatch[1]}.</strong> ${parseInline(olMatch[2])}</p>`);
          continue;
      }
      
      // Empty lines
      if (trimmed === '') {
          if (inList) { html.push('</ul>'); inList = false; }
          continue;
      }
      
      // Paragraph
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<p>${parseInline(trimmed)}</p>`);
  }
  
  if (inList) { html.push('</ul>'); }
  
  return html.join('\n');
}
