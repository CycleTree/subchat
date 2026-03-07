import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Alert, Box } from '@mui/material';
import { useAppStore } from './store';
import { OpenClawGateway } from './services/gateway';
import { SessionList } from './components/SessionList';
import { ChatView } from './components/ChatView';

const theme = createTheme({
  palette: {
    primary: { main: '#2563eb', light: '#eff6ff' },
    background: { default: '#f8fafc' }
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  }
});

const gateway = new OpenClawGateway();

function App() {
  const {
    sessions,
    currentSessionId, 
    connection,
    setSessions,
    addMessage,
    setConnection,
    getCurrentMessages
  } = useAppStore();

  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeGateway = async () => {
      setConnection({ isConnected: false, isConnecting: true });

      gateway.onConnectionChange = (isConnected: boolean) => {
        setConnection({ isConnected, isConnecting: false });
      };

      try {
        const isDevelopment = window.location.hostname === 'localhost';
        const gatewayUrl = isDevelopment 
          ? 'ws://localhost:18792/gateway'
          : 'wss://subchat-openclaw-gateway.fly.dev/gateway';
        
        const authToken = isDevelopment
          ? 'test-token-123'  
          : 'subchat-gateway-token-2026';

        console.log('🌐 Environment:', isDevelopment ? 'Development' : 'Production');
        console.log('🔗 Gateway URL:', gatewayUrl);

        await gateway.connect(gatewayUrl, authToken);
        console.log('✅ Gateway connected');

        const initialSessions = await gateway.getSessions();
        setSessions(initialSessions);
        console.log('📋 Initial sessions loaded:', initialSessions.length);

      } catch (error) {
        console.error('❌ Gateway initialization failed:', error);
        setInitError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setConnection({ isConnected: false, isConnecting: false });
      }
    };

    initializeGateway();

    return () => {
      gateway.disconnect();
    };
  }, [setConnection, setSessions]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!currentSessionId || !connection.isConnected) return;

      try {
        const sessionMessages = await gateway.getMessages(currentSessionId);
        console.log(`📬 Loaded ${sessionMessages.length} messages for session:`, currentSessionId);
        
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
      
      setTimeout(async () => {
        try {
          await gateway.getMessages(currentSessionId);
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
          >
            {initError}
          </Alert>
        )}
        
        <SessionList sessions={sessions} />
        
        <ChatView 
          session={currentSession}
          messages={currentMessages}
          onSendMessage={handleSendMessage}
          isConnected={connection.isConnected}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
