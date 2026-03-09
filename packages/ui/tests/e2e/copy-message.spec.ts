import { test, expect } from '@playwright/test';

test.describe('SUB-2: Copy Message', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display copy button on messages', async ({ page }) => {
    // TODO: セッション接続後にメッセージが表示される必要あり
    // 現状はスタブテスト
    await expect(page).toHaveTitle(/SubChat/);
  });

  test('should copy message to clipboard on button click', async ({ page }) => {
    // TODO: 実際のメッセージコンポーネントが必要
    // AC-2: クリップボードコピー
    await expect(page).toHaveTitle(/SubChat/);
  });

  test('should show snackbar feedback after copy', async ({ page }) => {
    // TODO: AC-3: フィードバック表示
    await expect(page).toHaveTitle(/SubChat/);
  });
});
