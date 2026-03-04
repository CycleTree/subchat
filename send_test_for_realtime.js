const { chromium } = require('playwright-core');

async function sendTestMessage() {
  console.log('🧪 リアルタイム更新テスト用メッセージ送信...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(8000);
    
    // Select Agent 1 session
    await page.click('text=main1');
    await page.waitForTimeout(5000);
    
    // Send test message
    const testMessage = `🔄 Realtime Test ${new Date().toLocaleTimeString()} - Check Gateway events!`;
    
    await page.fill('input[type="text"]', testMessage);
    await page.waitForTimeout(1000);
    
    console.log(`📤 送信: "${testMessage}"`);
    await page.click('text=Send');
    
    console.log('✅ メッセージ送信完了 - Gateway側でイベント確認してください');
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.log('❌ エラー:', error.message);
  } finally {
    await browser.close();
  }
}

sendTestMessage().catch(console.error);
