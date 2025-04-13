import axios from 'axios';
import { CursorConfig } from '../types/index.js';
import { API_ENDPOINTS } from '../config/constants.js';
import { saveResponseCache, saveConfig } from '../utils/fileUtils.js';
import { 
  UsageBasedPremiumResponse, 
  HardLimitResponse, 
  MonthlyInvoiceResult,
  UsageData
} from '../types/index.js';

export async function fetchUsageBasedPremium(config: CursorConfig): Promise<UsageBasedPremiumResponse> {
  try {
    let headers = config.customHeaders || {
      'accept': '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/json',
      'referer': 'https://www.cursor.com/settings',
      'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
    };
    
    if (!headers.Cookie) {
      headers.Cookie = `NEXT_LOCALE=en; WorkosCursorSessionToken=${config.sessionToken}`;
    } else if (!headers.Cookie.includes('WorkosCursorSessionToken')) {
      headers.Cookie += `; WorkosCursorSessionToken=${config.sessionToken}`;
    }
    
    const response = await axios.post(API_ENDPOINTS.USAGE_BASED_PREMIUM, { teamId: 0 }, {
      headers,
      withCredentials: true
    });
    
    return {
      usageBasedPremiumRequests: response.data?.usageBasedPremiumRequests === true
    };
  } catch (error: any) {
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

export async function fetchHardLimit(config: CursorConfig): Promise<HardLimitResponse> {
  try {
    let headers = config.customHeaders || {
      'accept': '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/json',
      'referer': 'https://www.cursor.com/settings',
      'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
    };
    
    if (!headers.Cookie) {
      headers.Cookie = `NEXT_LOCALE=en; WorkosCursorSessionToken=${config.sessionToken}`;
    } else if (!headers.Cookie.includes('WorkosCursorSessionToken')) {
      headers.Cookie += `; WorkosCursorSessionToken=${config.sessionToken}`;
    }
    
    const response = await axios.post(API_ENDPOINTS.HARD_LIMIT, {}, {
      headers,
      withCredentials: true
    });
    
    const hardLimitInDollars = response.data?.hardLimit;
    return {
      hardLimit: hardLimitInDollars ? hardLimitInDollars * 100 : undefined
    };
  } catch (error: any) {
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

export async function fetchMonthlyInvoice(config: CursorConfig): Promise<MonthlyInvoiceResult> {
  try {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let headers = config.customHeaders || {
      'accept': '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/json',
      'referer': 'https://www.cursor.com/settings',
      'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
    };
    
    if (!headers.Cookie) {
      headers.Cookie = `NEXT_LOCALE=en; WorkosCursorSessionToken=${config.sessionToken}`;
    } else if (!headers.Cookie.includes('WorkosCursorSessionToken')) {
      headers.Cookie += `; WorkosCursorSessionToken=${config.sessionToken}`;
    }
    
    const response = await axios.post(API_ENDPOINTS.MONTHLY_INVOICE, {
      month: currentMonth,
      year: currentYear,
      includeUsageEvents: false,
    }, {
      headers,
      withCredentials: true
    });
    
    const data = response.data;
    
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return {
        success: true,
        totalCents: 0,
      };
    }
    
    const totalCents = data.items.reduce((sum: number, item: { cents?: number }) => {
      return sum + (typeof item.cents === "number" ? item.cents : 0);
    }, 0);
    
    return {
      success: true,
      totalCents,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function fetchCursorData(config: CursorConfig): Promise<UsageData> {
  try {
    const API_URL = `${API_ENDPOINTS.USAGE}?user=${config.userId}`;
    
    let headers = config.customHeaders || {
      'accept': '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'referer': 'https://www.cursor.com/settings',
      'sec-ch-ua': '"Not;A=Brand";v="99", "Chromium";v="106"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36'
    };
    
    if (!headers.Cookie) {
      headers.Cookie = `NEXT_LOCALE=en; WorkosCursorSessionToken=${config.sessionToken}`;
    } else if (!headers.Cookie.includes('WorkosCursorSessionToken')) {
      headers.Cookie += `; WorkosCursorSessionToken=${config.sessionToken}`;
    }
    
    const response = await axios.get(API_URL, {
      headers,
      withCredentials: true
    });
    
    const usageBasedPremium = await fetchUsageBasedPremium(config);
    response.data.usageBasedPremiumRequests = usageBasedPremium.usageBasedPremiumRequests;
    
    if (usageBasedPremium.usageBasedPremiumRequests) {
      const hardLimit = await fetchHardLimit(config);
      response.data.hardLimit = hardLimit.hardLimit;
      
      const monthlyInvoice = await fetchMonthlyInvoice(config);
      response.data.totalCents = monthlyInvoice.totalCents;
    }
    
    saveResponseCache(response.data);
    saveConfig(config);
    
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        console.error(`⚠️ Authentication error: ${error.response.status} ${error.response.statusText}`);
        throw new Error('Authentication failed. Please check your credentials.');
      } else {
        console.error(`⚠️ API error: ${error.response.status} ${error.response.statusText}`);
        throw new Error(`API error: ${error.response.status} ${error.response.statusText}`);
      }
    } else {
      console.error('⚠️ Error fetching data:', error.message);
      throw error;
    }
  }
}