const mysql = require('mysql2/promise');
const express = require('express');
const app = express();
const cors = require("cors");
const fs = require('fs');
const path = require('path');
const { XMLParser } = require("fast-xml-parser");
app.use(cors({ origin: "http://localhost:8080" }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Started listening on port ${port}...`));

const pool = mysql.createPool({
  host: 'app-mysql',
  user: 'appuser',
  password: 'apppass',
  database: 'appdb',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get('/api/query/:queryId', async (req: any, res: any) => {
  const queryId: string = req.params.queryId;
  const sqlQueries = getSentQuery(queryId);

  if (!sqlQueries) {
    res.status(500).json({
      error: 'Błąd podczas wczytywania pliku. Skontaktuj się z administratorem.'
    });
    return;
  }

  const queryString: string = getQueryType();

  if (!queryString) {
    res.status(500).json({
      error: 'Błąd podczas wczytywania pliku. Skontaktuj się z administratorem.'
    });
    return;
  }

try {
  let queryParameters: (string | number)[] = []; 
  const frontendParameters: Array<string> = req.query.queryParameters;

  if (Array.isArray(frontendParameters) && frontendParameters.length) {
    for (let parameter of frontendParameters) {
      queryParameters.push(parameter);
    }
  }
  
  const search: string = (req.query.term ?? '').trim();

  if (search) {
    queryParameters.push(`%${search}%`)
  }

  const page: number  = Math.max(parseInt(req.query.page ?? "1", 10), 1);
  const limit: number = Math.min(Math.max(parseInt(req.query.limit ?? "10", 10), 1), 100);
  const offset: number = (page - 1) * limit;
  
  let where: string = search ? 'WHERE nazwa LIKE ?' : '';

  if (Array.isArray(frontendParameters) && frontendParameters.length) {
    queryParameters.push(offset, limit) ;
    where = search ? 'AND nazwa LIKE ?' : '';
  } else {
    queryParameters.push(offset, limit);
  }

  // Policz ile jest wyników w DB
  const queryCount = sqlQueries['queryCount'];
  const sqlGetRowsCount = `${queryCount} ${where}`;
  const [[{rowsCount}]] = await pool.query(sqlGetRowsCount, queryParameters); 

  // Pobierz dane z DB
  const query = sqlQueries['query'];
  const sqlGetItems: string = `${query} ${where} ${queryString}`;
  console.log(`Query: ${sqlGetItems}`);
  const [items] = await pool.query(sqlGetItems, queryParameters);

  const isMorePages: boolean = offset + items.length < rowsCount;
  
  res.json({
    results: items,
    pagination: { more: isMorePages }
  });
} catch (err) {
    console.error('Wystąpił błąd podczas pobierania danych: ', err);
    res.status(500).json({
      error: 'Wystąpił błąd podczas pobierania danych. Skontaktuj się z administratorem.'
    });
    return;
  }
});

function getSentQuery(queryId: string) {
  const appsettings = getAppsettingsContents();
  if (!appsettings) return;

  try {

    const queryPath = path.resolve(__dirname, appsettings.config.queryLocation);
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

function getQueryType() {
  const appsettings = getAppsettingsContents();
  if (!appsettings) return;

  try {
    const xmlPath = path.resolve(__dirname, './databaseType.xml');
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

function getAppsettingsContents() {
  try {
    const appsettingsPath = path.resolve(__dirname, './appsettings.json');
    const file = JSON.parse(fs.readFileSync(appsettingsPath, 'utf-8'));

    return file;
  } catch (err) {
    console.log('Błąd podczas wczytywania pliku appsettings.json: ', err);
    return null;
  }
}