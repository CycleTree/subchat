const { chromium } = require('playwright-core');

async function testFinalFixVerbose() {
  console.log('🎯 最終修正 詳細テスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor all logs
  const allLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    allLogs.push(`[${msg.type()}] ${text}`);
    
    if (text.includes('ChatView') || 
        text.includes('Error') || 
        text.includes('rendering') ||
        text.includes('messages')) {
      console.log(`🔍 ${text}`);
    }
  });
  
  try {
    console.log('📡 SubChatアクセス...');
    await page.goto('http://localhost:3000');
    
    console.log('⏰ 初期読み込み...');
    await page.waitForTimeout(8000);
    
    console.log('🖱️ セッション選択...');
    await page.click('div[style*="cursor: pointer"][style*="padding: 8px"]:first-child');
    
    console.log('⏰ 詳細レンダリング待機...');
    await page.waitForTimeout(20000);
    
    const finalState = await page.evaluate(() => {
      const rightPanel = document.querySelector('div[style*="flex: 1"]');
      const sessionHeader = rightPanel?.querySelector('h3');
      const messageElements = rightPanel?.querySelectorAll('div[style*="borderLeft"]');
      const errorElements = rightPanel?.querySelectorAll('div[style*="color: red"]');
      
      return {
        rightPanelExists: !!rightPanel,
        sessionHeaderText: sessionHeader?.textContent || 'No header',
        messageElements: messageElements?.length || 0,
        errorElements: errorElements?.length || 0,
        hasSelectPlaceholder: rightPanel?.textContent?.includes('Select a session') || false,
        hasNoMessages: rightPanel?.textContent?.includes('No messages in this session') || false,
        hasErrorText: rightPanel?.textContent?.includes('Error') || false,
        rightPanelTextPreview: rightPanel?.textContent?.substring(0, 300) || 'No content'
      };
    });
    
    console.log('\n🎯 最終修正結果:');
    console.log(`📋 セッションヘッダ: "${finalState.sessionHeaderText}"`);
    console.log(`💬 メッセージ要素: ${finalState.messageElements}個`);
    console.log(`🚨 エラー要素: ${finalState.errorElements}個`);
    console.log(`📄 表示内容:`);
    console.log(`  - "Select a session": ${finalState.hasSelectPlaceholder}`);
    console.log(`  - "No messages": ${finalState.hasNoMessages}`);
    console.log(`  - エラーテキスト: ${finalState.hasErrorText}`);
    
    // Success判定
    const success = finalState.messageElements > 0 || finalState.hasNoMessages;
    console.log(`\n🏆 結果: ${success ? '🎉 SUCCESS!' : '❌ FAILED'}`);
    
    if (!success) {
      console.log('\n📝 右パネル内容プレビュー:');
      console.log(`"${finalState.rightPanelTextPreview}"`);
    }
    
    await page.screenshot({ path: 'subchat-final-verbose.png' });
    console.log('📸 最終テストスクリーンショット: subchat-final-verbose.png');
    
  } catch (error) {
    console.log('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
    
    // Error logs only
    const errorLogs = allLogs.filter(log => 
      log.includes('[error]') || 
      log.toLowerCase().includes('error') ||
      log.includes('Error')
    );
    
    if (errorLogs.length > 0) {
      console.log('\n🚨 エラーログ:');
      errorLogs.slice(-10).forEach((log, i) => {
        console.log(`  ${i + 1}: ${log}`);
      });
    } else {
      console.log('\n✅ エラーログなし');
    }
  }
}

testFinalFixVerbose().catch(console.error);
