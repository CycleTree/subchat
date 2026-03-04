const { chromium } = require('playwright-core');

async function testFixedChatContainer() {
  console.log('🔧 ChatContainer構造修正版テスト...');
  
  const browser = await chromium.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // エラーログを監視
  const errors = [];
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('Warning') || text.includes('Failed')) {
      errors.push(text);
      console.log(`❌ ${text}`);
    }
  });
  
  try {
    console.log('📡 修正版アクセス...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    // ChatContainer構造確認
    const chatContainerCheck = await page.evaluate(() => {
      const mainContainer = document.querySelector('.cs-main-container');
      const chatContainer = document.querySelector('.cs-chat-container');
      const conversationHeader = document.querySelector('.cs-conversation-header');
      const messageList = document.querySelector('.cs-message-list');
      const messageInput = document.querySelector('.cs-message-input');
      
      return {
        hasMainContainer: !!mainContainer,
        hasChatContainer: !!chatContainer,
        hasConversationHeader: !!conversationHeader,
        hasMessageList: !!messageList,
        hasMessageInput: !!messageInput,
        chatContainerChildren: chatContainer ? chatContainer.children.length : 0,
        childTypes: chatContainer ? Array.from(chatContainer.children).map(child => child.className.split(' ')[0]).slice(0, 5) : []
      };
    });
    
    console.log('\n🎨 修正版UI確認:');
    console.log(`  MainContainer: ${chatContainerCheck.hasMainContainer ? '✅' : '❌'}`);
    console.log(`  ChatContainer: ${chatContainerCheck.hasChatContainer ? '✅' : '❌'}`);
    console.log(`  ConversationHeader: ${chatContainerCheck.hasConversationHeader ? '✅' : '❌'}`);
    console.log(`  MessageList: ${chatContainerCheck.hasMessageList ? '✅' : '❌'}`);
    console.log(`  MessageInput: ${chatContainerCheck.hasMessageInput ? '✅' : '❌'}`);
    console.log(`  子要素数: ${chatContainerCheck.chatContainerChildren}`);
    console.log(`  子要素タイプ: ${chatContainerCheck.childTypes.join(', ')}`);
    
    await page.screenshot({ path: 'fixed-chatcontainer-test.png', fullPage: true });
    console.log('\n📸 修正版スクリーンショット: fixed-chatcontainer-test.png');
    
    // エラー総計
    console.log(`\n🔍 構造エラー数: ${errors.length}`);
    if (errors.length === 0) {
      console.log('🎉 構造エラーが修正されました！');
    }
    
  } catch (error) {
    console.log(`❌ テストエラー: ${error.message}`);
  } finally {
    await browser.close();
  }
}

testFixedChatContainer().catch(console.error);
