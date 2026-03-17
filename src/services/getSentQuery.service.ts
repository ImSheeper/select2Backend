const { getAppsettingsContents } = require('./getAppsettings.service.ts');
const fs = require('fs');
const path = require('path');

function getSentQuery(queryId: string) {
  const appsettings = getAppsettingsContents();

  if (!appsettings) return;

  try {
    const queryPath = path.resolve(__dirname, '../../' + appsettings.config.queryLocation);
    const queriesJSON = JSON.parse(fs.readFileSync(queryPath, 'utf-8'));

    if (!queriesJSON.queries?.[queryId]) {
      console.error('ERROR: Nieznane zapytanie. Sprawdź queries.json.');
      return null;
    }

    return queriesJSON.queries?.[queryId];
  } catch (err) {
    console.log('Błąd podczas wczytywania queries.json: ', err);
    return null;
  }
}

module.exports = { getSentQuery };