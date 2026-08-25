import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGEERROR", String(e)));
page.on("console", (m) => console.log(m.type().toUpperCase(), m.text()));
await page.goto("http://localhost:5173?fast=1&seed=13", { waitUntil: "load" });
await page.waitForTimeout(3000);
console.log("has __aura:", await page.evaluate(() => window.__aura !== undefined));
await browser.close();
