import { Queue, Worker } from 'bullmq';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { broadcastToProject } from '../lib/sse';

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
    const response = await fetch(targetUrl, {
      method: webhook.method,
      headers: {
        ...(webhook.headers as Record<string, string>),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
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
      responseBody: await response.text().catch(() => null),
      responseTime,
      isReplay: true,
      originalId: webhook.id,
    };
    const replayWebhook = await prisma.webhook.create({ data: createData });

    broadcastToProject(webhook.projectId, { type: 'webhook', data: replayWebhook });

    return { status: response.status, responseTime };
  },
  { connection: redis }
);

replayWorker.on('failed', (job, err) => {
  console.error(`Replay job ${job?.id} failed:`, err);
});

export default replayWorker;
