const { chromium } = require('playwright-core');

async function testChatViewDebug() {
  console.log('🔍 ChatView デバッグテスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor ChatView specific logs
  const chatViewLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    
    if (text.includes('ChatView')) {
      chatViewLogs.push(text);
      console.log(`🔍 ${text}`);
    }
    
    if (text.includes('State update') || text.includes('Loaded')) {
      console.log(`📊 ${text}`);
    }
  });
  
  try {
    console.log('📡 SubChat アクセス...');
    await page.goto('http://localhost:3000');
    
    console.log('⏰ 初期読み込み待機...');
    await page.waitForTimeout(8000);
    
    console.log('🖱️ セッション選択...');
    await page.click('div[style*="cursor: pointer"][style*="padding: 8px"]:first-child');
    
    console.log('⏰ ChatView更新待機...');
    await page.waitForTimeout(15000);
    
    // ChatView state を直接確認
    const chatViewState = await page.evaluate(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          const rightPanel = document.querySelector('div[style*="flex: 1"]');
          const sessionHeader = rightPanel?.querySelector('h3');
          const messageElements = rightPanel?.querySelectorAll('div[style*="borderLeft"]');
          
          resolve({
            rightPanelExists: !!rightPanel,
            sessionHeaderText: sessionHeader?.textContent || null,
            messageElementCount: messageElements?.length || 0,
            rightPanelHTML: rightPanel?.innerHTML?.substring(0, 500) + '...' || null,
            placeholderVisible: rightPanel?.textContent?.includes('Select a session') || false,
            noMessagesVisible: rightPanel?.textContent?.includes('No messages in this session') || false
          });
        }, 1000);
      });
    });
    
    console.log('\n🔍 ChatView DOM状態:');
    console.log(`  右パネル存在: ${chatViewState.rightPanelExists}`);
    console.log(`  セッションヘッダ: "${chatViewState.sessionHeaderText}"`);
    console.log(`  メッセージ要素数: ${chatViewState.messageElementCount}`);
    console.log(`  プレースホルダ表示: ${chatViewState.placeholderVisible}`);
    console.log(`  "No messages"表示: ${chatViewState.noMessagesVisible}`);
    
    await page.screenshot({ path: 'chatview-debug.png' });
    console.log('📸 デバッグスクリーンショット: chatview-debug.png');
    
  } catch (error) {
    console.log('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
    
    console.log('\n📝 ChatViewログ:');
    if (chatViewLogs.length > 0) {
      chatViewLogs.forEach((log, i) => {
        console.log(`  ${i + 1}: ${log}`);
      });
    } else {
      console.log('  (ChatViewログなし)');
    }
  }
}

testChatViewDebug().catch(console.error);
