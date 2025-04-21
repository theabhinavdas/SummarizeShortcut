// Listen for the keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
  if (command === 'summarize-text') {
    handleSummarizeCommand();
  }
});

// Global variables to track animation state 
let animationInstance = null;
let spinnerActive = false;

// Function to stop animation and clean up resources
function stopAnimation() {
  console.log('Stopping animation');
  // Clean up Lottie animation if it exists
  if (animationInstance) {
    try {
      animationInstance.destroy();
    } catch (error) {
      console.warn('Error destroying animation:', error);
    }
    animationInstance = null;
  }
  
  // Clear spinner animation if active
  if (spinnerActive) {
    try {
      const animationElement = document.getElementById('lottie-animation');
      if (animationElement) {
        animationElement.innerHTML = '';
      }
    } catch (error) {
      console.warn('Error clearing spinner animation:', error);
    }
    spinnerActive = false;
  }
}

// Function to summarize text using the selected LLM provider
async function summarizeWithSelectedProvider(text, settings) {
  console.log('Summarizing with provider:', settings.selectedProvider);
  
  if (!settings.selectedProvider) {
    throw new Error('No LLM provider selected. Please configure in extension settings.');
  }
  
  // Get max tokens and temperature settings (or defaults)
  const maxTokens = parseInt(settings.maxLength || '200');
  const temp = parseFloat(settings.temperature || '0.5');
  
  // Call the appropriate provider's API
  switch (settings.selectedProvider) {
    case 'openai':
      return await summarizeWithOpenAI(text, settings.openaiApiKey, settings.openaiModel || 'gpt-3.5-turbo', maxTokens, temp);
    
    case 'azure':
      return await summarizeWithAzure(text, settings.azureApiKey, settings.azureEndpoint, 
                                    settings.azureDeployment, maxTokens, temp);
    
    case 'gemini':
      return await summarizeWithGemini(text, settings.geminiApiKey, settings.geminiModel || 'gemini-pro', maxTokens, temp);
    
    default:
      throw new Error(`Unknown provider: ${settings.selectedProvider}`);
  }
}

// Function to summarize text using OpenAI API
async function summarizeWithOpenAI(text, apiKey, model, maxTokens, temperature) {
  console.log('Using OpenAI API with model:', model);
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  // Limit text length to avoid excessive API usage
  const truncatedText = text.length > 4000 ? text.substring(0, 4000) + '...' : text;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes text concisely and accurately.'
        },
        {
          role: 'user',
          content: `Summarize the following text in a concise way. Focus on the key points and important details only:\n\n${truncatedText}`
        }
      ],
      max_tokens: maxTokens,
      temperature: temperature
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to get summary from OpenAI');
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Function to summarize text using Azure OpenAI API
async function summarizeWithAzure(text, apiKey, endpoint, deployment, maxTokens, temperature) {
  console.log('Using Azure OpenAI API with deployment:', deployment);
  
  if (!apiKey || !endpoint || !deployment) {
    throw new Error('Azure OpenAI settings not fully configured');
  }
  
  // Ensure the endpoint doesn't have a trailing slash
  const cleanEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  
  // Format the Azure OpenAI API URL with the correct API version
  const apiUrl = `${cleanEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=2023-05-15`;
  
  console.log('Azure API URL (without key):', apiUrl);
  
  // Limit text length to avoid excessive API usage
  const truncatedText = text.length > 4000 ? text.substring(0, 4000) + '...' : text;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes text concisely and accurately.'
          },
          {
            role: 'user',
            content: `Summarize the following text in a concise way. Focus on the key points and important details only:\n\n${truncatedText}`
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature
      })
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error('Azure API error response:', responseText);
      
      let errorMessage = 'Failed to get summary from Azure';
      try {
        // Try to parse the error response as JSON
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error?.message || errorData.error?.code || errorMessage;
      } catch (parseError) {
        // If parsing fails, use the raw response text
        errorMessage = responseText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Azure API returned unexpected response structure:', data);
      throw new Error('Azure API returned an unexpected response format');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Azure API error:', error);
    throw error;
  }
}

// Function to summarize text using Google Gemini API
async function summarizeWithGemini(text, apiKey, model, maxTokens, temperature) {
  console.log('Using Gemini API with model:', model);
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }
  
  // Format the Gemini API URL - using the correct model name format
  // For Gemini, the model names should be properly formatted with the API version
  const formattedModel = model.includes('/') ? model : `models/${model}`;
  const apiUrl = `https://generativelanguage.googleapis.com/v1/${formattedModel}:generateContent?key=${apiKey}`;
  
  console.log('Gemini API URL (without key):', apiUrl.split('?')[0]);
  
  // Limit text length to avoid excessive API usage
  const truncatedText = text.length > 4000 ? text.substring(0, 4000) + '...' : text;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Summarize the following text in a concise way. Focus on the key points and important details only:\n\n${truncatedText}`
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: temperature
      }
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = errorData.error?.message || 'Failed to get summary from Gemini';
    console.error('Gemini API error:', errorData);
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Function to handle the summarize command
async function handleSummarizeCommand() {
  try {
    console.log('Handling summarize command');
    
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      console.error('No active tab found');
      return;
    }
    
    console.log('Active tab found:', tab.id);
    
    // Check if we have the necessary settings
    const settings = await chrome.storage.local.get([
      'selectedProvider',
      'openaiApiKey',
      'openaiModel',
      'azureApiKey',
      'azureEndpoint',
      'azureDeployment',
      'geminiApiKey',
      'geminiModel',
      'maxLength',
      'temperature'
    ]);
    
    console.log('Provider settings loaded:', settings.selectedProvider);
    
    // Send message to content script to get the selected text
    const selection = await chrome.tabs.sendMessage(tab.id, { 
      action: "getSelectedText" 
    }).catch(error => {
      console.error('Error sending message to content script:', error);
      return null;
    });
    
    console.log('Selection retrieved from content script:', selection);
    
    if (!selection) {
      console.error('Failed to get selection from content script');
      return;
    }
    
    const selectedText = selection?.text || '';
    const rect = selection?.rect || null;
    
    // Show popup immediately with loading state
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: showLoadingPopup,
      args: [
        selectedText,
        rect,
        !!settings.selectedProvider
      ]
    });
    
    console.log('Loading popup displayed');
    
    // Get summary if we have text and API key
    let summary = null;
    let error = null;
    
    if (selectedText && settings.selectedProvider) {
      try {
        console.log('Requesting summary with provider:', settings.selectedProvider);
        summary = await summarizeWithSelectedProvider(selectedText, settings);
        console.log('Summary received, length:', summary?.length);
      } catch (err) {
        console.error('Error getting summary:', err);
        error = err.message || 'Failed to get summary';
      }
    } else if (!settings.selectedProvider) {
      error = 'No LLM provider selected. Please configure in extension settings.';
    } else if (!selectedText) {
      error = 'No text selected to summarize.';
    }
    
    console.log('Summary result:', { 
      hasResult: !!summary, 
      error: error, 
      length: summary?.length || 0 
    });
    
    // Update the popup with the result - include the helper functions
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: (summary, error, providerName) => {
        console.log('Updating popup with result:', { 
          summaryLength: summary?.length || 0, 
          error,
          hasError: !!error,
          providerName
        });
        
        // Simple function to format basic markdown
        function formatBasicMarkdown(text) {
          if (!text) return '';
          
          // Wrap the result in a div
          let formattedText = text
            // Headers
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
            .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
            .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
            
            // Bold and italic
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\_\_(.*?)\_\_/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\_(.*?)\_/g, '<em>$1</em>')
            
            // Code blocks with language support
            .replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
            
            // Regular code blocks
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            
            // Inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            
            // Blockquotes
            .replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>')
            
            // Unordered lists
            .replace(/^\- (.*$)/gm, '<ul><li>$1</li></ul>')
            .replace(/^\* (.*$)/gm, '<ul><li>$1</li></ul>')
            
            // Ordered lists
            .replace(/^\d+\. (.*$)/gm, '<ol><li>$1</li></ol>')
            
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
            
          // Fix duplicate tags from list processing
          formattedText = formattedText
            .replace(/<\/ul><ul>/g, '')
            .replace(/<\/ol><ol>/g, '');
          
          // Wrap in paragraphs if not already
          if (!formattedText.startsWith('<h') && !formattedText.startsWith('<p') && 
              !formattedText.startsWith('<ul') && !formattedText.startsWith('<ol') && 
              !formattedText.startsWith('<blockquote')) {
            formattedText = '<p>' + formattedText + '</p>';
          }
          
          return formattedText;
        }
        
        // Handle the animation cleanup
        try {
          console.log('Stopping any animations');
          // Look for animation elements
          const animationElement = document.getElementById('lottie-animation');
          if (animationElement) {
            animationElement.innerHTML = '';
            console.log('Cleared lottie animation element');
          }
          
          // Stop the CSS spinner animation if it exists
          const spinner = document.querySelector('.loading-spinner');
          if (spinner) {
            spinner.style.display = 'none';
            console.log('Hidden spinner element');
          }
        } catch (error) {
          console.warn('Error cleaning up animations:', error);
        }
        
        // Get the popup and content div
        const popupId = 'summarize-shortcut-popup';
        const popup = document.getElementById(popupId);
        
        if (!popup) {
          console.error('Popup not found, cannot update');
          return;
        }
        
        const contentDiv = document.getElementById(`${popupId}-content`);
        if (!contentDiv) {
          console.error('Content div not found in popup');
          return;
        }
        
        // If we have an error, show it
        if (error) {
          console.log('Showing error message in popup:', error);
          contentDiv.innerHTML = `
            <div style="color: #d32f2f;">
              <p><strong>Error</strong></p>
              <p>Failed to generate summary:</p>
              <p style="margin-top: 8px; padding: 8px; background: #fdeded; border-radius: 4px;">${error || 'Unknown error'}</p>
            </div>
          `;
          return;
        }
        
        // If we have a summary, render it with basic markdown formatting
        if (summary) {
          console.log('Showing summary in popup with basic formatting');
          const providerLabel = providerName === 'openai' ? 'OpenAI' :
                               providerName === 'azure' ? 'Azure OpenAI' :
                               providerName === 'gemini' ? 'Google Gemini' : 'AI';
          
          // Inject markdown stylesheet if not already present
          const markdownStylesheetId = 'markdown-styles';
          if (!document.getElementById(markdownStylesheetId)) {
            const styleLink = document.createElement('link');
            styleLink.id = markdownStylesheetId;
            styleLink.rel = 'stylesheet';
            styleLink.href = chrome.runtime.getURL('markdown-styles.css');
            document.head.appendChild(styleLink);
          }
          
          // Add some basic popup styling enhancements
          popup.style.maxWidth = '400px';
          popup.style.width = '380px';
          popup.style.maxHeight = '70vh';
          popup.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
          popup.style.border = '1px solid #e0e0e0';
          popup.style.borderRadius = '8px';
          popup.style.background = '#ffffff';
          
          // Format and display the summary with our basic markdown formatter
          contentDiv.innerHTML = `
            <div class="markdown-content" style="padding: 4px 0;">
              ${formatBasicMarkdown(summary)}
            </div>
            <div style="margin-top: 12px; font-size: 12px; color: #666; text-align: right; border-top: 1px solid #f0f0f0; padding-top: 8px;">
              Summarized with ${providerLabel}
            </div>
          `;
          return;
        }
        
        // If we get here, there was some problem - show a generic error
        console.log('No summary or error provided, showing generic error');
        contentDiv.innerHTML = `
          <div style="color: #d32f2f;">
            <p><strong>Error</strong></p>
            <p>Failed to generate summary. Please try again.</p>
          </div>
        `;
      },
      args: [
        summary, 
        error, 
        settings.selectedProvider || 'none'
      ]
    });
    
    console.log('Popup updated with result');
  } catch (error) {
    console.error('Error handling command:', error);
  }
}

// Function to display the initial loading popup in the page
function showLoadingPopup(selectedText, rect, hasProvider) {
  console.log('Showing loading popup with:', { 
    textLength: selectedText?.length || 0,
    hasProvider,
    rect
  });
  
  // Create a unique ID for this popup instance
  const popupId = 'summarize-shortcut-popup';
  
  // Remove any existing popup with the same ID
  const existingPopup = document.getElementById(popupId);
  if (existingPopup) {
    existingPopup.remove();
  }
  
  // Create the popup container
  const popup = document.createElement('div');
  popup.id = popupId;
  popup.style.position = 'fixed';
  popup.style.zIndex = '2147483647'; // Maximum z-index
  popup.style.padding = '16px';
  popup.style.background = 'white';
  popup.style.border = '1px solid #e0e0e0';
  popup.style.borderRadius = '8px';
  popup.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
  popup.style.maxWidth = '400px';
  popup.style.maxHeight = '70vh';
  popup.style.overflowY = 'auto';
  popup.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  popup.style.fontSize = '14px';
  popup.style.background = '#ffffff';
  
  // Always position in the bottom right corner
  popup.style.bottom = '20px';
  popup.style.right = '20px';
  popup.style.left = 'auto';
  popup.style.top = 'auto';
  
  // Basic structure with close button
  popup.innerHTML = `
    <div style="position: relative;">
      <div id="${popupId}-close" style="position: absolute; top: 0; right: 0; cursor: pointer; font-size: 18px; line-height: 1; padding: 4px 8px;">✕</div>
      <div style="font-weight: bold; margin-bottom: 12px; padding-right: 30px;">SummarizeShortcut</div>
      <div id="${popupId}-content"></div>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(popup);
  
  // Add click event for close button
  document.getElementById(`${popupId}-close`).addEventListener('click', () => {
    const popup = document.getElementById(popupId);
    if (popup) {
      popup.remove();
    }
  });
  
  // Get content div
  const contentDiv = document.getElementById(`${popupId}-content`);
  
  // Add event listener to close when clicking outside
  document.addEventListener('click', function handleOutsideClick(e) {
    const popup = document.getElementById(popupId);
    if (popup && !popup.contains(e.target) && e.target.id !== popupId) {
      popup.remove();
      document.removeEventListener('click', handleOutsideClick);
    }
  });
  
  // Also close on Escape key
  window.addEventListener('keydown', function handleKeydown(e) {
    if (e.key === 'Escape') {
      const popup = document.getElementById(popupId);
      if (popup) {
        popup.remove();
        window.removeEventListener('keydown', handleKeydown);
      }
    }
  });
  
  // Check if we have an LLM provider configured
  if (!hasProvider) {
    contentDiv.innerHTML = `
      <div style="color: #d32f2f;">
        <p><strong>LLM Provider Missing</strong></p>
        <p>Please select and configure an LLM provider in the extension settings.</p>
        <p style="margin-top: 12px; font-size: 13px;">
          Click on the extension icon in your toolbar to set up.
        </p>
      </div>
    `;
    return;
  }
  
  // Check if text is selected
  if (!selectedText) {
    contentDiv.innerHTML = `
      <div>
        <p><strong>No text selected</strong></p>
        <p>Please highlight text to summarize.</p>
        <hr style="margin: 12px 0; border: none; border-top: 1px solid #eee;">
        <p><strong>How to use:</strong></p>
        <ol style="padding-left: 20px; margin: 8px 0;">
          <li>Highlight text on the webpage</li>
          <li>Press <strong>Ctrl+Shift+S</strong> <small>(Command+Shift+S on Mac)</small></li>
          <li>A summary will appear next to your selection</li>
        </ol>
      </div>
    `;
    return;
  }
  
  // Show loading spinner
  contentDiv.innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <div class="loading-spinner" style="display: inline-block; width: 30px; height: 30px; border: 3px solid rgba(66, 133, 244, 0.2); border-radius: 50%; border-top-color: #4285f4; animation: spin 1s ease-in-out infinite;"></div>
      <div style="margin-top: 12px; color: #555;">Summarizing your text...</div>
    </div>
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `;
}

// Function to display the popup in the page (kept for backward compatibility)
function showPopup(selectedText, summary, error, hasProvider, position, providerName) {
  console.log('Legacy showPopup called. This should not happen in normal operation.');
  
  // Create a unique ID for this popup instance
  const timestamp = new Date().getTime();
  const popupId = `summarize-shortcut-popup-${timestamp}`;
  
  // Create the popup container
  const popup = document.createElement('div');
  popup.id = popupId;
  popup.style.position = 'fixed';
  popup.style.zIndex = '2147483647'; // Maximum z-index
  popup.style.padding = '16px';
  popup.style.background = 'white';
  popup.style.border = '1px solid #ccc';
  popup.style.borderRadius = '5px';
  popup.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
  popup.style.maxWidth = '350px';
  popup.style.maxHeight = '500px';
  popup.style.overflowY = 'auto';
  popup.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  popup.style.fontSize = '14px';
  
  // Position the popup
  let rect;
  
  if (position && selectedText) {
    rect = position;
  } else {
    // Fallback position in the middle right of the screen
    rect = { 
      right: window.innerWidth - 400, 
      top: window.innerHeight / 3
    };
  }
  
  // Position relative to viewport, not document
  popup.style.left = `${rect.right + 20}px`;
  popup.style.top = `${rect.top}px`;
  
  // Add a bit of safe margin to keep popup within viewport
  if (parseFloat(popup.style.left) + 350 > window.innerWidth) {
    popup.style.left = `${window.innerWidth - 370}px`;
  }
  
  if (parseFloat(popup.style.top) + 200 > window.innerHeight) {
    popup.style.top = `${window.innerHeight - 220}px`;
  }
  
  // Basic structure with close button
  popup.innerHTML = `
    <div style="position: relative;">
      <div id="${popupId}-close" style="position: absolute; top: 0; right: 0; cursor: pointer; font-size: 18px; line-height: 1; padding: 4px 8px;">✕</div>
      <div style="font-weight: bold; margin-bottom: 12px; padding-right: 30px;">SummarizeShortcut</div>
      <div id="${popupId}-content"></div>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(popup);
  
  // Add click event for close button
  document.getElementById(`${popupId}-close`).addEventListener('click', () => {
    const popup = document.getElementById(popupId);
    if (popup) {
      popup.remove();
    }
  });
  
  // Get content div
  const contentDiv = document.getElementById(`${popupId}-content`);
  
  // Add event listener to close when clicking outside
  document.addEventListener('click', function handleOutsideClick(e) {
    const popup = document.getElementById(popupId);
    if (popup && !popup.contains(e.target) && e.target.id !== popupId) {
      popup.remove();
      document.removeEventListener('click', handleOutsideClick);
    }
  });
  
  // Also close on Escape key
  window.addEventListener('keydown', function handleKeydown(e) {
    if (e.key === 'Escape') {
      const popup = document.getElementById(popupId);
      if (popup) {
        popup.remove();
        window.removeEventListener('keydown', handleKeydown);
      }
    }
  });
  
  // Check if we have an LLM provider configured
  if (!hasProvider) {
    contentDiv.innerHTML = `
      <div style="color: #d32f2f;">
        <p><strong>LLM Provider Missing</strong></p>
        <p>Please select and configure an LLM provider in the extension settings.</p>
        <p style="margin-top: 12px; font-size: 13px;">
          Click on the extension icon in your toolbar to set up.
        </p>
      </div>
    `;
    return;
  }
  
  // Check if text is selected
  if (!selectedText) {
    contentDiv.innerHTML = `
      <div>
        <p><strong>No text selected</strong></p>
        <p>Please highlight text to summarize.</p>
        <hr style="margin: 12px 0; border: none; border-top: 1px solid #eee;">
        <p><strong>How to use:</strong></p>
        <ol style="padding-left: 20px; margin: 8px 0;">
          <li>Highlight text on the webpage</li>
          <li>Press <strong>Ctrl+Shift+S</strong> <small>(Command+Shift+S on Mac)</small></li>
          <li>A summary will appear next to your selection</li>
        </ol>
      </div>
    `;
    return;
  }
  
  // If we have an error, show it
  if (error) {
    contentDiv.innerHTML = `
      <div style="color: #d32f2f;">
        <p><strong>Error</strong></p>
        <p>Failed to generate summary:</p>
        <p style="margin-top: 8px; padding: 8px; background: #fdeded; border-radius: 4px;">${error || 'Unknown error'}</p>
      </div>
    `;
    return;
  }
  
  // If we have a summary, show it
  if (summary) {
    const providerLabel = providerName === 'openai' ? 'OpenAI' :
                         providerName === 'azure' ? 'Azure OpenAI' :
                         providerName === 'gemini' ? 'Google Gemini' : 'AI';
    
    contentDiv.innerHTML = `
      <div style="line-height: 1.5;">
        ${summary.replace(/\n/g, '<br>')}
      </div>
      <div style="margin-top: 12px; font-size: 12px; color: #666; text-align: right;">
        Summarized with ${providerLabel}
      </div>
    `;
    return;
  }
  
  // If we get here, we're still loading
  contentDiv.innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <div class="loading-spinner" style="display: inline-block; width: 30px; height: 30px; border: 3px solid rgba(66, 133, 244, 0.2); border-radius: 50%; border-top-color: #4285f4; animation: spin 1s ease-in-out infinite;"></div>
      <div style="margin-top: 12px; color: #555;">Summarizing your text...</div>
    </div>
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `;
}