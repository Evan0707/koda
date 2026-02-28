import { test, expect } from '@playwright/test';

test.describe('Marketing Pages', () => {
 test('Landing page loads correctly', async ({ page }) => {
  await page.goto('/');

  // Check main heading (Le tout-en-un pour...)
  await expect(page.locator('h1').filter({ hasText: /Le tout-en-un pour/i })).toBeVisible();

  // Check navigation contains pricing link - scrolling required if it's in footer
  await page.getByRole('link', { name: 'Tarifs' }).first().scrollIntoViewIfNeeded();
  await expect(page.getByRole('link', { name: 'Tarifs' }).first()).toBeVisible();

  // Check that there is no "Voir la démo" button (was removed)
  await expect(page.getByRole('button', { name: /Voir la démo/i })).toHaveCount(0);
 });

 test('Pricing sections are correct', async ({ page }) => {
  await page.goto('/');

  // Scroll to pricing section to trigger Framer Motion animations
  await page.locator('#pricing').scrollIntoViewIfNeeded();

  // Wait for animation frame to complete
  await expect(page.locator('#pricing')).toBeVisible();
  await expect(page.getByText('Gratuit').first()).toBeVisible();
  await expect(page.getByText('Starter').first()).toBeVisible();
  await expect(page.getByText('Pro', { exact: true }).first()).toBeVisible();
 });

 test('Legal pages load', async ({ page }) => {
  await page.goto('/legal/cgv');
  await expect(page.locator('h1').filter({ hasText: 'Conditions Générales' })).toBeVisible();

  await page.goto('/legal/confidentialite');
  await expect(page.locator('h1').filter({ hasText: 'Politique de Confidentialité' })).toBeVisible();

  await page.goto('/legal/mentions-legales');
  await expect(page.locator('h1').filter({ hasText: 'Mentions Légales' })).toBeVisible();
 });

 test('Help center loads', async ({ page }) => {
  await page.goto('/aide');
  await expect(page.locator('h1').filter({ hasText: "Centre d'aide" })).toBeVisible();
  // Search input should be visible
  await expect(page.getByPlaceholder(/Rechercher/i)).toBeVisible();
 });

 test('Documentation loads', async ({ page }) => {
  await page.goto('/docs');
  await expect(page.locator('h1').filter({ hasText: 'Documentation ' })).toBeVisible();
  // Démarrage card should be visible
  await expect(page.getByRole('link', { name: /Démarrage/i }).first()).toBeVisible();
 });

 test('Changelog loads', async ({ page }) => {
  await page.goto('/changelog');
  await expect(page.locator('h1').filter({ hasText: 'Changelog' })).toBeVisible();
 });

 test('Custom 404 page', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1').filter({ hasText: '404' })).toBeVisible();
  await expect(page.getByText('Page introuvable')).toBeVisible();
 });
});
