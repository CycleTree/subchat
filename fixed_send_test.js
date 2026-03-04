const { chromium } = require('playwright-core');

async function fixedSendTest() {
  console.log('🔧 正しいSendボタンテスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor send-related logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('💬 handleSendMessage') || 
        text.includes('⚡') ||
        text.includes('Send button clicked') ||
        text.includes('🖱️')) {
      console.log(`🔍 ${text}`);
    }
  });
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(8000);
    
    // Select main1 session
    await page.click('text=main1');
    await page.waitForTimeout(6000);
    
    // Type test message
    await page.fill('input[type="text"]', 'Fixed send test');
    await page.waitForTimeout(1000);
    
    // Check all buttons on the page
    const allButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).map((btn, i) => ({
        index: i,
        text: btn.textContent?.trim() || '',
        disabled: btn.disabled,
        style: btn.getAttribute('style') || ''
      }));
    });
    
    console.log('🔍 ページ上の全ボタン:');
    allButtons.forEach(btn => {
      console.log(`  ${btn.index}: "${btn.text}" (disabled: ${btn.disabled})`);
    });
    
    // Find the correct Send button
    const sendButtonIndex = allButtons.findIndex(btn => 
      btn.text === 'Send' || btn.text === '⏳'
    );
    
    if (sendButtonIndex >= 0) {
      console.log(`✅ Sendボタン発見: ${allButtons[sendButtonIndex].text}`);
      
      // Click the correct Send button using nth-child selector
      console.log('🖱️ 正しいSendボタンクリック...');
      await page.click(`button:nth-of-type(${sendButtonIndex + 1})`);
      
      // Wait to see if handler is called
      await page.waitForTimeout(3000);
      
    } else {
      console.log('❌ Sendボタンが見つかりません');
    }
    
    await page.screenshot({ path: 'fixed-send-button-test.png' });
    console.log('📸 修正テスト結果: fixed-send-button-test.png');
    
  } catch (error) {
    console.log('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
  }
}

fixedSendTest().catch(console.error);
