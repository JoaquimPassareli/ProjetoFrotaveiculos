import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/api/ping', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'fleet-backend',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Servidor Node.js ativo em http://localhost:${PORT}`);
});
