const { chromium } = require('playwright-core');

async function testSendFinal() {
  console.log('🎯 Send機能最終テスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Monitor send-related logs
  const sendLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    sendLogs.push(text);
    
    if (text.includes('💬') || text.includes('📤') || text.includes('✅ Message sent') || 
        text.includes('❌ Failed to send') || text.includes('onChange') ||
        text.includes('Send button clicked') || text.includes('handleSendMessage')) {
      console.log(`🔍 ${text}`);
    }
  });
  
  try {
    console.log('📡 Subchatアプリアクセス...');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(12000);
    
    console.log('🖱️ エージェント1セッション選択...');
    
    // Select Agent 1 session using Playwright selectors
    await page.click('text=main1');
    console.log('✅ セッション選択完了');
    
    await page.waitForTimeout(8000);
    
    // Check current form state using safe JavaScript
    const formState = await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]');
      
      // Find send button by iterating through buttons
      let sendButton = null;
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent && button.textContent.includes('Send')) {
          sendButton = button;
          break;
        }
      }
      
      return {
        hasInput: !!input,
        hasSendButton: !!sendButton,
        inputValue: input?.value || '',
        inputDisabled: input?.disabled || false,
        sendButtonDisabled: sendButton?.disabled || false,
        sendButtonText: sendButton?.textContent || 'No send button',
        placeholder: input?.placeholder || ''
      };
    });
    
    console.log('📝 Send機能状態確認:');
    console.log(`  - 入力フィールド: ${formState.hasInput ? '✅' : '❌'}`);
    console.log(`  - Sendボタン: ${formState.hasSendButton ? '✅' : '❌'} ("${formState.sendButtonText}")`);
    console.log(`  - 入力有効: ${!formState.inputDisabled ? '✅' : '❌'}`);
    console.log(`  - ボタン有効: ${!formState.sendButtonDisabled ? '✅' : '❌'}`);
    console.log(`  - プレースホルダ: "${formState.placeholder}"`);
    
    if (formState.hasInput && !formState.inputDisabled) {
      console.log('💬 テストメッセージ入力開始...');
      
      const testMessage = `🎯 Final Send Test at ${new Date().toLocaleTimeString()}!`;
      
      // Focus input and type message
      await page.focus('input[type="text"]');
      await page.fill('input[type="text"]', testMessage);
      
      console.log(`📝 メッセージ入力完了: "${testMessage}"`);
      await page.waitForTimeout(2000);
      
      // Check button state after typing
      const buttonAfterInput = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent && button.textContent.includes('Send')) {
            return {
              disabled: button.disabled,
              text: button.textContent.trim()
            };
          }
        }
        return { disabled: true, text: 'Not found' };
      });
      
      console.log(`📊 入力後ボタン状態: ${buttonAfterInput.disabled ? '❌ 無効' : '✅ 有効'} ("${buttonAfterInput.text}")`);
      
      if (!buttonAfterInput.disabled) {
        console.log('🖱️ Sendボタンクリック実行...');
        
        // Use Playwright's text selector for clicking
        await page.click('text=Send');
        console.log('✅ Sendボタンクリック完了');
        
        console.log('⏰ 送信処理完了待機...');
        await page.waitForTimeout(15000);
        
        // Check final results
        const sendResult = await page.evaluate(() => {
          const input = document.querySelector('input[type="text"]');
          
          // Count messages and look for our test message
          const messageElements = document.querySelectorAll('[style*="border-left"]');
          let foundOurMessage = false;
          
          for (const element of messageElements) {
            if (element.textContent && element.textContent.includes('Final Send Test')) {
              foundOurMessage = true;
              break;
            }
          }
          
          return {
            inputCleared: (input?.value || '') === '',
            messageCount: messageElements.length,
            foundTestMessage: foundOurMessage,
            currentInputValue: input?.value || ''
          };
        });
        
        console.log('\n🎉 送信結果:');
        console.log(`  - 入力フィールドクリア: ${sendResult.inputCleared ? '✅' : '❌'} ("${sendResult.currentInputValue}")`);
        console.log(`  - 現在のメッセージ数: ${sendResult.messageCount}`);
        console.log(`  - テストメッセージ検出: ${sendResult.foundTestMessage ? '✅' : '❌'}`);
        
        const overallSuccess = sendResult.inputCleared && sendResult.foundTestMessage;
        console.log(`\n🏆 SEND機能最終判定: ${overallSuccess ? '🎉 完全成功！' : '⚠️ 部分的成功'}`);
        
      } else {
        console.log('❌ Sendボタンが無効のため送信できません');
      }
    } else {
      console.log('❌ 入力フィールドが使用できません');
    }
    
    await page.screenshot({ path: 'subchat-send-final-test.png' });
    console.log('\n📸 最終テスト結果スクリーンショット: subchat-send-final-test.png');
    
  } catch (error) {
    console.log('❌ テストエラー:', error.message);
    await page.screenshot({ path: 'subchat-send-error.png' });
  } finally {
    await browser.close();
    
    // Show relevant logs
    console.log('\n📝 Send関連ログ:');
    const relevantLogs = sendLogs.filter(log => 
      log.includes('💬') || log.includes('📤') || log.includes('Message sent') || 
      log.includes('sendMessage') || log.includes('onChange')
    ).slice(-8);
    
    if (relevantLogs.length > 0) {
      relevantLogs.forEach((log, i) => {
        console.log(`  ${i + 1}: ${log}`);
      });
    } else {
      console.log('  (関連ログが見つかりませんでした)');
    }
  }
}

testSendFinal().catch(console.error);
