const mysql = require('mysql2/promise');
const express = require('express');
const app = express();
const cors = require("cors");
app.use(cors({ origin: "http://localhost:8080" }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Started listening on port ${port}...`));

const pool = mysql.createPool({
  host: 'host.docker.internal',
  user: 'appuser',
  password: 'apppass',
  database: 'appdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get('/api/query/:sqlQuery', async (req, res) => {
  const page = Math.max(parseInt(req.query.page ?? "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit ?? "10", 10), 1), 100);
  const offset = (page - 1) * limit;
  const term = (req.query.term ?? '').trim();

  const sqlQuery = req.params.sqlQuery;

  const sqlGetData = getSentQuery(sqlQuery);
  const sqlCount = sqlGetData['sqlCount'];
  const query = sqlGetData['sql'];
try {
  let where = term ? 'WHERE nazwa LIKE ?' : '';

  // Policz ile jest wyników w DB
  const sqlGetRowsCount = `${sqlCount} ${where}`;
  const paramsGetRowsCount = term ? [`%${term}%`] : [];
  const [[{total}]] = await pool.query(sqlGetRowsCount, paramsGetRowsCount); 

  // Testy parametrow
  const queryParameters = req.query.queryParameters;
  console.log(req.query.queryParameters);

  if (queryParameters) {
    stringParameters = [queryParameters, limit, offset];
    where = term ? 'AND nazwa LIKE ?' : '';
  } else {
    stringParameters = [limit, offset];
  }

  // Pobierz dane z DB
  const sqlGetItems = `${query} ${where} LIMIT ? OFFSET ?`;
  const paramsGetItems = term 
    ? [queryParameters, `%${term}%`, limit, offset] 
    : stringParameters;

  const [results] = await pool.query(sqlGetItems, paramsGetItems);

  const isMorePages = offset + results.length < total;

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

function getSentQuery(id) {
  const file = require('./appsettings.json');
  const queryLocation = file.config.queryLocation

  const queriesJSON = require(queryLocation);
  const querySql = queriesJSON.queries[id]
  
  return querySql;
}