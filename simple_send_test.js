const { chromium } = require('playwright-core');

async function simpleSendTest() {
  console.log('🔍 Send Handler 実行確認テスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor ALL console messages
  page.on('console', msg => {
    console.log(`🔍 CONSOLE: ${msg.text()}`);
  });
  
  // Monitor JavaScript errors
  page.on('pageerror', error => {
    console.log(`❌ JS ERROR: ${error.message}`);
  });
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(8000);
    
    // Select main1 session
    await page.click('text=main1');
    await page.waitForTimeout(6000);
    
    // Type test message
    console.log('📝 メッセージ入力...');
    await page.fill('input[type="text"]', 'Simple test');
    await page.waitForTimeout(1000);
    
    // Check button state before click
    const buttonState = await page.evaluate(() => {
      const button = document.querySelector('button');
      return {
        exists: !!button,
        disabled: button?.disabled || false,
        text: button?.textContent || '',
        onclick: typeof button?.onclick
      };
    });
    
    console.log('🔍 ボタン状態:', buttonState);
    
    // Click send button
    console.log('🖱️ Send ボタンクリック...');
    await page.click('button');
    
    // Wait briefly to see if logs appear
    await page.waitForTimeout(3000);
    
    console.log('✅ テスト完了');
    
  } catch (error) {
    console.log('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
  }
}

simpleSendTest().catch(console.error);
