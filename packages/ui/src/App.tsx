import { useState, useEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Alert, Box, useMediaQuery } from '@mui/material';
import { useAppStore } from './store';
import { createAppTheme, applyCssVariables } from './theme';
import { OpenClawGateway } from './services/gateway';
import { SessionList } from './components/SessionList';
import { ChatView } from './components/ChatView';
import { SettingsDialog } from './components/SettingsDialog';
import { testGateway } from './utils/websocketTest';

const gateway = new OpenClawGateway();

// Development tools
if (typeof window !== "undefined" && window.location.hostname === "localhost") {
  (window as any).testGateway = testGateway;
  (window as any).gateway = gateway;
  console.log("🔧 SubChat dev tools loaded:");
  console.log("  testGateway() - Test WebSocket connection");
  console.log("  fixGatewayAuth() - Fix authentication token");
}

function App() {
  const {
    sessions,
    currentSessionId, 
    connection,
    themeMode,
    setSessions,
    addMessage,
    setConnection,
    getCurrentMessages,
    queuedMessages,
    removeQueuedMessage
  } = useAppStore();

  const [initError, setInitError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Create theme based on current mode
  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

  // Apply CSS variables when theme changes
  useEffect(() => {
    applyCssVariables(themeMode);
  }, [themeMode]);

  // Enhanced function to get gateway token with better error handling
  const getGatewayToken = (): string => {
    // 1. Try session storage first
    const savedToken = sessionStorage.getItem('subchat_gateway_token');
    if (savedToken && savedToken.length > 10) {
      console.log('🔑 Using saved Gateway token from session storage');
      return savedToken;
    }
    
    // 2. Try localStorage as backup
    const localToken = localStorage.getItem('subchat_gateway_token');
    if (localToken && localToken.length > 10) {
      console.log('🔑 Using Gateway token from localStorage');
      sessionStorage.setItem('subchat_gateway_token', localToken);
      return localToken;
    }
    
    // 3. Use default tokens
    const isDevelopment = window.location.hostname === 'localhost';
    const defaultToken = isDevelopment 
      ? '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f'  
      : 'subchat-gateway-token-2026';
    
    console.log('🔑 Using default Gateway token for', isDevelopment ? 'development' : 'production');
    return defaultToken;
  };

  // Enhanced gateway initialization with retry logic
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    let retryTimeout: any;

    const initializeGateway = async (isRetry = false): Promise<void> => {
      if (isRetry) {
        console.log(`🔄 Retry attempt ${retryCount}/${maxRetries}`);
      } else {
        console.log('🚀 Initializing SubChat...');
        setConnection({ isConnected: false, isConnecting: true });
      }

      setInitError(null);

      gateway.onConnectionChange = (isConnected: boolean) => {
        console.log('🔗 Connection state changed:', isConnected);
        setConnection({ isConnected, isConnecting: false });
        
        if (!isConnected && retryCount < maxRetries) {
          retryCount++;
          console.log(`⏰ Will retry in 3 seconds... (${retryCount}/${maxRetries})`);
          retryTimeout = setTimeout(() => initializeGateway(true), 3000);
        }
      };

      try {
        const isDevelopment = window.location.hostname === 'localhost';
        const gatewayUrl = isDevelopment 
          ? 'ws://localhost:18792/gateway'
          : 'wss://subchat-openclaw-gateway.fly.dev/gateway';
        
        const authToken = getGatewayToken();

        console.log('🌐 Environment:', isDevelopment ? 'Development' : 'Production');
        console.log('🔗 Gateway URL:', gatewayUrl);
        console.log('🔑 Auth Token:', authToken.slice(0, 10) + '...');

        await gateway.connect(gatewayUrl, authToken);
        console.log('✅ Gateway connected successfully');

        // Reset retry count on successful connection
        retryCount = 0;

        const initialSessions = await gateway.getSessions();
        setSessions(initialSessions);
        console.log('📋 Initial sessions loaded:', initialSessions.length);

      } catch (error) {
        console.error('❌ Gateway initialization failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (errorMessage.includes('unauthorized') || errorMessage.includes('token mismatch')) {
          setInitError('Authentication failed: Gateway token mismatch. Open browser console and run fixGatewayAuth() or configure in Settings.');
        } else if (errorMessage.includes('connection failed') || errorMessage.includes('WebSocket connection failed')) {
          setInitError('Connection failed: Cannot reach OpenClaw Gateway. Please check if Gateway is running.');
        } else {
          setInitError(`Connection failed: ${errorMessage}`);
        }
        
        setConnection({ isConnected: false, isConnecting: false });
        
        // Retry logic for connection failures (but not auth failures)
        if (!errorMessage.includes('unauthorized') && retryCount < maxRetries) {
          retryCount++;
          console.log(`⏰ Will retry in 5 seconds... (${retryCount}/${maxRetries})`);
          retryTimeout = setTimeout(() => initializeGateway(true), 5000);
        }
      }
    };

    // Start initialization
    initializeGateway();

    // Cleanup function
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      gateway.disconnect();
    };
  }, [setConnection, setSessions]); // Only depend on these, not on token changes

  useEffect(() => {
    const loadMessages = async () => {
      if (!currentSessionId || !connection.isConnected) return;

      try {
        console.log(`📬 Loading messages for session: ${currentSessionId}`);
        const sessionMessages = await gateway.getMessages(currentSessionId); // Refresh messages
        console.log(`✅ Loaded ${sessionMessages.length} messages`);
        
        sessionMessages.forEach(message => {
          addMessage({
            ...message,
            status: 'sent' as const
          });
        });
      } catch (error) {
        console.error('❌ Failed to load messages:', error);
      }
    };

    loadMessages();
  }, [currentSessionId, connection.isConnected, addMessage]);

  // Auto-retry queued messages when connection is restored
  useEffect(() => {
    const retryQueuedMessages = async () => {
      if (!connection.isConnected || queuedMessages.length === 0) return;

      console.log(`🔄 Retrying ${queuedMessages.length} queued messages...`);
      
      for (const queuedMsg of queuedMessages) {
        try {
          console.log(`📤 Retrying queued message: ${queuedMsg.content.slice(0, 50)}...`);
          
          // Send the queued message
          await gateway.sendMessage(queuedMsg.sessionId, queuedMsg.content);
          
          // Add to local messages as sent
          addMessage({
            id: `sent-${Date.now()}`,
            sessionId: queuedMsg.sessionId,
            role: 'user',
            content: queuedMsg.content,
            timestamp: new Date(),
            status: 'sent'
          });

          // Remove from queue
          removeQueuedMessage(queuedMsg.id);
          
          console.log(`✅ Successfully sent queued message`);
          
          // Small delay between retries to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`❌ Failed to retry message ${queuedMsg.id}:`, error);
          // Keep in queue for next retry attempt
          break; // Stop retrying on first failure to maintain order
        }
      }
      
      if (queuedMessages.length === 0) {
        console.log('✅ All queued messages sent successfully');
      }
    };

    // Trigger retry when connection is restored
    if (connection.isConnected && queuedMessages.length > 0) {
      // Small delay to ensure connection is stable
      const timeoutId = setTimeout(retryQueuedMessages, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [connection.isConnected, queuedMessages, addMessage, removeQueuedMessage]);

  const handleSaveApiKey = async (provider: string, apiKey: string): Promise<void> => {
    if (!connection.isConnected) {
      throw new Error('Not connected to gateway');
    }

    try {
      await gateway.configureApiKey(provider, apiKey);
      console.log(`✅ ${provider} API key configured successfully`);
    } catch (error) {
      console.error(`❌ Failed to configure ${provider} API key:`, error);
      throw error;
    }
  };

  const handleKillSession = async (sessionId: string): Promise<void> => {
    try {
      await gateway.killSession(sessionId);
      console.log('🛑 Session killed:', sessionId);

      // Refresh session list
      const updatedSessions = await gateway.getSessions();
      setSessions(updatedSessions);
    } catch (error) {
      console.error('❌ Kill session failed:', error);
      throw error;
    }
  };

  const handleSendMessage = async (content: string): Promise<void> => {
    if (!currentSessionId || !connection.isConnected) {
      throw new Error('Not connected or no session selected');
    }

    try {
      await gateway.sendMessage(currentSessionId, content);
      
      addMessage({
        id: `temp-${Date.now()}`,
        sessionId: currentSessionId,
        role: 'user',
        content,
        timestamp: new Date(),
        status: 'sent'
      });

      console.log('✅ Message sent:', content);
      
      // Refresh messages after a delay
      setTimeout(async () => {
        try {
          await gateway.getMessages(currentSessionId); // Refresh messages
          console.log('🔄 Messages refreshed');
        } catch (error) {
          console.error('❌ Failed to refresh messages:', error);
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  };

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;
  const currentMessages = getCurrentMessages();
  
  // Combine regular messages with queued messages for display
  const allMessages = currentSessionId ? [
    ...currentMessages,
    ...queuedMessages.filter(msg => msg.sessionId === currentSessionId)
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()) : [];
  
  // Responsive breakpoint detection
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // On mobile: show SessionList when no session selected, show ChatView when session selected
  // On desktop: show both side by side
  const showSessionList = !isMobile || !currentSessionId;
  const showChatView = !isMobile || currentSessionId;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {initError && (
          <Alert 
            severity="error" 
            sx={{ 
              position: 'absolute', 
              top: 16, 
              left: '50%', 
              transform: 'translateX(-50%)',
              zIndex: 1000,
              maxWidth: '80vw'
            }}
            action={
              <button 
                onClick={() => setSettingsOpen(true)}
                style={{
                  background: 'none',
                  border: 'none', 
                  color: 'inherit',
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                Open Settings
              </button>
            }
          >
            {initError}
          </Alert>
        )}
        
        {showSessionList && (
          <SessionList
            sessions={sessions}
            onOpenSettings={() => setSettingsOpen(true)}
            onKillSession={handleKillSession}
          />
        )}
        
        {showChatView && (
          <ChatView 
            session={currentSession}
            messages={allMessages}
            onSendMessage={handleSendMessage}
            isConnected={connection.isConnected}
          />
        )}

        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSaveApiKey={handleSaveApiKey}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
