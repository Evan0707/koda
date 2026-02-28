import { test, expect } from '@playwright/test';

test.describe('Auth Pages', () => {
 test('Login page loads', async ({ page }) => {
  await page.goto('/login');

  await expect(page.locator('h2').filter({ hasText: 'Bon retour parmi nous' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Mot de passe', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
 });

 test('Signup page loads and has GDPR notice', async ({ page }) => {
  await page.goto('/signup');

  await expect(page.locator('h2').filter({ hasText: 'Créer un compte' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Mot de passe', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Confirmer le mot de passe')).toBeVisible();

  // Verify GDPR notice exists
  const cgvLink = page.getByRole('link', { name: 'CGV/CGU' });
  await cgvLink.scrollIntoViewIfNeeded();
  await expect(cgvLink).toBeVisible();

  const policyLink = page.getByRole('link', { name: /Politique de confidentialité/i });
  await expect(policyLink).toBeVisible();
 });
});
