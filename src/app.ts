import express from 'express';
const app = express();
import cors from "cors";

app.use(cors({ origin: "http://localhost:8080" }));

export default app;