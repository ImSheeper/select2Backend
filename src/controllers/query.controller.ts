import { getSentQuery } from '../services/getSentQuery.service';
import { getQueryType } from '../services/getQueryType.service';
import pool from '../config/database.config';

async function getDataByQueryId(req: any, res: any){ // 'any' tymczasowo
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
  const [[{rowsCount}]]: any = await pool.query(sqlGetRowsCount, queryParameters); // 'any' tymczasowo, nie umiem jeszcze w typy baz

  // Pobierz dane z DB
  const query = sqlQueries['query'];
  const sqlGetItems: string = `${query} ${where} ${queryString}`;
  console.log(`Query: ${sqlGetItems}`);
  const [items]: any = await pool.query(sqlGetItems, queryParameters); // 'any' tymczasowo, nie umiem jeszcze w typy baz

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
}

export default { getDataByQueryId }