# Cursor Usage Tracker

A command-line tool to track and visualize your Cursor AI usage, including API requests and token consumption, with color-coded indicators.

TODO: [Screenshot]

## Features

- 🤖 Tracks usage of Cursor AI premium requests usage
- 🎨 Color-coded usage indicators (changes from blue → yellow → red as limits approach)
- 📊 Visual progress bar showing percentage of quota used
- 📅 Shows billing cycle information with locale-aware date formatting
- 🔄 Always fetches fresh data for accurate reporting
- 💾 Stores your credentials locally for easy access

## Installation

### Option 1: Global Installation (Recommended)

Install the package globally from npm:

```bash
npm install -g cursor-usage-tracker
```

This will make the `cursor-usage` command available globally in your terminal.

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

### Running Locally

If you're working with the local development version:

```bash
npm start
```

On first run, you'll be prompted to choose an authentication method:
1. **Import from curl command (recommended)** - Just paste the curl from your browser and the script will extract your credentials and browser headers for maximum compatibility
2. **Enter token manually** - Provide your Cursor session token (the user ID will be extracted automatically)

### Finding Your Cursor Session Token

Here's a detailed guide to finding your Cursor session token:

#### Step 1: Access Cursor Settings

1. Log in to Cursor
2. Go to Settings by visiting: https://www.cursor.com/settings

TODO: [Screenshot: Cursor settings page]

#### Step 2: Open Browser Developer Tools

1. Right-click anywhere on the page and select "Inspect" or press:
   - Chrome/Edge: `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
   - Firefox: `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
   - Safari: First enable Developer menu in Preferences > Advanced, then press `Cmd+Option+I`

TODO: [Screenshot: Browser context menu showing "Inspect" option]

#### Step 3: Navigate to Network Tab

1. Click the "Network" tab in the developer tools
2. You may need to refresh the page (`F5` or `Ctrl+R`) to see network requests

TODO: [Screenshot: Developer tools with Network tab highlighted]

#### Step 4: Find the Usage API Request

1. In the network requests list, look for a request to: `https://www.cursor.com/api/usage?user=...`
2. This request contains all the information you need

TODO: [Screenshot: Network tab showing the usage API request]

#### Method 1: Using the Full CURL Command (Recommended)

This is the easiest method as it automatically extracts everything needed:

1. Right-click on the usage API request in the Network tab
2. Select "Copy" > "Copy as cURL" (or similar, depending on your browser)

TODO: [Screenshot: Context menu showing "Copy as cURL" option]

3. When running the script, select option 1 when prompted
4. Paste the entire curl command (Ctrl+V on Windows, Cmd+V on Mac)
5. Press Enter twice to complete the input
6. The script will automatically extract your session token and user ID from the curl command

TODO: [Screenshot: Terminal showing the paste input prompt with curl command]

#### Method 2: Finding Your Session Token

1. Click on the usage API request to see details
2. Go to the "Headers" tab
3. Scroll down to "Request Headers" and find "Cookie"
4. Look for `WorkosCursorSessionToken=` followed by a long string of characters
5. The whole string after `WorkosCursorSessionToken=` and before any semicolon is your token
   Example: `WorkosCursorSessionToken=user_01JKEMPWF0E597XXQEPMBJ391%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Note: The token already contains your user ID, so you don't need to extract it separately.

TODO: [Screenshot: Request headers showing the cookie with token highlighted]

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