document.addEventListener('DOMContentLoaded', async () => {
  // Tab navigation
  const tabBtnProviders = document.getElementById('tab-btn-providers');
  const tabBtnSettings = document.getElementById('tab-btn-settings');
  const tabProviders = document.getElementById('tab-providers');
  const tabSettings = document.getElementById('tab-settings');
  
  tabBtnProviders.addEventListener('click', () => {
    tabBtnProviders.classList.add('active');
    tabBtnSettings.classList.remove('active');
    tabProviders.classList.add('active');
    tabSettings.classList.remove('active');
  });
  
  tabBtnSettings.addEventListener('click', () => {
    tabBtnSettings.classList.add('active');
    tabBtnProviders.classList.remove('active');
    tabSettings.classList.add('active');
    tabProviders.classList.remove('active');
  });
  
  // Provider settings toggle
  const toggleProviderSettings = document.getElementById('toggle-provider-settings');
  const providerSettings = document.getElementById('provider-settings');
  
  toggleProviderSettings.addEventListener('click', () => {
    toggleProviderSettings.classList.toggle('collapsed');
    providerSettings.classList.toggle('hidden');
  });
  
  // Provider selection handling
  const radioOpenAI = document.getElementById('provider-openai');
  const radioAzure = document.getElementById('provider-azure');
  const radioGemini = document.getElementById('provider-gemini');
  
  const openaiSettings = document.getElementById('openai-settings');
  const azureSettings = document.getElementById('azure-settings');
  const geminiSettings = document.getElementById('gemini-settings');
  
  function showProviderSettings(provider) {
    openaiSettings.style.display = 'none';
    azureSettings.style.display = 'none';
    geminiSettings.style.display = 'none';
    
    if (provider === 'openai') {
      openaiSettings.style.display = 'block';
    } else if (provider === 'azure') {
      azureSettings.style.display = 'block';
    } else if (provider === 'gemini') {
      geminiSettings.style.display = 'block';
    }
  }
  
  radioOpenAI.addEventListener('change', () => showProviderSettings('openai'));
  radioAzure.addEventListener('change', () => showProviderSettings('azure'));
  radioGemini.addEventListener('change', () => showProviderSettings('gemini'));
  
  // Form elements
  const openaiApiKey = document.getElementById('openai-api-key');
  const openaiModel = document.getElementById('openai-model');
  const azureApiKey = document.getElementById('azure-api-key');
  const azureEndpoint = document.getElementById('azure-endpoint');
  const azureDeployment = document.getElementById('azure-deployment');
  const geminiApiKey = document.getElementById('gemini-api-key');
  const geminiModel = document.getElementById('gemini-model');
  const maxLength = document.getElementById('max-length');
  const temperature = document.getElementById('temperature');
  
  const saveButton = document.getElementById('save-btn');
  const saveSettingsButton = document.getElementById('save-settings-btn');
  const statusDisplay = document.getElementById('status');
  const settingsStatusDisplay = document.getElementById('settings-status');
  
  // Load existing settings
  const settings = await chrome.storage.local.get([
    'selectedProvider',
    'openaiApiKey',
    'openaiModel',
    'azureApiKey',
    'azureEndpoint',
    'azureDeployment',
    'geminiApiKey',
    'geminiModel',
    'geminiAvailableModels',
    'maxLength',
    'temperature'
  ]);
  
  // Apply saved settings to form
  if (settings.selectedProvider) {
    if (settings.selectedProvider === 'openai') {
      radioOpenAI.checked = true;
    } else if (settings.selectedProvider === 'azure') {
      radioAzure.checked = true;
    } else if (settings.selectedProvider === 'gemini') {
      radioGemini.checked = true;
    }
    showProviderSettings(settings.selectedProvider);
  } else {
    // Default to OpenAI if no provider is selected
    radioOpenAI.checked = true;
    showProviderSettings('openai');
  }
  
  if (settings.openaiApiKey) openaiApiKey.value = settings.openaiApiKey;
  if (settings.openaiModel) openaiModel.value = settings.openaiModel;
  if (settings.azureApiKey) azureApiKey.value = settings.azureApiKey;
  if (settings.azureEndpoint) azureEndpoint.value = settings.azureEndpoint;
  if (settings.azureDeployment) azureDeployment.value = settings.azureDeployment;
  if (settings.geminiApiKey) geminiApiKey.value = settings.geminiApiKey;
  
  // Setup Gemini model dropdown if we have saved models
  if (settings.geminiAvailableModels && settings.geminiAvailableModels.length > 0) {
    populateGeminiModelDropdown(settings.geminiAvailableModels, settings.geminiModel);
  } else {
    // Default Gemini model options
    const defaultModels = [
      { name: 'gemini-pro', displayName: 'Gemini Pro' },
      { name: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro' }
    ];
    populateGeminiModelDropdown(defaultModels, settings.geminiModel);
  }
  
  if (settings.maxLength) maxLength.value = settings.maxLength;
  if (settings.temperature) temperature.value = settings.temperature;
  
  // Add fetch models button for Gemini
  const fetchModelsButton = document.createElement('button');
  fetchModelsButton.textContent = 'Fetch Available Models';
  fetchModelsButton.style.marginTop = '8px';
  fetchModelsButton.style.backgroundColor = '#f0f0f0';
  fetchModelsButton.style.color = '#333';
  fetchModelsButton.style.border = '1px solid #ccc';
  fetchModelsButton.style.padding = '6px 12px';
  fetchModelsButton.style.fontSize = '12px';
  fetchModelsButton.style.borderRadius = '4px';
  fetchModelsButton.style.cursor = 'pointer';
  
  const fetchModelsContainer = document.createElement('div');
  fetchModelsContainer.className = 'input-group';
  fetchModelsContainer.appendChild(fetchModelsButton);
  
  // Insert the button after the Gemini model select
  const geminiModelContainer = geminiModel.parentNode;
  geminiModelContainer.parentNode.insertBefore(fetchModelsContainer, geminiModelContainer.nextSibling);
  
  // Function to populate Gemini model dropdown
  function populateGeminiModelDropdown(models, selectedModel) {
    // Clear existing options
    geminiModel.innerHTML = '';
    
    // Add each model to the dropdown
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.name;
      option.textContent = model.displayName || model.name;
      geminiModel.appendChild(option);
    });
    
    // Select the previously selected model if it exists
    if (selectedModel && geminiModel.querySelector(`option[value="${selectedModel}"]`)) {
      geminiModel.value = selectedModel;
    }
  }
  
  // Fetch Gemini models when button is clicked
  fetchModelsButton.addEventListener('click', async () => {
    const apiKey = geminiApiKey.value.trim();
    
    if (!apiKey) {
      showProviderStatus('Please enter a Gemini API key first', 'error');
      return;
    }
    
    fetchModelsButton.disabled = true;
    fetchModelsButton.textContent = 'Fetching...';
    
    try {
      const models = await fetchGeminiModels(apiKey);
      
      if (models && models.length > 0) {
        // Save models to storage
        await chrome.storage.local.set({ geminiAvailableModels: models });
        
        // Update the dropdown
        populateGeminiModelDropdown(models, geminiModel.value);
        
        showProviderStatus('Models fetched successfully', 'success');
      } else {
        showProviderStatus('No models found or API key is invalid', 'error');
      }
    } catch (error) {
      showProviderStatus(`Error fetching models: ${error.message}`, 'error');
    } finally {
      fetchModelsButton.disabled = false;
      fetchModelsButton.textContent = 'Fetch Available Models';
    }
  });
  
  // Save provider settings
  saveButton.addEventListener('click', async () => {
    const selectedProvider = document.querySelector('input[name="selected-provider"]:checked')?.value;
    
    if (!selectedProvider) {
      showProviderStatus('Please select a provider', 'error');
      return;
    }
    
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    
    try {
      // Get the correct settings based on selected provider
      let isValid = false;
      const settingsToSave = { selectedProvider };
      
      if (selectedProvider === 'openai') {
        const apiKey = openaiApiKey.value.trim();
        if (!apiKey) {
          showProviderStatus('Please enter an API key', 'error');
          saveButton.disabled = false;
          saveButton.textContent = 'Save Settings';
          return;
        }
        
        isValid = await verifyOpenAIKey(apiKey);
        settingsToSave.openaiApiKey = apiKey;
        settingsToSave.openaiModel = openaiModel.value;
      }
      else if (selectedProvider === 'azure') {
        const apiKey = azureApiKey.value.trim();
        const endpoint = azureEndpoint.value.trim();
        const deployment = azureDeployment.value.trim();
        
        if (!apiKey || !endpoint || !deployment) {
          showProviderStatus('Please enter all Azure OpenAI settings', 'error');
          saveButton.disabled = false;
          saveButton.textContent = 'Save Settings';
          return;
        }
        
        isValid = await verifyAzureKey(apiKey, endpoint, deployment);
        settingsToSave.azureApiKey = apiKey;
        settingsToSave.azureEndpoint = endpoint;
        settingsToSave.azureDeployment = deployment;
      }
      else if (selectedProvider === 'gemini') {
        const apiKey = geminiApiKey.value.trim();
        const model = geminiModel.value.trim();
        
        if (!apiKey) {
          showProviderStatus('Please enter a Gemini API key', 'error');
          saveButton.disabled = false;
          saveButton.textContent = 'Save Settings';
          return;
        }
        
        if (!model) {
          showProviderStatus('Please select a Gemini model', 'error');
          saveButton.disabled = false;
          saveButton.textContent = 'Save Settings';
          return;
        }
        
        isValid = await verifyGeminiKey(apiKey, model);
        settingsToSave.geminiApiKey = apiKey;
        settingsToSave.geminiModel = model;
      }
      
      if (isValid) {
        await chrome.storage.local.set(settingsToSave);
        showProviderStatus('Settings saved successfully!', 'success');
      } else {
        showProviderStatus('Invalid API key or model. Please check and try again.', 'error');
      }
    } catch (error) {
      showProviderStatus(`Error: ${error.message}`, 'error');
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = 'Save Settings';
    }
  });
  
  // Save general settings
  saveSettingsButton.addEventListener('click', async () => {
    saveSettingsButton.disabled = true;
    saveSettingsButton.textContent = 'Saving...';
    
    try {
      await chrome.storage.local.set({
        maxLength: maxLength.value,
        temperature: temperature.value
      });
      
      showSettingsStatus('Settings saved successfully!', 'success');
    } catch (error) {
      showSettingsStatus(`Error: ${error.message}`, 'error');
    } finally {
      saveSettingsButton.disabled = false;
      saveSettingsButton.textContent = 'Save Settings';
    }
  });
  
  function showProviderStatus(message, type) {
    statusDisplay.textContent = message;
    statusDisplay.className = 'status ' + type;
    statusDisplay.style.display = 'block';
    
    setTimeout(() => {
      statusDisplay.style.display = 'none';
    }, 5000);
  }
  
  function showSettingsStatus(message, type) {
    settingsStatusDisplay.textContent = message;
    settingsStatusDisplay.className = 'status ' + type;
    settingsStatusDisplay.style.display = 'block';
    
    setTimeout(() => {
      settingsStatusDisplay.style.display = 'none';
    }, 5000);
  }

  // Verification functions for each provider
  async function verifyOpenAIKey(apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.status === 200;
    } catch (error) {
      console.error('OpenAI API verification error:', error);
      return false;
    }
  }
  
  async function verifyAzureKey(apiKey, endpoint, deployment) {
    try {
      // Ensure the endpoint doesn't have a trailing slash
      const cleanEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
      
      // Format: {endpoint}/openai/deployments/{deployment}/chat/completions?api-version=2023-05-15
      const url = `${cleanEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=2023-05-15`;
      
      console.log('Verifying Azure API with URL (without key):', url);
      
      // Send a minimal request to verify the deployment exists and can be accessed
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Hello'
            }
          ],
          max_tokens: 5
        })
      });
      
      // Log the response status for debugging
      console.log('Azure API verification status:', response.status);
      
      // If we get a 401, the API key is invalid
      if (response.status === 401) {
        console.error('Azure API key is invalid');
        return false;
      }
      
      // If we get a 404, the deployment doesn't exist
      if (response.status === 404) {
        console.error('Azure deployment not found:', deployment);
        return false;
      }
      
      // Check if the response is successful
      if (response.ok) {
        console.log('Azure API verification successful');
        return true;
      }
      
      // For other errors, try to read the response for more details
      try {
        const errorText = await response.text();
        console.error('Azure API verification error:', errorText);
        
        // Check if the error is related to model permissions, which would still mean 
        // the deployment exists and is accessible
        if (errorText.includes('permission') || errorText.includes('quota')) {
          // This might be a permission or quota issue, not an auth issue
          return true;
        }
      } catch (readError) {
        console.error('Error reading Azure API response:', readError);
      }
      
      // For any other error, consider it a verification failure
      return false;
    } catch (error) {
      console.error('Azure API verification error:', error);
      // Allow saving even with connection error since the issue might be temporary
      return true;
    }
  }
  
  async function verifyGeminiKey(apiKey, model) {
    try {
      // First verify if the API key is valid by listing models
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
        method: 'GET'
      });
      
      if (response.status !== 200) {
        return false;
      }
      
      // Now verify the specific model works with generateContent
      const formattedModel = model.includes('/') ? model : `models/${model}`;
      const modelCheckUrl = `https://generativelanguage.googleapis.com/v1/${formattedModel}?key=${apiKey}`;
      
      const modelResponse = await fetch(modelCheckUrl, {
        method: 'GET'
      });
      
      if (modelResponse.status !== 200) {
        console.error('Gemini model verification failed:', model);
        return false;
      }
      
      // Get supported methods
      const modelData = await modelResponse.json();
      const supportedMethods = modelData.supportedGenerationMethods || [];
      
      // Check if generateContent is supported
      return supportedMethods.includes('generateContent');
    } catch (error) {
      console.error('Gemini API verification error:', error);
      return false;
    }
  }
  
  // Function to fetch available Gemini models
  async function fetchGeminiModels(apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
        method: 'GET'
      });
      
      if (response.status !== 200) {
        throw new Error('Failed to fetch models. Please check your API key.');
      }
      
      const data = await response.json();
      
      if (!data.models || !Array.isArray(data.models)) {
        throw new Error('No models returned from API');
      }
      
      // Filter for models that support text generation and transform to our format
      const supportedModels = data.models
        .filter(model => 
          model.name && 
          model.supportedGenerationMethods && 
          model.supportedGenerationMethods.includes('generateContent')
        )
        .map(model => ({
          name: model.name.replace('models/', ''), // Remove 'models/' prefix for storage
          displayName: model.displayName || model.name.replace('models/', ''),
          description: model.description || ''
        }));
      
      return supportedModels;
    } catch (error) {
      console.error('Error fetching Gemini models:', error);
      throw error;
    }
  }
}); 