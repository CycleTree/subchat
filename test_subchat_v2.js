const { chromium } = require('playwright-core');

async function testSubChatV2() {
  console.log('🧪 SubChat v2 動作テスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // コンソールエラー監視
  const errors = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log(`📝 ${msg.type()}: ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });
  
  try {
    console.log('📡 SubChat v2アクセス...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(8000);
    
    // UI要素確認
    const uiCheck = await page.evaluate(() => {
      return {
        hasMuiComponents: !!document.querySelector('.MuiBox-root'),
        hasSessionList: !!document.querySelector('h6'),
        hasConnectionStatus: document.body.innerText.includes('Connecting') || document.body.innerText.includes('Connected'),
        mainText: document.body.innerText.substring(0, 200),
        componentCount: document.querySelectorAll('*[class*="Mui"]').length
      };
    });
    
    console.log('\n🎨 SubChat v2 UI確認:');
    console.log(`  Material-UI Components: ${uiCheck.hasMuiComponents ? '✅' : '❌'}`);
    console.log(`  Session List Header: ${uiCheck.hasSessionList ? '✅' : '❌'}`);
    console.log(`  Connection Status: ${uiCheck.hasConnectionStatus ? '✅' : '❌'}`);
    console.log(`  MUI Component数: ${uiCheck.componentCount}`);
    console.log(`  主要テキスト: "${uiCheck.mainText.replace(/\s+/g, ' ').trim()}"`);
    
    await page.screenshot({ path: 'subchat-v2-test.png', fullPage: true });
    console.log('\n📸 SubChat v2スクリーンショット: subchat-v2-test.png');
    
    console.log(`\n🔍 エラー数: ${errors.length}`);
    if (errors.length > 0) {
      console.log('❌ エラー詳細:');
      errors.slice(0, 3).forEach((error, i) => {
        console.log(`  ${i + 1}: ${error}`);
      });
    }
    
    // 成功判定
    const isSuccess = uiCheck.hasMuiComponents && uiCheck.hasSessionList && errors.length < 5;
    console.log(`\n🎯 SubChat v2評価: ${isSuccess ? '✅ 成功' : '⚠️  要調整'}`);
    
  } catch (error) {
    console.log(`❌ テストエラー: ${error.message}`);
  } finally {
    await browser.close();
  }
}

testSubChatV2().catch(console.error);
