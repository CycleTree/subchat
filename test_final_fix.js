const { chromium } = require('playwright-core');

async function testFinalFix() {
  console.log('🎯 最終修正テスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor state updates
  const stateUpdates = [];
  page.on('console', msg => {
    const text = msg.text();
    
    if (text.includes('State update from SessionManager') ||
        text.includes('Selecting session') ||
        text.includes('Loaded') ||
        text.includes('messages')) {
      stateUpdates.push(text);
      console.log(`🔍 ${text}`);
    }
  });
  
  try {
    console.log('📡 SubChatアクセス...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    
    console.log('⏰ セッション読み込み完了待機...');
    await page.waitForTimeout(10000);
    
    console.log('🖱️ セッション選択実行...');
    await page.click('div[style*="cursor: pointer"][style*="padding: 8px"]:first-child');
    
    console.log('⏰ State更新とメッセージ表示を待機...');
    await page.waitForTimeout(20000);
    
    const finalResult = await page.evaluate(() => {
      return {
        // セッション選択状態
        isSessionSelected: !document.body.textContent.includes('Select a session'),
        sessionHeaderText: document.querySelector('h3')?.textContent || 'No header found',
        
        // メッセージ表示状態
        messageElements: document.querySelectorAll('div[style*="borderLeft"]').length,
        hasMessageContent: document.body.textContent.includes('assistant •') || document.body.textContent.includes('user •'),
        noMessagesText: document.body.textContent.includes('No messages in this session'),
        
        // エラー状態
        hasJSErrors: document.body.textContent.includes('error boundary'),
        
        // 全体の状態
        rightPanelContent: document.querySelector('div[style*="flex: 1"]')?.textContent?.substring(0, 300) || 'Not found'
      };
    });
    
    console.log('\n🎯 最終テスト結果:');
    console.log(`✅ セッション選択: ${finalResult.isSessionSelected ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📋 セッションヘッダ: "${finalResult.sessionHeaderText}"`);
    console.log(`💬 メッセージ要素: ${finalResult.messageElements}個`);
    console.log(`📝 メッセージ内容: ${finalResult.hasMessageContent ? 'YES' : 'NO'}`);
    console.log(`❌ エラー状態: ${finalResult.hasJSErrors ? 'ERROR' : 'OK'}`);
    
    if (finalResult.noMessagesText) {
      console.log('📄 表示状態: "No messages in this session"');
    } else if (finalResult.hasMessageContent) {
      console.log('📄 表示状態: メッセージ表示成功');
    } else {
      console.log('📄 表示状態: 不明');
    }
    
    // Success判定
    const isFullSuccess = finalResult.isSessionSelected && 
                         (finalResult.hasMessageContent || finalResult.noMessagesText) && 
                         !finalResult.hasJSErrors;
    
    console.log(`\n🏆 総合結果: ${isFullSuccess ? '🎉 FULL SUCCESS!' : '⚠️ PARTIAL SUCCESS'}`);
    
    await page.screenshot({ path: 'subchat-final-result.png' });
    console.log('📸 最終結果スクリーンショット: subchat-final-result.png');
    
  } catch (error) {
    console.log('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
    
    console.log('\n📝 State更新ログ:');
    if (stateUpdates.length > 0) {
      stateUpdates.forEach((update, i) => {
        console.log(`  ${i + 1}: ${update}`);
      });
    } else {
      console.log('  (State更新ログなし)');
    }
  }
}

testFinalFix().catch(console.error);
