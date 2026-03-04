const { chromium } = require('playwright-core');

async function testNewSessionObservation() {
  console.log('🔍 Subchatアプリ - 新しいセッション観測テスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  const sessionUpdates = [];
  page.on('console', msg => {
    const text = msg.text();
    
    if (text.includes('sessions') || 
        text.includes('agent') ||
        text.includes('Session') ||
        text.includes('State update')) {
      sessionUpdates.push(text);
      console.log(`🔍 ${text}`);
    }
  });
  
  try {
    console.log('📡 Subchatアプリアクセス...');
    await page.goto('http://localhost:3000');
    
    console.log('⏰ 初期セッション読み込み待機...');
    await page.waitForTimeout(8000);
    
    // 現在のセッション一覧を確認
    const initialSessions = await page.evaluate(() => {
      const sessionElements = document.querySelectorAll('div[style*="cursor: pointer"][style*="padding: 8px"]');
      return Array.from(sessionElements).map(el => el.textContent.trim());
    });
    
    console.log('\n📋 初期セッション一覧:');
    initialSessions.forEach((session, i) => {
      console.log(`  ${i + 1}. ${session}`);
    });
    
    // エージェント1のセッションを探す
    const agent1Sessions = initialSessions.filter(session => 
      session.includes('agent:1') || session.toLowerCase().includes('agent 1') || session.includes('test-agent-1')
    );
    
    console.log('\n🔍 エージェント1関連セッション:');
    if (agent1Sessions.length > 0) {
      agent1Sessions.forEach((session, i) => {
        console.log(`  ✅ ${i + 1}. ${session}`);
      });
    } else {
      console.log('  ❌ エージェント1のセッションが見つかりません');
    }
    
    // リフレッシュして再確認
    console.log('\n🔄 リフレッシュボタンクリック...');
    await page.click('button:has-text("Reload")');
    await page.waitForTimeout(10000);
    
    // 更新後のセッション一覧を確認
    const refreshedSessions = await page.evaluate(() => {
      const sessionElements = document.querySelectorAll('div[style*="cursor: pointer"][style*="padding: 8px"]');
      return Array.from(sessionElements).map(el => el.textContent.trim());
    });
    
    console.log('\n📋 リフレッシュ後セッション一覧:');
    refreshedSessions.forEach((session, i) => {
      console.log(`  ${i + 1}. ${session}`);
    });
    
    // 新しいセッションを探す
    const newSessions = refreshedSessions.filter(session => 
      !initialSessions.includes(session)
    );
    
    if (newSessions.length > 0) {
      console.log('\n🎉 新しいセッション発見:');
      newSessions.forEach((session, i) => {
        console.log(`  ✅ ${i + 1}. ${session}`);
      });
    } else {
      console.log('\n⚠️ 新しいセッションは検出されませんでした');
    }
    
    // エージェント1のセッションがあれば選択してみる
    const agent1SessionIndex = refreshedSessions.findIndex(session => 
      session.includes('1') || session.toLowerCase().includes('agent')
    );
    
    if (agent1SessionIndex >= 0) {
      console.log(`\n🖱️ エージェント関連セッションを選択: ${refreshedSessions[agent1SessionIndex]}`);
      await page.click(`div[style*="cursor: pointer"][style*="padding: 8px"]:nth-child(${agent1SessionIndex + 1})`);
      await page.waitForTimeout(10000);
      
      // メッセージ内容を確認
      const messageContent = await page.evaluate(() => {
        const rightPanel = document.querySelector('div[style*="flex: 1"]');
        return rightPanel?.textContent?.substring(0, 500) || 'No content';
      });
      
      console.log('\n💬 メッセージ内容プレビュー:');
      console.log(`"${messageContent}"`);
      
      // tealやagent 1に関する内容があるかチェック
      const hasTestContent = messageContent.toLowerCase().includes('teal') || 
                            messageContent.toLowerCase().includes('agent 1') ||
                            messageContent.toLowerCase().includes('test');
      
      console.log(`\n🎯 テスト会話内容検出: ${hasTestContent ? '✅ YES' : '❌ NO'}`);
    }
    
    await page.screenshot({ path: 'subchat-agent1-observation.png' });
    console.log('\n📸 観測結果スクリーンショット: subchat-agent1-observation.png');
    
  } catch (error) {
    console.log('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
  }
}

testNewSessionObservation().catch(console.error);
