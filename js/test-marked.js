// Simple test script for marked.js
console.log('Test marked script loaded');
try {
  // Load the marked library
  const script = document.createElement('script');
  script.src = 'marked.min.js'; // Relative to this script
  script.onload = () => {
    console.log('Marked library loaded successfully');
    if (typeof window.marked !== 'undefined') {
      console.log('Marked is defined, testing parsing:');
      const testMarkdown = '# Test Heading\n\nThis is a **bold** test.';
      const html = window.marked.parse(testMarkdown);
      console.log('Parsed HTML:', html);
      document.body.innerHTML = `
        <h2>Marked.js Test</h2>
        <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
          <h3>Original Markdown:</h3>
          <pre>${testMarkdown}</pre>
          <h3>Rendered HTML:</h3>
          <div>${html}</div>
        </div>
      `;
    } else {
      console.error('Marked is not defined after loading');
      document.body.innerHTML = '<h2>Error: Marked library not defined after loading</h2>';
    }
  };
  script.onerror = (error) => {
    console.error('Error loading marked library:', error);
    document.body.innerHTML = '<h2>Error: Failed to load marked library</h2>';
  };
  document.head.appendChild(script);
} catch (error) {
  console.error('Test script error:', error);
  document.body.innerHTML = `<h2>Error: ${error.message}</h2>`;
} 