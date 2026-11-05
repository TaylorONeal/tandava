import { expect, test } from '@playwright/test';
test('checkout return never turns a forged success parameter into confirmation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/checkout/return?app=member&paid=true&success=true');
  await expect(page.getByRole('heading', { name: 'Return to your practice' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to Tandava', exact: true })).toHaveAttribute('href', 'tandava-member://checkout-return');
  await expect(page.getByText('Your booking and purchase status are in the app. Payment confirmation can take a moment.')).toBeVisible();
  await expect(page.getByText(/payment successful|booking confirmed|you.re booked/i)).toHaveCount(0);
});
test('studio return selects the studio app and rejects arbitrary app names', async ({ page }) => {
  await page.goto('/checkout/return?app=studio');
  await expect(page.getByRole('link', { name: 'Return to Tandava Studio' })).toHaveAttribute('href', 'tandava-studio://checkout-return');
  await page.goto('/checkout/return?app=javascript:alert(1)');
  await expect(page.getByRole('link')).toHaveCount(0);
});
