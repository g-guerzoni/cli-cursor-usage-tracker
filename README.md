# Cursor Usage Tracker

A command-line tool to track and visualize your Cursor AI premium request usage, with color-coded indicators.

[![npm version](https://badge.fury.io/js/cli-cursor-usage-tracker.svg)](https://badge.fury.io/js/cli-cursor-usage-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![screenshot (3) (2)](https://github.com/user-attachments/assets/765895a3-4c69-4ea0-bae4-f1ae4632b15c)

## Features

- 🤖 Tracks usage of Cursor AI premium requests usage
- 🎨 Color-coded usage indicators (changes from blue → yellow → red as limits approach)
- 📊 Visual progress bar showing percentage of quota used
- 📅 Shows billing cycle information with locale-aware date formatting
- 🔄 Always fetches fresh data for accurate reporting
- 💾 Stores your credentials locally for easy access

## 🟠 Google Chrome Extension Store
Try out the extension in the Google Chrome Store.
```bash
https://chromewebstore.google.com/detail/cursor-request-counter/dafeoklakifgkoehabbdfljakipohaii
```

## Installation

### Option 1: Global Installation (Recommended)

Install the package globally from npm:

```bash
npm install -g cli-cursor-usage-tracker
```

That's it! Now you can run:

```bash
$ cursor-usage
```

Anywhere in your terminal to check your Cursor AI usage! 🎉

### Option 2: Local Development

1. Clone this repository:
   ```bash
   git clone git@github.com:g-guerzoni/cli-cursor-usage-tracker.git
   cd cli-cursor-usage-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Using the Global Command

If you installed the package globally, simply run:

```bash
cursor-usage
```

#### Available Options

- `--clean`: Remove all local configuration files and cached data
  ```bash
  cursor-usage --clean
  ```
  Use this if you want to reset the tool's configuration or start fresh.

### Running Locally

If you're working with the local development version:

```bash
npm start
```

To clean local configuration files:
```bash
npm run clean
```

On first run, you'll be prompted to choose an authentication method:
1. **Import from curl command (recommended)** - Just paste the curl from your browser and the script will extract your credentials and browser headers for maximum compatibility
2. **Enter token manually** - Provide your Cursor session token (the user ID will be extracted automatically)

### Finding Your Cursor Session Token

Here's a detailed guide to finding your Cursor session token:

#### Step 1: Access Cursor Settings

1. Log in to Cursor
2. Go to Settings by visiting: https://www.cursor.com/settings

![screenshot (1)](https://github.com/user-attachments/assets/bb711ae6-d255-4972-9983-dde6e69972ba)

#### Step 2: Open Browser Developer Tools

1. Right-click anywhere on the page and select "Inspect" or press:
   - Chrome/Edge: `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
   - Firefox: `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
   - Safari: First enable Developer menu in Preferences > Advanced, then press `Cmd+Option+I`

![screenshot (2)](https://github.com/user-attachments/assets/c8d34ccd-ef40-42e9-949c-e3b8e492e058)

#### Step 3: Navigate to Network Tab

1. Click the "Network" tab in the developer tools
2. You may need to refresh the page (`F5` or `Ctrl+R`) to see network requests

![screenshot (3)](https://github.com/user-attachments/assets/67e22e5d-e431-43d2-900d-a747e3e7f4d8)

#### Step 4: Find the Usage API Request

1. In the network requests list, look for a request to: `https://www.cursor.com/api/usage?user=...`
2. This request contains all the information you need

![screenshot (4)](https://github.com/user-attachments/assets/f8049abd-e8dd-4324-9f65-15c734fc796f)

#### Method 1: Using the Full CURL Command (Recommended)

This is the easiest method as it automatically extracts everything needed:

1. Right-click on the usage API request in the Network tab
2. Select "Copy" > "Copy as cURL" (or similar, depending on your browser)

![screenshot (5)](https://github.com/user-attachments/assets/71f3ef0b-eb8d-4fb3-acd7-f4dfc3fe7935)

3. When running the script, select option 1 when prompted
4. Paste the entire curl command (Ctrl+V on Windows, Cmd+V on Mac)
5. Press Enter twice to complete the input
6. The script will automatically extract your session token and user ID from the curl command

Step 1:
![screenshot (6)](https://github.com/user-attachments/assets/a1965334-d635-4e3c-8ea1-abc787710c98)

Step 2:
![screenshot (8)](https://github.com/user-attachments/assets/7e9adac7-dfe1-4906-9cae-411174833896)


#### Method 2: Finding Your Session Token

1. Click on the usage API request to see details
2. Go to the "Headers" tab
3. Scroll down to "Request Headers" and find "Cookie"
4. Look for `WorkosCursorSessionToken=` followed by a long string of characters
5. The whole string after `WorkosCursorSessionToken=` and before any semicolon is your token
   Example: `WorkosCursorSessionToken=user_01JKEMPWF0E597XXQEPMBJ391%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Note: The token already contains your user ID, so you don't need to extract it separately.

Step 1:
![screenshot (7)](https://github.com/user-attachments/assets/988a90af-9e5f-4819-9a85-421ab9f14d3b)

Step 2: 
![screenshot (10)](https://github.com/user-attachments/assets/c08576b0-0519-4f93-8168-7bfb7e010c4e)


### Demo Mode

The demo mode now showcases different usage levels with their corresponding color indicators:

```bash
npm run demo
```

This interactive demo shows:
- Low Usage (30%) - Blue color
- Medium Usage (65%) - Blue color
- High Usage (75%) - Yellow warning color
- Critical Usage (92%) - Red alert color
- Maximum Usage (100%) - Red alert color

Press Enter to cycle through each scenario and see how the display changes.

### Running Tests

```bash
npm test
```

## Data Storage

Your credentials and cached responses are stored locally in your home directory:
- `~/.cursor-usage-tracker/config.json` - Contains your User ID and session token
- `~/.cursor-usage-tracker/last-response.json` - Contains the most recent usage data

## Color Coding System

The script uses color coding to help you visualize your usage status:

| Usage Level | Color | Meaning |
|-------------|-------|---------|
| 0% - 69%    | Blue  | Normal usage - You have plenty of requests available |
| 70% - 89%   | Yellow | Warning - You're using a significant portion of your allocation |
| 90% - 100%  | Red   | Critical - You're close to or at your limit |

This makes it easy to quickly see your usage status at a glance.

## Project Structure

```
cursor-request-count-script/
├── data/                 # Stored credentials and cached data
├── src/
│   └── index.ts          # Main application code
├── tests/
│   ├── cli-demo.ts       # Interactive demo script
│   ├── display.test.ts   # Tests for display formatting
│   ├── index.test.ts     # Core functionality tests
│   └── run-tests.ts      # Test runner
├── package.json
└── tsconfig.json
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Submit a pull request
