import electron from 'electron';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { StoreData } from 'types';

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

export class UserStore {
  path: string;
  data: StoreData;
  constructor(configName: string) {
    const userDataPath = electron.app.getPath('appData');
    console.log(userDataPath);
    const fileName = `${configName}.json`;
    this.path = isDevelopment
      ? path.join(__dirname, fileName)
      : path.join(userDataPath, fileName);
    this.data = this.parseDataFile();
  }
  get<K extends keyof StoreData>(key: K): StoreData[K] {
    return this.data[key];
  }
  set<K extends keyof StoreData>(key: K, data: StoreData[K]) {
    this.data[key] = data;
    writeFileSync(this.path, JSON.stringify(this.data));
  }
  private parseDataFile(): StoreData {
    try {
      return JSON.parse(readFileSync(this.path, 'utf-8'));
    } catch (err) {
      return { syncTokens: {} };
    }
  }
}
