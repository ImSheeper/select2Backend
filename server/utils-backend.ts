const mysql = require('mysql2/promise');
const express = require('express');
const app = express();
const cors = require("cors");
const fs = require('fs');
const path = require('path');
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

app.get('/api/query/:queryType', async (req: any, res: any) => {
  const queryType: string = req.params.queryType;
  const sqlQueries = getSentQuery(queryType);

  if (!sqlQueries) {
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
    queryParameters.push(limit, offset) ;
    where = search ? 'AND nazwa LIKE ?' : '';
  } else {
    queryParameters.push(limit, offset);
  }

  // Policz ile jest wyników w DB
  const queryCount = sqlQueries['queryCount'];
  const sqlGetRowsCount = `${queryCount} ${where}`;
  const [[{rowsCount}]] = await pool.query(sqlGetRowsCount, queryParameters); 

  // Pobierz dane z DB
  const query = sqlQueries['query'];
  const sqlGetItems: string = `${query} ${where} LIMIT ? OFFSET ?`;
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

function getSentQuery(id) {
  try {
    const appsettingsPath = path.resolve(__dirname, './appsettings.json');
    const file = JSON.parse(fs.readFileSync(appsettingsPath, 'utf-8'));

    const queryPath = path.resolve(__dirname, file.config.queryLocation);
    const queriesJSON = JSON.parse(fs.readFileSync(queryPath, 'utf-8'));

    return queriesJSON.queries?.[id] ?? null;
  } catch (err) {
    console.log('Błąd podczas wczytywania pliku: ', err);
    return null;
  }
}