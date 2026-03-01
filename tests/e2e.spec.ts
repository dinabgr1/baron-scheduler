import { test, expect } from '@playwright/test';

test('homepage loads and shows booking form', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'הזמנת טיסה' })).toBeVisible();
  await expect(page.getByText('שם הטייס')).toBeVisible();
  await expect(page.getByText('תאריך')).toBeVisible();
});

test('availability page loads with calendar', async ({ page }) => {
  await page.goto('/availability');
  await expect(page.getByText('זמינות המטוס')).toBeVisible();
  await expect(page.getByText('Beechcraft Baron 58')).toBeVisible();
});

test('admin page shows login form', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByText('כניסת מנהל')).toBeVisible();
  await expect(page.getByPlaceholder('סיסמה')).toBeVisible();
  await expect(page.getByRole('button', { name: 'כניסה' })).toBeVisible();
});

test('booking form validates required fields', async ({ page }) => {
  await page.goto('/');
  const submitButton = page.getByRole('button', { name: /שלח הזמנה|הירשם ושלח/ });
  await submitButton.click();
  // HTML5 validation should prevent submission — form should still be visible
  await expect(page.getByRole('heading', { name: 'הזמנת טיסה' })).toBeVisible();
  // Success message should NOT appear
  await expect(page.getByText('ההזמנה נשלחה בהצלחה')).not.toBeVisible();
});

test('fuel calculator works', async ({ page }) => {
  await page.goto('/tools');
  await expect(page.getByText('מחשבון דלק')).toBeVisible();
  // Enter desired gallons
  const desiredInput = page.locator('input[max="166"]');
  await desiredInput.fill('100');
  // Select quarter (¼ = 41.5 gallons)
  await page.getByRole('button', { name: '¼' }).click();
  // Should show liters to add: (100 - 41.5) * 3.785 = 221.4
  await expect(page.getByText(/יש להוסיף.*ליטר/)).toBeVisible();
});

test('admin login with wrong password shows error', async ({ page }) => {
  await page.goto('/admin');
  await page.getByPlaceholder('סיסמה').fill('wrong');
  await page.getByRole('button', { name: 'כניסה' }).click();
  await expect(page.getByText('סיסמה שגויה')).toBeVisible();
});

test('admin login with correct password succeeds', async ({ page }) => {
  await page.goto('/admin');
  await page.getByPlaceholder('סיסמה').fill(process.env.ADMIN_PASSWORD || 'BaronAdmin');
  await page.getByRole('button', { name: 'כניסה' }).click();
  await expect(page.getByText('פאנל ניהול')).toBeVisible({ timeout: 15000 });
});
