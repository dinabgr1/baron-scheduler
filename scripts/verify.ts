import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = './test-screenshots';

mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function verify() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  let passed = 0;
  let failed = 0;

  async function check(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (e: any) {
      console.log(`❌ ${name}: ${e.message}`);
      failed++;
    }
  }

  await check('Homepage loads', async () => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-homepage.png` });
  });

  await check('Availability page loads', async () => {
    await page.goto(`${BASE_URL}/availability`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-availability.png` });
  });

  await check('Admin page loads', async () => {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-admin.png` });
  });

  await check('Booking form rejects empty submission', async () => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.screenshot({ path: `${SCREENSHOT_DIR}/04-empty-form.png` });
    }
  });

  await check('Desktop viewport', async () => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-desktop.png` });
  });

  await check('Post-flight page loads', async () => {
    await page.goto(`${BASE_URL}/post-flight`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-post-flight.png` });
  });

  await browser.close();

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}/`);
  console.log(`========================================`);
  
  if (failed > 0) {
    console.log('\n❌ VERIFICATION FAILED — DO NOT COMMIT');
    process.exit(1);
  } else {
    console.log('\n✅ VERIFICATION PASSED — OK to commit');
  }
}

verify().catch((e) => {
  console.error('Verification crashed:', e);
  process.exit(1);
});
