import { defineConfig } from "@playwright/test";
const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
export default defineConfig({ testDir: "tests/e2e", use: { baseURL: `http://127.0.0.1:${port}` }, webServer: { command: `npm run build && npx vite preview --host 127.0.0.1 --port ${port}`, port, reuseExistingServer: false } });
