import { Response } from 'express';

interface SSEClient {
  res: Response;
  projectId: string;
}

const clients = new Map<string, SSEClient[]>();

export function addSSEClient(projectId: string, res: Response) {
  const clientList = clients.get(projectId) || [];
  clientList.push({ res, projectId });
  clients.set(projectId, clientList);

  res.on('close', () => {
    removeSSEClient(projectId, res);
  });
}

export function removeSSEClient(projectId: string, res: Response) {
  const clientList = clients.get(projectId) || [];
  clients.set(
    projectId,
    clientList.filter((c) => c.res !== res)
  );
}

export function broadcastToProject(projectId: string, data: unknown) {
  const clientList = clients.get(projectId) || [];
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  clientList.forEach((client) => {
    try {
      client.res.write(payload);
    } catch {
      // Client disconnected
    }
  });
}
