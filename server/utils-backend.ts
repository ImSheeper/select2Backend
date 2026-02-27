const mysql = require('mysql2/promise');
const express = require('express');
const app = express();
const cors = require("cors");
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

app.get('/api/query/:sqlQuery', async (req: any, res: any) => {
  const page: number  = Math.max(parseInt(req.query.page ?? "1", 10), 1);
  const limit: number = Math.min(Math.max(parseInt(req.query.limit ?? "10", 10), 1), 100);
  const offset: number = (page - 1) * limit;
  const search: string = (req.query.search ?? '').trim();
  const sqlQuery: string = req.params.sqlQuery;
  const sqlGetData = getSentQuery(sqlQuery);
  const sqlCount = sqlGetData['sqlCount'];
  const query = sqlGetData['sql'];
try {
  let where: string = search ? 'WHERE nazwa LIKE ?' : '';

  // Testy parametrow
  let stringParameters = [];
  const queryParameters = req.query.queryParameters;

  if (queryParameters) {
    for (let queryParameter of queryParameters) {
      stringParameters.push(queryParameter);
    }
  }

  if (search) {
    stringParameters.push(`%${search}%`)
  }

  // Poprawienie SQL i dodanie parametrow do zapytania
  if (Array.isArray(queryParameters) && queryParameters.length) {
    stringParameters.push(limit, offset) ;
    where = search ? 'AND nazwa LIKE ?' : '';
  } else {
    stringParameters.push(limit, offset);
  }

  // Policz ile jest wyników w DB
  const sqlGetRowsCount = `${sqlCount} ${where}`;
  // const paramsGetRowsCount = search ? [`%${search}%`] : [];
  const [[{total}]] = await pool.query(sqlGetRowsCount, stringParameters); 

  // Pobierz dane z DB
  const sqlGetItems: string = `${query} ${where} LIMIT ? OFFSET ?`;
  const paramsGetItems = stringParameters;

  const [results] = await pool.query(sqlGetItems, paramsGetItems);

  const isMorePages: boolean = offset + results.length < total;

  res.json({
    results: results,
    pagination: { more: isMorePages }
  });
} catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'An error occured during the data fetching.'
    });
  }
});

function getSentQuery(id: string) {
  const file = require('./appsettings.json');
  const queryLocation = file.config.queryLocation

  const queriesJSON = require(queryLocation);
  const querySql = queriesJSON.queries[id]
  
  return querySql;
}