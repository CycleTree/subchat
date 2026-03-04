const { chromium } = require('playwright-core');

async function simpleRefactoredTest() {
  console.log('🔍 シンプル版リファクタテスト...');
  
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: '/run/current-system/sw/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    console.log('📡 リファクタ版アクセス...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(5000);
    
    // Basic UI check
    const basicCheck = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body.textContent?.substring(0, 100) || '',
        hasReactRoot: !!document.querySelector('#root'),
        errorMessages: document.querySelectorAll('[class*="error"]').length
      };
    });
    
    console.log('📋 基本チェック:');
    console.log(`  - タイトル: ${basicCheck.title}`);
    console.log(`  - React Root: ${basicCheck.hasReactRoot ? '✅' : '❌'}`);
    console.log(`  - エラー: ${basicCheck.errorMessages}個`);
    console.log(`  - 内容: "${basicCheck.bodyText.trim()}"`);
    
    await page.screenshot({ path: 'simple-refactored-test.png' });
    console.log('📸 スクリーンショット: simple-refactored-test.png');
    
    console.log('✅ 基本テスト完了');
    
  } catch (error) {
    console.log('❌ エラー:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

simpleRefactoredTest().catch(console.error);
