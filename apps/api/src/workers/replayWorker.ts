import { Queue, Worker } from 'bullmq';
import axios from 'axios';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { getIO } from '../lib/socketio';

export const replayQueue = new Queue('replay', { connection: redis });

const replayWorker = new Worker(
  'replay',
  async (job) => {
    const { webhookId, targetUrl, headers, body } = job.data;

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) throw new Error('Webhook not found');

    const start = Date.now();
    const response = await axios({
      method: webhook.method as any,
      url: targetUrl,
      headers: {
        ...(webhook.headers as Record<string, string>),
        ...headers,
      },
      data: body ? JSON.stringify(body) : undefined,
      timeout: 30000,
      validateStatus: () => true,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    const responseTime = Date.now() - start;

    const createData: any = {
      projectId: webhook.projectId,
      method: webhook.method,
      headers: { ...(webhook.headers as any), ...headers },
      body: body || webhook.body,
      query: webhook.query,
      ip: '127.0.0.1',
      userAgent: 'WebhookVault-Replay',
      statusCode: response.status,
      responseBody: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
      responseTime,
      isReplay: true,
      originalId: webhook.id,
    };
    const replayWebhook = await prisma.webhook.create({ data: createData });

    if (webhook.projectId) getIO()?.to(webhook.projectId).emit('webhook', replayWebhook);

    return { status: response.status, responseTime };
  },
  { connection: redis }
);

replayWorker.on('failed', (job, err) => {
  console.error(`Replay job ${job?.id} failed:`, err);
});

export default replayWorker;
