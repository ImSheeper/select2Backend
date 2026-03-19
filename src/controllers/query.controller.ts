import { getDataByQueryIdService } from "../services/query.service";

async function getDataByQueryId(req: any, res: any){ // 'any' tymczasowo
  try {
    const params = req.params;
    const query = req.query;

    const result = await getDataByQueryIdService(params, query);
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Wystąpił błąd podczas pobierania danych. Skontaktuj się z administratorem.'
    });
    return;
  }
}

export default { getDataByQueryId }