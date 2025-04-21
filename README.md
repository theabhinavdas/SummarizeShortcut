# SummarizeShortcut Chrome Extension

A Chrome extension that lets you quickly summarize any text on a webpage using OpenAI's API.

## Features

- Summarize any highlighted text with a keyboard shortcut (Ctrl+Shift+S, which is Command+Shift+S on Mac)
- Display the summary in a popup on the bottom right corner of the page
- Securely (locally) store your LLM keys
- Easy to use interface interface

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the folder containing the extension files
5. The extension icon should now appear in your Chrome toolbar (it has a lightning icon)

## Limitations

While the extension settings show options for OpenAI, Azure OpenAI and Gemini, I've only fully tested this with Gemini. The other two options don't work at the minute. Please feel free to issue a PR to fix.

## Setup

1. Click on the extension icon in your toolbar
2. Enter your Gemini key. 
3. Then click on "Fetch Available Models"
4. Select an available model from the dropdown
5. Click "Save Settings"

## Usage

1. Highlight any text on a webpage
2. Press `Ctrl+Shift+S` (or `Command+Shift+S` on Mac)
3. A popup will appear on the bottom right corner with the summary
4. If no text is highlighted, a friendly error will be shown, asking you to select some text :)

## Privacy

- Your API keys are stored locally in your browser's storage
- The extension only sends the highlighted text to LLM's API for summarization
- No data is collected or shared with any third parties

## Development

The extension is built using vanilla JavaScript and Chrome Extension APIs.

- `popup.html` and `popup.js`: Handle the UI for setting the API key
- `service-worker.js`: Manages the keyboard shortcut and injection of content scripts
- `manifest.json`: Configuration for the Chrome extension

## License

MIT 