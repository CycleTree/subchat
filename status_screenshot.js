const { chromium } = require('playwright-core');

async function statusScreenshot() {
  console.log('📸 SubChatアプリ現状確認...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(8000);
    
    await page.screenshot({ path: 'subchat-final-status.png', fullPage: true });
    console.log('✅ 現状スクリーンショット: subchat-final-status.png');
    
    // Try to click main1 and take another screenshot
    try {
      await page.click('text=main1');
      await page.waitForTimeout(5000);
      
      await page.screenshot({ path: 'subchat-with-agent1.png', fullPage: true });
      console.log('✅ Agent1セッション: subchat-with-agent1.png');
    } catch (e) {
      console.log('Agent1 session click failed, but main screenshot taken');
    }
    
  } catch (error) {
    console.log('❌ エラー:', error.message);
  } finally {
    await browser.close();
  }
}

statusScreenshot().catch(console.error);
