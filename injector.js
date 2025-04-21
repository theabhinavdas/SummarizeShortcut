// This script injects the Lottie library and animation data into the page

// Function to inject the Lottie library
function injectLottieLibrary() {
  return new Promise((resolve, reject) => {
    // Check if Lottie is already available
    if (typeof window.lottie !== 'undefined') {
      console.log('Lottie library already available');
      resolve(window.lottie);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    // Use local file instead of CDN
    script.src = chrome.runtime.getURL('js/lottie.min.js');
    script.type = 'text/javascript';
    
    // Setup event handlers
    script.onload = () => {
      console.log('Lottie library injected successfully');
      resolve(window.lottie);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Lottie library:', error);
      reject(error);
    };
    
    // Add to the document
    document.head.appendChild(script);
  });
}

// Function to load the animation
async function loadAnimation(containerId, animationUrl) {
  try {
    // Inject the library first
    const lottie = await injectLottieLibrary();
    
    // Fetch the animation data
    const response = await fetch(animationUrl);
    const animationData = await response.json();
    
    // Load the animation
    const container = document.getElementById(containerId);
    if (container) {
      lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: animationData
      });
      return true;
    } else {
      console.error('Animation container not found:', containerId);
      return false;
    }
  } catch (error) {
    console.error('Error loading animation:', error);
    return false;
  }
}

// Export functions
window.lottieInjector = {
  injectLibrary: injectLottieLibrary,
  loadAnimation: loadAnimation
}; 