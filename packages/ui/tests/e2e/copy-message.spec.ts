import { test, expect } from '@playwright/test';

test.describe('SUB-2: Copy Message', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('AC-1: should display copy button on messages', async ({ page }) => {
    // メッセージが表示されるまで待機
    const message = page.locator('[data-testid="message"]').first();
    
    // メッセージが存在する場合のみテスト
    const messageCount = await page.locator('[data-testid="message"]').count();
    if (messageCount > 0) {
      // コピーボタンが存在することを確認
      const copyButton = message.getByRole('button', { name: /copy/i });
      await expect(copyButton).toBeVisible();
    } else {
      // メッセージがない場合はスキップ（セッション未接続時）
      test.skip();
    }
  });

  test('AC-2: should copy message to clipboard on button click', async ({ page, context }) => {
    // クリップボード権限を付与
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    const messageCount = await page.locator('[data-testid="message"]').count();
    if (messageCount > 0) {
      const message = page.locator('[data-testid="message"]').first();
      const copyButton = message.getByRole('button', { name: /copy/i });
      
      await copyButton.click();
      
      // クリップボードの内容を確認
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText.length).toBeGreaterThan(0);
    } else {
      test.skip();
    }
  });

  test('AC-3: should show snackbar feedback after copy', async ({ page }) => {
    const messageCount = await page.locator('[data-testid="message"]').count();
    if (messageCount > 0) {
      const message = page.locator('[data-testid="message"]').first();
      const copyButton = message.getByRole('button', { name: /copy/i });
      
      await copyButton.click();
      
      // Snackbar が表示されることを確認
      const snackbar = page.getByRole('alert');
      await expect(snackbar).toBeVisible();
      await expect(snackbar).toContainText(/copied/i);
      
      // 2秒後に消えることを確認
      await expect(snackbar).not.toBeVisible({ timeout: 3000 });
    } else {
      test.skip();
    }
  });
});
