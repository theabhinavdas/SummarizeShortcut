// This is a content script that allows the extension to interact with the page
// It helps with retrieving selected text and displaying summaries

console.log('Content script loaded');

// Inject Lottie library if not already present
function injectLottieLibrary() {
  if (typeof window.lottie === 'undefined') {
    const script = document.createElement('script');
    // Use local file instead of CDN
    script.src = chrome.runtime.getURL('js/lottie.min.js');
    script.onload = () => console.log('Lottie library injected successfully');
    script.onerror = (e) => console.error('Failed to load Lottie library:', e);
    document.head.appendChild(script);
  }
}

// Inject the library on page load
injectLottieLibrary();

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in content script:', message);
  
  if (message.action === "getSelectedText") {
    const selection = getSelectedText();
    console.log('Sending selection data:', selection);
    sendResponse(selection);
    return true;
  }
  
  if (message.action === "displaySummary") {
    console.log('Display summary message received:', message);
    // This function would be called from service-worker.js to display the summary
    // No implementation needed here as the service worker handles the UI
    sendResponse({ success: true });
    return true;
  }
});

// Function to get the currently selected text and its bounding rectangle
function getSelectedText() {
  // Get the window's selection object
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  // If no text is selected, return null
  if (!selectedText) {
    return { text: '', rect: null };
  }
  
  // Get the range to determine the position of the selected text
  let rect = null;
  
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    
    // Get client rectangles for the selection
    const rects = range.getClientRects();
    
    if (rects.length > 0) {
      // Get the first and last rectangles to determine the total bounds
      const firstRect = rects[0];
      const lastRect = rects[rects.length - 1];
      
      // Create a bounding rectangle that encompasses the entire selection
      rect = {
        left: firstRect.left,
        top: firstRect.top,
        right: lastRect.right,
        bottom: lastRect.bottom,
        width: Math.max(lastRect.right - firstRect.left, firstRect.width),
        height: lastRect.bottom - firstRect.top
      };
      
      // Check if the selection extends beyond the viewport
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // If the selection extends beyond the viewport, adjust the rectangle
      if (rect.bottom > viewportHeight || rect.right > viewportWidth) {
        console.log('Selection extends beyond viewport');
        
        // Find the last visible rectangle
        let lastVisibleRect = null;
        
        for (let i = 0; i < rects.length; i++) {
          const currentRect = rects[i];
          if (currentRect.top < viewportHeight && currentRect.left < viewportWidth) {
            lastVisibleRect = currentRect;
          } else {
            break; // Stop when we find a rectangle that's outside the viewport
          }
        }
        
        // If we found a visible rectangle, use that for positioning
        if (lastVisibleRect) {
          rect = {
            left: lastVisibleRect.left,
            top: lastVisibleRect.top,
            right: lastVisibleRect.right,
            bottom: lastVisibleRect.bottom,
            width: lastVisibleRect.width,
            height: lastVisibleRect.height
          };
        } else {
          // Fallback: place rectangle in a visible area
          rect = {
            left: Math.min(rect.left, viewportWidth - 50),
            top: Math.min(rect.top, viewportHeight - 50),
            right: Math.min(rect.right, viewportWidth),
            bottom: Math.min(rect.bottom, viewportHeight),
            width: Math.min(rect.width, viewportWidth / 2),
            height: Math.min(rect.height, viewportHeight / 4)
          };
        }
      }
    }
  }
  
  return {
    text: selectedText,
    rect: rect
  };
}

// Function to display the summary in a popup
function displaySummary(summary) {
  // Implementation will be provided by the service worker
  console.log('Content script received summary:', summary);
} 