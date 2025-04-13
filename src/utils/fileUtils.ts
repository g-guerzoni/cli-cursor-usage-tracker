import fs from 'fs';
import { DATA_DIR, CONFIG_FILE, CACHE_FILE } from '../config/constants.js';
import { CursorConfig, CachedResponse } from '../types/index.js';

export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadConfig(): CursorConfig {
  ensureDataDir();
  
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Error reading config file, deleting corrupted file and creating new one');
      try {
        fs.unlinkSync(CONFIG_FILE);
      } catch (deleteError) {
        console.error('Failed to delete corrupted config file:', deleteError);
      }
    }
  }
  
  return {
    userId: '',
    sessionToken: ''
  };
}

export function saveConfig(config: CursorConfig): void {
  ensureDataDir();
  config.lastRequest = new Date();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function saveResponseCache(data: any): void {
  ensureDataDir();
  const cache: CachedResponse = {
    data,
    timestamp: new Date()
  };
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

export function loadCachedResponse(): any | null {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const cacheData = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(cacheData).data;
    } catch (error) {
      console.error('Error reading cache file, deleting corrupted file');
      try {
        fs.unlinkSync(CACHE_FILE);
      } catch (deleteError) {
        console.error('Failed to delete corrupted cache file:', deleteError);
      }
      return null;
    }
  }
  return null;
}

export function cleanLocalFiles(): void {
  console.log('\n🧹 Cleaning local configuration files...');
  
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
      console.log('✅ Removed config file');
    }
    
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
      console.log('✅ Removed cache file');
    }
    
    if (fs.existsSync(DATA_DIR)) {
      fs.rmdirSync(DATA_DIR);
      console.log('✅ Removed data directory');
    }
    
    console.log('\n✨ All local files have been cleaned successfully!');
    console.log('Next time you run cursor-usage, you\'ll need to authenticate again.');
  } catch (error) {
    console.error('❌ Error while cleaning files:', error);
    process.exit(1);
  }
  
  process.exit(0);
}