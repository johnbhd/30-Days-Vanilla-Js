import { fileURLToPath } from 'node:url';
import { startServer } from './server.mjs';
import { generateGallery, packageSite } from './pipeline.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = await startServer(root);
try {
  await generateGallery({ root, baseUrl: server.url });
  await packageSite(root);
} finally {
  await server.close();
}
