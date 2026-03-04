const { chromium } = require('playwright-core');

async function debugUILogs() {
  console.log('🔍 UI詳細ログデバッグ...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Console logs collection
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    
    // Real-time important logs
    if (text.includes('sessions response') || 
        text.includes('Loaded') || 
        text.includes('Converting') ||
        text.includes('listSessions') ||
        text.includes('ERROR') ||
        text.includes('Failed')) {
      console.log(`🔍 IMPORTANT: ${text}`);
    }
  });
  
  try {
    console.log('📡 SubChatアクセス...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Wait longer for all processing
    console.log('⏰ 15秒待機でフル処理完了を確認...');
    await page.waitForTimeout(15000);
    
    // Check final state
    const finalState = await page.evaluate(() => {
      return {
        sessionCount: document.querySelectorAll('[class*="session"]').length,
        pageText: document.body.textContent,
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent),
        hasSessionList: !!document.querySelector('.session-list, [class*="session-list"]')
      };
    });
    
    console.log('🏁 最終状態:', finalState);
    
    // Try manual refresh  
    console.log('🔄 手動リフレッシュ実行...');
    await page.click('button:has-text("Reload")');
    await page.waitForTimeout(10000);
    
    const afterRefresh = await page.evaluate(() => {
      return {
        sessionCount: document.querySelectorAll('[class*="session"]').length,
        pageText: document.body.textContent.substring(0, 200)
      };
    });
    
    console.log('🔄 リフレッシュ後:', afterRefresh);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await browser.close();
    
    // Filter and display relevant logs
    console.log('\n📝 重要なコンソールログ:');
    const importantLogs = consoleLogs.filter(log => 
      log.includes('sessions') || 
      log.includes('Loaded') || 
      log.includes('Converting') ||
      log.includes('listSessions') ||
      log.includes('ERROR') ||
      log.includes('Failed') ||
      log.includes('Raw') ||
      log.includes('Successfully')
    );
    
    importantLogs.forEach((log, i) => {
      console.log(`  ${i + 1}: ${log}`);
    });
    
    if (importantLogs.length === 0) {
      console.log('⚠️ 重要なログが見つかりませんでした。全ログを確認:');
      consoleLogs.slice(-20).forEach((log, i) => {
        console.log(`  ${i + 1}: ${log}`);
      });
    }
  }
}

debugUILogs().catch(console.error);
