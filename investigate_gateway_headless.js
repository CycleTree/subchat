const { chromium } = require('playwright-core');

async function investigateGatewayAuth() {
  console.log('🔍 OpenClaw Gateway WebUI認証調査（Headless）...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,  // X Server不要
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Console ログ監視
  const relevantLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    relevantLogs.push(`${msg.type()}: ${text}`);
    if (text.includes('client') || text.includes('auth') || text.includes('connect') || text.includes('WebSocket')) {
      console.log(`🔗 ${msg.type()}: ${text}`);
    }
  });
  
  try {
    console.log('📡 OpenClaw Gateway WebUI アクセス...');
    await page.goto('http://localhost:18792/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(8000); // WebSocket接続待機
    
    // Gateway WebUI の構造確認
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        hasWebSocket: !!window.WebSocket,
        bodyText: document.body.innerText.substring(0, 800),
        scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline'),
        wsConnections: window.WebSocket ? 'WebSocket available' : 'No WebSocket',
        // ページの JavaScript で認証情報を調査
        windowVars: Object.keys(window).filter(key => 
          key.toLowerCase().includes('auth') || 
          key.toLowerCase().includes('client') ||
          key.toLowerCase().includes('gateway')
        ).slice(0, 10)
      };
    });
    
    console.log('\n🌐 Gateway WebUI 情報:');
    console.log(`  タイトル: "${pageInfo.title}"`);
    console.log(`  WebSocket対応: ${pageInfo.hasWebSocket}`);
    console.log(`  本文: "${pageInfo.bodyText.replace(/\s+/g, ' ')}"`);
    console.log(`  スクリプト数: ${pageInfo.scripts.length}`);
    console.log(`  関連変数: ${pageInfo.windowVars.join(', ')}`);
    
    // ページソース確認
    const pageSource = await page.content();
    const hasAuthConfig = pageSource.includes('client') && pageSource.includes('auth');
    
    console.log(`\n🔍 認証設定存在: ${hasAuthConfig}`);
    
    if (hasAuthConfig) {
      // 認証関連の設定を抽出
      const authMatches = pageSource.match(/client.*?['"`][^'"`]+['"`]/gi) || [];
      console.log(`📋 認証関連文字列: ${authMatches.slice(0, 5).join(', ')}`);
    }
    
    await page.screenshot({ path: 'gateway-webui-investigation.png' });
    console.log('\n📸 調査結果: gateway-webui-investigation.png');
    
    // 取得したログを分析
    const authLogs = relevantLogs.filter(log => 
      log.includes('auth') || log.includes('client') || log.includes('connect')
    );
    
    if (authLogs.length > 0) {
      console.log('\n🔐 認証関連ログ:');
      authLogs.slice(0, 5).forEach((log, i) => {
        console.log(`  ${i + 1}: ${log}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ 調査エラー: ${error.message}`);
  } finally {
    await browser.close();
  }
}

investigateGatewayAuth().catch(console.error);
