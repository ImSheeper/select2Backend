import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getAppsettingsContents() {
  try {
    const appsettingsPath = path.resolve(__dirname, '../../data/appsettings.json');
    const file = JSON.parse(fs.readFileSync(appsettingsPath, 'utf-8'));

    return file;
  } catch (err) {
    console.log('Błąd podczas wczytywania pliku appsettings.json: ', err);
    return null;
  }
}