const { chromium } = require('playwright-core');

async function testChatViewFix() {
  console.log('🔧 ChatView修正後テスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor errors specifically
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
    
    if (msg.text().includes('Loaded') || 
        msg.text().includes('Loading history') ||
        msg.text().includes('messages')) {
      console.log(`🔍 ${msg.text()}`);
    }
  });
  
  try {
    console.log('📡 SubChatアクセス...');
    await page.goto('http://localhost:3000');
    
    console.log('⏰ セッション読み込み待機...');
    await page.waitForTimeout(8000);
    
    console.log('🖱️ セッション選択...');
    await page.click('div[style*="cursor: pointer"][style*="padding: 8px"]:first-child');
    
    console.log('⏰ 履歴読み込み待機...');
    await page.waitForTimeout(15000);
    
    const result = await page.evaluate(() => {
      return {
        hasSelectedSession: !document.body.textContent.includes('Select a session'),
        sessionHeader: document.querySelector('h3')?.textContent || 'No header',
        messageCount: document.querySelectorAll('div[style*="borderLeft"]').length,
        rightPanelText: document.querySelector('div[style*="flex: 1"]')?.textContent?.substring(0, 200) || 'No content',
        hasErrorBoundary: document.body.textContent.includes('error boundary') || document.body.textContent.includes('Something went wrong'),
        hasMessages: document.body.textContent.includes('No messages') || document.body.textContent.includes('assistant •') || document.body.textContent.includes('user •')
      };
    });
    
    console.log('\n📊 修正後の結果:');
    console.log(`  セッション選択: ${result.hasSelectedSession ? 'YES' : 'NO'}`);
    console.log(`  セッションヘッダ: ${result.sessionHeader}`);
    console.log(`  メッセージ数: ${result.messageCount}個`);
    console.log(`  エラー状態: ${result.hasErrorBoundary ? 'ERROR' : 'OK'}`);
    console.log(`  メッセージ表示: ${result.hasMessages ? 'YES' : 'NO'}`);
    
    // エラー数をチェック
    console.log(`\n🚨 JavaScriptエラー数: ${errors.length}個`);
    if (errors.length > 0 && errors.length < 5) {
      console.log('最初の数個のエラー:');
      errors.slice(0, 3).forEach((error, i) => {
        console.log(`  ${i + 1}: ${error.substring(0, 100)}...`);
      });
    }
    
    await page.screenshot({ path: 'chatview-fixed.png' });
    console.log('📸 修正後スクリーンショット: chatview-fixed.png');
    
  } catch (error) {
    console.log('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
  }
}

testChatViewFix().catch(console.error);
