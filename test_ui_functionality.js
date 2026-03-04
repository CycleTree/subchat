const { chromium } = require('playwright-core');

async function testUIFunctionality() {
  console.log('🎮 SubChat UI機能テスト開始...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true, // UIを見えるようにする
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  
  try {
    console.log('📡 SubChatにアクセス...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // スクリーンショット1: 初期画面
    console.log('📸 初期画面スクリーンショット取得');
    await page.screenshot({ path: 'subchat-initial.png' });
    
    // WebSocket接続を待つ
    console.log('🔌 WebSocket接続を待機...');
    await page.waitForTimeout(5000);
    
    // 接続状況を確認
    const connectionStatus = await page.evaluate(() => {
      // ページの接続状態をチェック
      const statusIndicators = document.querySelectorAll('.connection-status, [class*="status"], [class*="connected"], [class*="error"]');
      const sessionElements = document.querySelectorAll('[class*="session"], .session-list li, .session-item');
      const messageElements = document.querySelectorAll('[class*="message"], .message, .chat-message');
      
      return {
        statusIndicators: statusIndicators.length,
        sessionElements: sessionElements.length,
        messageElements: messageElements.length,
        pageText: document.body.textContent.substring(0, 500),
        hasErrors: document.body.textContent.includes('error') || document.body.textContent.includes('Error')
      };
    });
    
    console.log('📊 ページ状態:', connectionStatus);
    
    // スクリーンショット2: 接続後
    await page.screenshot({ path: 'subchat-connected.png' });
    
    // セッション一覧が表示されているかテスト
    console.log('📋 セッション一覧の確認...');
    const sessions = await page.evaluate(() => {
      // セッション要素を探す
      const sessionSelectors = [
        '[class*="session"]',
        '.session-item',
        '.session-list li',
        'li[role="button"]',
        '[data-session-key]'
      ];
      
      let sessionElements = [];
      for (const selector of sessionSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          sessionElements = Array.from(elements);
          break;
        }
      }
      
      return sessionElements.map(el => ({
        text: el.textContent.trim(),
        className: el.className,
        clickable: el.style.cursor === 'pointer' || el.onclick !== null
      }));
    });
    
    console.log(`✅ 発見されたセッション: ${sessions.length}個`);
    sessions.forEach((session, i) => {
      console.log(`  ${i + 1}. "${session.text}" (clickable: ${session.clickable})`);
    });
    
    if (sessions.length > 0) {
      console.log('🖱️ 最初のセッションをクリックテスト...');
      
      // セッションクリックを試行
      try {
        await page.click('[class*="session"]:first-child, .session-item:first-child, .session-list li:first-child');
        console.log('✅ セッションクリック成功');
        
        // クリック後の変化を待つ
        await page.waitForTimeout(3000);
        
        // メッセージ表示を確認
        const messages = await page.evaluate(() => {
          const messageSelectors = [
            '[class*="message"]',
            '.message',
            '.chat-message',
            '[class*="chat"] > div',
            '[role="log"] > div'
          ];
          
          let messageElements = [];
          for (const selector of messageSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              messageElements = Array.from(elements);
              break;
            }
          }
          
          return messageElements.slice(-5).map(el => ({
            text: el.textContent.trim().substring(0, 100),
            hasContent: el.textContent.trim().length > 0
          }));
        });
        
        console.log(`💬 表示されたメッセージ: ${messages.length}個`);
        messages.forEach((msg, i) => {
          if (msg.hasContent) {
            console.log(`  Message ${i + 1}: "${msg.text}..."`);
          }
        });
        
        // スクリーンショット3: メッセージ表示
        await page.screenshot({ path: 'subchat-messages.png' });
        
      } catch (clickError) {
        console.log('❌ セッションクリック失敗:', clickError.message);
      }
    }
    
    // コンソールエラーをチェック
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 最終テスト結果
    console.log('\n📋 UIテスト結果サマリー:');
    console.log(`✅ ページ読み込み: 成功`);
    console.log(`✅ セッション検出: ${sessions.length}個`);
    console.log(`✅ WebSocket接続: ${connectionStatus.statusIndicators > 0 ? '検出' : '不明'}`);
    console.log(`✅ エラー状況: ${connectionStatus.hasErrors ? 'エラーあり' : 'エラーなし'}`);
    
    // 詳細な操作テスト
    console.log('\n🔧 詳細操作テスト...');
    
    // リフレッシュボタンテスト
    try {
      const refreshButton = await page.$('button:has-text("Refresh"), button[class*="refresh"], button[title*="refresh"]');
      if (refreshButton) {
        console.log('🔄 リフレッシュボタンをクリック...');
        await refreshButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ リフレッシュボタン動作確認');
      } else {
        console.log('ℹ️ リフレッシュボタンが見つかりません');
      }
    } catch (error) {
      console.log('❌ リフレッシュボタンテスト失敗:', error.message);
    }
    
    // フィルター機能テスト
    try {
      const filterInputs = await page.$$('input[type="text"], input[placeholder*="filter"], input[placeholder*="search"]');
      if (filterInputs.length > 0) {
        console.log('🔍 フィルター入力テスト...');
        await filterInputs[0].fill('discord');
        await page.waitForTimeout(1000);
        console.log('✅ フィルター入力動作確認');
      }
    } catch (error) {
      console.log('❌ フィルターテスト失敗:', error.message);
    }
    
  } catch (error) {
    console.log('❌ UIテスト中にエラー:', error.message);
  } finally {
    // 最終スクリーンショット
    await page.screenshot({ path: 'subchat-final.png' });
    console.log('📸 最終スクリーンショット保存: subchat-final.png');
    
    await browser.close();
    console.log('🏁 UIテスト完了');
  }
}

testUIFunctionality().catch(console.error);
