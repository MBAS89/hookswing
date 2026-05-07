import dotenv from 'dotenv';
dotenv.config();

import { server } from './server';

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 HookSwing API running on port ${PORT}`);
});
