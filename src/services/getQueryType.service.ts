const { getAppsettingsContents } = require('./getAppsettings.service.ts');
const { XMLParser } = require("fast-xml-parser");
const fs = require('fs');
const path = require('path');

function getQueryType() {
  const appsettings = getAppsettingsContents();
  if (!appsettings) return;

  try {
    const xmlPath = path.resolve(__dirname, '../../data/databaseType.xml');
    const xmlFile = fs.readFileSync(xmlPath, 'utf-8');

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });

    const objectXML = parser.parse(xmlFile);
    const databaseTypeJSON: string = appsettings?.config?.databaseType;
    
    if (!objectXML.type?.queries[databaseTypeJSON]) {
      console.error('ERROR: Nieobsługiwany typ bazy danych. Sprawdź appsettings.json > databaseType.');
      return null;
    }

    return objectXML.type?.queries[databaseTypeJSON];
  } catch (err) {
    console.log('Błąd podczas wczytywania pliku databaseType.xml: ', err);
    return null;
  }
}

module.exports = { getQueryType };