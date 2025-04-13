import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USER_HOME = os.homedir();
const DATA_DIR = path.join(USER_HOME, '.cursor-usage-tracker');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const CACHE_FILE = path.join(DATA_DIR, 'last-response.json');

const COLORS = {
  RESET: '\x1b[0m',
  CYAN: '\x1b[1;36m',
  RED: '\x1b[1;31m',
  YELLOW: '\x1b[1;33m',
  GREEN: '\x1b[1;32m'
};

const API_ENDPOINTS = {
  USAGE: 'https://www.cursor.com/api/usage',
  USAGE_BASED_PREMIUM: 'https://www.cursor.com/api/dashboard/get-usage-based-premium-requests',
  HARD_LIMIT: 'https://www.cursor.com/api/dashboard/get-hard-limit',
  MONTHLY_INVOICE: 'https://www.cursor.com/api/dashboard/get-monthly-invoice'
};

export {
  USER_HOME,
  DATA_DIR,
  CONFIG_FILE,
  CACHE_FILE,
  COLORS,
  API_ENDPOINTS
};