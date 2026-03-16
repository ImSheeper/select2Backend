const app = require('./app.ts');
const { getSentQuery } = require('./services/getSentQuery.service.ts');
const { getQueryType } = require('./services/getQueryType.service.ts');

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Started listening on port ${port}...`));

const pool = require('./config/database.config');

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
  const frontendParameters: string[] = req.query.queryParameters;

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
  const limit: number = Math.min(Math.max(parseInt(req.query.limit ?? "100", 10), 1), 1000);
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