const { chromium } = require('playwright-core');

async function finalScreenshot() {
  console.log('📸 リファクタ版最終確認...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  
  try {
    const page = await browser.newPage();
    console.log('📡 アクセス中...');
    
    await page.goto('http://localhost:3000');
    console.log('⏰ 読み込み待機...');
    await page.waitForTimeout(3000);
    
    console.log('📸 スクリーンショット撮影...');
    await page.screenshot({ 
      path: 'refactored-subchat-screenshot.png', 
      fullPage: true 
    });
    
    console.log('✅ 完了: refactored-subchat-screenshot.png');
    
  } catch (error) {
    console.log('❌ エラー:', error.toString());
  } finally {
    await browser.close();
  }
}

finalScreenshot();
