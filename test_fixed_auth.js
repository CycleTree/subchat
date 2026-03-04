const { chromium } = require('playwright-core');

async function testFixedAuth() {
  console.log('🔧 認証修正版テスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // コンソール監視（認証関連）
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`${msg.type()}: ${text}`);
    if (text.includes('Auth') || text.includes('Connect') || text.includes('Session')) {
      console.log(`📝 ${msg.type()}: ${text}`);
    }
  });
  
  try {
    console.log('📡 修正版SubChat接続テスト...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(10000); // 認証に時間がかかる場合
    
    // 認証・接続状況確認
    const connectionStatus = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        hasConnectionFailed: bodyText.includes('Connection Failed'),
        hasAuthError: bodyText.includes('Auth failed'),
        hasConnecting: bodyText.includes('Connecting'),
        hasConnected: bodyText.includes('Connected'),
        hasSessionList: bodyText.includes('sessions'),
        mainContent: bodyText.substring(0, 300).replace(/\s+/g, ' ').trim()
      };
    });
    
    console.log('\n🔗 接続状況確認:');
    console.log(`  接続失敗: ${connectionStatus.hasConnectionFailed ? '❌' : '✅'}`);
    console.log(`  認証エラー: ${connectionStatus.hasAuthError ? '❌' : '✅'}`);
    console.log(`  接続中: ${connectionStatus.hasConnecting ? '⏳' : '-'}`);
    console.log(`  接続済み: ${connectionStatus.hasConnected ? '✅' : '⏳'}`);
    console.log(`  セッション表示: ${connectionStatus.hasSessionList ? '✅' : '⏳'}`);
    console.log(`\n📄 主要内容: "${connectionStatus.mainContent}"`);
    
    // 認証成功の判定
    const authSuccess = !connectionStatus.hasConnectionFailed && !connectionStatus.hasAuthError;
    const isWorking = authSuccess && (connectionStatus.hasConnected || connectionStatus.hasSessionList);
    
    await page.screenshot({ path: 'subchat-v2-fixed-auth.png', fullPage: true });
    console.log('\n📸 修正版スクリーンショット: subchat-v2-fixed-auth.png');
    
    // 認証関連ログ確認
    const authLogs = logs.filter(log => 
      log.includes('Auth') || log.includes('Connect') || log.includes('Session')
    ).slice(-5);
    
    if (authLogs.length > 0) {
      console.log('\n🔐 認証ログ (最新5件):');
      authLogs.forEach((log, i) => {
        console.log(`  ${i + 1}: ${log}`);
      });
    }
    
    console.log(`\n🎯 修正結果: ${isWorking ? '✅ 接続成功！' : '⚠️  要調整'}`);
    
  } catch (error) {
    console.log(`❌ テストエラー: ${error.message}`);
  } finally {
    await browser.close();
  }
}

testFixedAuth().catch(console.error);
