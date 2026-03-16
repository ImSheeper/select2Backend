const fs = require('fs');
const path = require('path');

function getAppsettingsContents() {
  try {
    const appsettingsPath = path.resolve(__dirname, '../config/appsettings.json');
    const file = JSON.parse(fs.readFileSync(appsettingsPath, 'utf-8'));

    return file;
  } catch (err) {
    console.log('Błąd podczas wczytywania pliku appsettings.json: ', err);
    return null;
  }
}

module.exports = { getAppsettingsContents };