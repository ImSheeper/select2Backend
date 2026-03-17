import { getSentQuery } from '../services/getSentQuery.service';
import { getQueryType } from '../services/getQueryType.service';
import { getDbType } from '../services/getDbType.service';
import { poolPromise, sql, pool } from '../config/database.config';

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

  const queryCount = sqlQueries['queryCount'];
  const sqlGetRowsCount = `${queryCount} ${where}`;
  const query = sqlQueries['query'];
  const sqlGetItems: string = `${query} ${where} ${queryString}`;
  console.log(`Query: ${sqlGetItems}`);

  let items: any = [];
  let rowsCount: any = 0;
  const dbType = getDbType();
  
  if (dbType === 'mssql') {
    const pool = await poolPromise;

    const countRequest = pool.request();
    queryParameters.forEach((value, index) => {
      countRequest.input(`p${index}`, value);
    });

    let countParamIndex = 0;
    const parsedSqlGetRowsCount = sqlGetRowsCount.replace(/\?/g, () => `@p${countParamIndex++}`);

    const countResult = await countRequest.query(parsedSqlGetRowsCount);
    rowsCount = countResult.recordset[0]?.rowsCount ?? 0;

    const itemsRequest = pool.request();
    queryParameters.forEach((value, index) => {
      itemsRequest.input(`p${index}`, value);
    });

    let itemsParamIndex = 0;
    const sqlGetItemsMssql = sqlGetItems.replace(/\?/g, () => `@p${itemsParamIndex++}`);

    const itemsResult = await itemsRequest.query(sqlGetItemsMssql);
    items = itemsResult.recordset;
  } else {
    [[{ rowsCount }]] = await pool.query(sqlGetRowsCount, queryParameters);
    [items] = await pool.query(sqlGetItems, queryParameters);
  }

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