const { chromium } = require('playwright-core');

async function finalDemo() {
  console.log('📸 Subchat Send機能デモンストレーション...');
  
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
    
    // Type a demo message
    const demoMessage = "✅ SubChat Send機能完全動作中！";
    await page.fill('input[type="text"]', demoMessage);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'subchat-send-demo-ready.png', fullPage: true });
    console.log('📸 Demo ready: subchat-send-demo-ready.png');
    
    // Send the message
    await page.click('text=Send');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'subchat-send-demo-sent.png', fullPage: true });
    console.log('📸 Demo sent: subchat-send-demo-sent.png');
    
  } catch (error) {
    console.log('Error:', error.message);
  } finally {
    await browser.close();
  }
}

finalDemo().catch(console.error);
