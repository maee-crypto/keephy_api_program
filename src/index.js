import express from 'express';
import mongoose from 'mongoose';
import pino from 'pino';
import pinoHttp from 'pino-http';

const PORT = process.env.PORT || 3012;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/keephy_api';
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

mongoose.set('strictQuery', true);
mongoose.connect(MONGO_URL).then(() => logger.info('Connected to MongoDB')).catch((e) => { logger.error(e); process.exit(1); });

const keySchema = new mongoose.Schema({ tenantId: String, key: String, scopes: [String], active: Boolean }, { timestamps: true });
const ApiKey = mongoose.model('ApiKey', keySchema);

const app = express();
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-program-service' }));
app.get('/ready', (_req, res) => {
  const state = mongoose.connection.readyState; res.status(state === 1 ? 200 : 503).json({ ready: state === 1 });
});

app.get('/api-keys/:tenantId', async (req, res) => {
  const keys = await ApiKey.find({ tenantId: req.params.tenantId, active: true }).lean();
  res.json(keys.map(k => ({ key: k.key, scopes: k.scopes })));
});

app.listen(PORT, () => logger.info(`api-program-service listening on ${PORT}`));


