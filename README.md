# SummarizeShortcut Chrome Extension

A Chrome extension that lets you quickly summarize any text on a webpage using OpenAI's API.

## Features

- Summarize any highlighted text with a keyboard shortcut (Ctrl+Shift+S, which is Command+Shift+S on Mac)
- Display the summary in a popup next to the highlighted text
- Securely store your OpenAI API key
- Easy to use interface

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the folder containing the extension files
5. The extension icon should now appear in your Chrome toolbar

## Setup

1. Click on the extension icon in your toolbar
2. Enter your OpenAI API key (you can get one from [OpenAI's platform](https://platform.openai.com/api-keys))
3. Click "Save" to verify and store your API key

## Usage

1. Highlight any text on a webpage
2. Press `Ctrl+Shift+S` (which is `Command+Shift+S` on Mac)
3. A popup will appear next to your selection with a summary of the text
4. If no text is highlighted, a instructions popup will appear

## Privacy

- Your OpenAI API key is stored locally in your browser's storage
- The extension only sends the highlighted text to OpenAI's API for summarization
- No data is collected or shared with any third parties

## Development

The extension is built using vanilla JavaScript and Chrome Extension APIs.

- `popup.html` and `popup.js`: Handle the UI for setting the API key
- `service-worker.js`: Manages the keyboard shortcut and injection of content scripts
- `manifest.json`: Configuration for the Chrome extension

## License

MIT 