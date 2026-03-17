import app from './app';
import queryRoutes from './routes/query.routes';
const port = process.env.PORT || 3000;

// Route - get data from DB dynamically
app.use(queryRoutes);

app.listen(port, () => console.log(`Started listening on port ${port}...`));
