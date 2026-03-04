const { chromium } = require('playwright-core');

async function testSessionClick() {
  console.log('🖱️ セッションクリック動作テスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor all console logs and errors
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    
    if (msg.type() === 'error' || text.includes('error') || text.includes('Error')) {
      console.log(`❌ ERROR: ${text}`);
    }
    
    if (text.includes('Selecting session') || 
        text.includes('Loading history') ||
        text.includes('chat.history') ||
        text.includes('Failed') ||
        text.includes('timeout')) {
      console.log(`🔍 IMPORTANT: ${text}`);
    }
  });
  
  // Monitor network errors
  page.on('requestfailed', request => {
    console.log(`🌐 REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  try {
    console.log('📡 SubChatにアクセス...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    console.log('⏰ セッション読み込み完了まで待機...');
    await page.waitForTimeout(10000);
    
    // セッション一覧が表示されているか確認
    const sessionCount = await page.evaluate(() => {
      const sessions = document.querySelectorAll('div[style*="cursor: pointer"][style*="padding: 8px"]');
      return sessions.length;
    });
    
    console.log(`📋 セッション数: ${sessionCount}個`);
    
    if (sessionCount === 0) {
      console.log('❌ セッションが表示されていません');
      await page.screenshot({ path: 'no-sessions-error.png' });
    } else {
      console.log('✅ セッション表示確認済み');
      
      // 最初のセッションをクリック
      console.log('🖱️ 最初のセッションをクリック...');
      
      await page.click('div[style*="cursor: pointer"][style*="padding: 8px"]:first-child');
      console.log('✅ セッションクリック実行');
      
      // クリック後の処理を十分待つ
      console.log('⏰ 履歴読み込み待機...');
      await page.waitForTimeout(15000);
      
      // エラー状況を確認
      const postClickState = await page.evaluate(() => {
        return {
          selectedSession: document.body.textContent.includes('Select a session') ? 'none' : 'selected',
          hasMessages: document.querySelectorAll('[class*="message"]').length > 0,
          rightPanelContent: document.querySelector('div[style*="flex: 1"]')?.textContent || 'not found',
          hasErrorText: document.body.textContent.toLowerCase().includes('error'),
          sessionButtons: document.querySelectorAll('div[style*="cursor: pointer"][style*="padding: 8px"]').length
        };
      });
      
      console.log('📊 クリック後の状態:', postClickState);
      
      // スクリーンショット保存
      await page.screenshot({ path: 'session-click-result.png' });
      console.log('📸 結果スクリーンショット: session-click-result.png');
    }
    
  } catch (error) {
    console.log('❌ テストエラー:', error.message);
    await page.screenshot({ path: 'click-test-error.png' });
  } finally {
    await browser.close();
    
    // エラーログを抽出
    console.log('\n🚨 エラーログ:');
    const errorLogs = consoleLogs.filter(log => 
      log.includes('[error]') || 
      log.toLowerCase().includes('error') ||
      log.includes('Failed') ||
      log.includes('timeout') ||
      log.includes('❌')
    );
    
    if (errorLogs.length > 0) {
      errorLogs.forEach((log, i) => {
        console.log(`  ${i + 1}: ${log}`);
      });
    } else {
      console.log('  (エラーログなし)');
    }
    
    // 重要なログも表示
    console.log('\n📝 セッション操作ログ:');
    const sessionLogs = consoleLogs.filter(log =>
      log.includes('Selecting') ||
      log.includes('Loading') ||
      log.includes('chat.history') ||
      log.includes('selectSession') ||
      log.includes('getSessionHistory')
    );
    
    sessionLogs.forEach((log, i) => {
      console.log(`  ${i + 1}: ${log}`);
    });
  }
}

testSessionClick().catch(console.error);
