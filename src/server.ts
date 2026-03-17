const app = require('./app.ts');
const queryRoutes = require('./routes/queryRoutes.ts');
const port = process.env.PORT || 3000;

// Route - get data from DB dynamically
app.use(queryRoutes);

app.listen(port, () => console.log(`Started listening on port ${port}...`));
