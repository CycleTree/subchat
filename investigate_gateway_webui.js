const { chromium } = require('playwright-core');

async function investigateGatewayAuth() {
  console.log('🔍 OpenClaw Gateway WebUI認証調査...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: false,  // 認証フローを見るため
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // WebSocket 通信をキャプチャ
  const wsMessages = [];
  page.on('response', response => {
    if (response.url().includes('gateway')) {
      console.log(`📡 Response: ${response.url()}`);
    }
  });
  
  // WebSocket フレームをキャプチャ（可能な場合）
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('client') || text.includes('auth') || text.includes('connect')) {
      console.log(`🔗 Console: ${text}`);
    }
  });
  
  try {
    console.log('📡 OpenClaw Gateway WebUI アクセス...');
    await page.goto('http://localhost:18792/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    // Gateway WebUI の構造確認
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        hasWebSocket: !!window.WebSocket,
        bodyText: document.body.innerText.substring(0, 500),
        scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline').slice(0, 5)
      };
    });
    
    console.log('\n🌐 Gateway WebUI 情報:');
    console.log(`  タイトル: "${pageInfo.title}"`);
    console.log(`  WebSocket対応: ${pageInfo.hasWebSocket}`);
    console.log(`  本文: "${pageInfo.bodyText.replace(/\s+/g, ' ')}"`);
    console.log(`  スクリプト: ${pageInfo.scripts.join(', ')}`);
    
    await page.screenshot({ path: 'gateway-webui-investigation.png' });
    console.log('\n📸 調査結果: gateway-webui-investigation.png');
    
    // Developer Tools で Network タブの指示
    console.log('\n🔧 次のステップ:');
    console.log('1. ブラウザでGateway WebUIにアクセス');
    console.log('2. F12でDeveloper Tools開く'); 
    console.log('3. NetworkタブでWebSocket通信確認');
    console.log('4. 認証リクエストのclient.idパラメータを確認');
    
  } catch (error) {
    console.log(`❌ 調査エラー: ${error.message}`);
  } finally {
    await browser.close();
  }
}

investigateGatewayAuth().catch(console.error);
