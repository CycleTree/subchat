const { chromium } = require('playwright-core');

async function testTimeoutFix() {
  console.log('🔧 タイムアウト修正テスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor important logs
  const importantLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    
    if (text.includes('sessions response') || 
        text.includes('Loaded') || 
        text.includes('Raw') ||
        text.includes('Successfully') ||
        text.includes('timeout') ||
        text.includes('listSessions') ||
        text.includes('Converting')) {
      importantLogs.push(`[${msg.type()}] ${text}`);
      console.log(`🔍 ${text}`);
    }
  });
  
  try {
    console.log('📡 SubChatアクセス (30秒タイムアウト対応版)...');
    await page.goto('http://localhost:3000');
    
    console.log('⏰ 35秒待機 (30秒タイムアウト + マージン)...');
    await page.waitForTimeout(35000);
    
    const result = await page.evaluate(() => {
      return {
        sessionCount: document.querySelectorAll('[class*="session"]').length,
        pageText: document.body.textContent.includes('sessions loaded') ? 
          document.body.textContent.match(/(\d+) sessions loaded/)?.[1] : '0',
        connectionStatus: document.body.textContent.includes('Connected'),
        hasErrors: document.body.textContent.includes('Error') || document.body.textContent.includes('error')
      };
    });
    
    console.log('\n🏁 結果:');
    console.log(`  Sessions検出: ${result.sessionCount}個`);
    console.log(`  Page表示: ${result.pageText} sessions`);
    console.log(`  接続状態: ${result.connectionStatus ? '接続済み' : '未接続'}`);
    console.log(`  エラー有無: ${result.hasErrors ? 'エラーあり' : 'エラーなし'}`);
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  } finally {
    await browser.close();
    
    console.log('\n📝 重要ログ一覧:');
    if (importantLogs.length > 0) {
      importantLogs.forEach((log, i) => {
        console.log(`  ${i + 1}: ${log}`);
      });
    } else {
      console.log('  (重要ログなし)');
    }
  }
}

testTimeoutFix().catch(console.error);
