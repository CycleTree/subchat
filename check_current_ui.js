const { chromium } = require('playwright-core');

async function checkCurrentUI() {
  console.log('🔍 現在のUI状況確認...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // すべてのコンソールログとエラーをキャッチ
  page.on('console', msg => {
    console.log(`📝 CONSOLE ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`❌ PAGE ERROR: ${error.message}`);
  });
  
  try {
    console.log('📡 http://localhost:3000 にアクセス...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // 基本的な要素チェック
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        rootExists: !!document.getElementById('root'),
        rootContent: document.getElementById('root')?.innerHTML?.substring(0, 200) || 'No content',
        bodyClasses: document.body.className,
        hasErrors: document.querySelectorAll('.error, [class*="error"]').length,
        scripts: Array.from(document.scripts).length,
        stylesheets: Array.from(document.styleSheets).length,
        reactComponents: document.querySelectorAll('[data-react-root]').length
      };
    });
    
    console.log('\n📊 ページ情報:');
    console.log(`  Title: ${pageInfo.title}`);
    console.log(`  Root要素: ${pageInfo.rootExists ? '✅' : '❌'}`);
    console.log(`  Root内容: "${pageInfo.rootContent}"`);
    console.log(`  エラー要素: ${pageInfo.hasErrors}個`);
    console.log(`  Scripts: ${pageInfo.scripts}個`);
    console.log(`  Stylesheets: ${pageInfo.stylesheets}個`);
    
    // OSSライブラリ関連の要素をチェック
    const ossCheck = await page.evaluate(() => {
      return {
        hasChatscope: document.querySelectorAll('[class*="cs-"]').length,
        hasMainContainer: document.querySelectorAll('[class*="main-container"]').length,
        hasChatContainer: document.querySelectorAll('[class*="chat-container"]').length,
        hasMessageList: document.querySelectorAll('[class*="message-list"]').length,
        allClassNames: Array.from(document.querySelectorAll('*')).map(el => el.className).filter(c => c).slice(0, 10)
      };
    });
    
    console.log('\n🎨 OSS UI確認:');
    console.log(`  Chatscope要素: ${ossCheck.hasChatscope}個`);
    console.log(`  MainContainer: ${ossCheck.hasMainContainer}個`);
    console.log(`  ChatContainer: ${ossCheck.hasChatContainer}個`);
    console.log(`  MessageList: ${ossCheck.hasMessageList}個`);
    console.log(`  クラス例: ${ossCheck.allClassNames.slice(0, 3).join(', ')}`);
    
    await page.screenshot({ path: 'current-ui-debug.png', fullPage: true });
    console.log('\n📸 デバッグスクリーンショット: current-ui-debug.png');
    
    // 少し待ってから再度チェック（React読み込み待ち）
    console.log('\n⏰ React読み込み待機...');
    await page.waitForTimeout(5000);
    
    const afterWaitInfo = await page.evaluate(() => {
      return {
        rootContent: document.getElementById('root')?.innerHTML?.substring(0, 300) || 'Still no content',
        totalElements: document.querySelectorAll('*').length
      };
    });
    
    console.log(`📊 5秒後状況:`);
    console.log(`  Root内容: "${afterWaitInfo.rootContent}"`);
    console.log(`  総要素数: ${afterWaitInfo.totalElements}`);
    
  } catch (error) {
    console.log(`❌ エラー: ${error.message}`);
  } finally {
    await browser.close();
  }
}

checkCurrentUI().catch(console.error);
