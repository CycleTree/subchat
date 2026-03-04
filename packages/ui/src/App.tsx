// SubChat v2 - Main Application
import { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Alert, CircularProgress } from '@mui/material';
import { SessionList } from './components/SessionList';
import { ChatView } from './components/ChatView';
import { GatewayService } from './services/gateway';
import { useAppStore } from './store';
import type { Message } from '../../shared/src/types';

// Material-UI Theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#fafafa',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Gateway Configuration
const GATEWAY_URL = 'ws://localhost:18792/gateway';
const GATEWAY_TOKEN = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';

export default function App() {
  const {
    sessions,
    setSessions,
    currentSessionId,
    getCurrentMessages,
    getCurrentSession,
    addMessage,
    updateMessage,
    connection,
    setConnection,
  } = useAppStore();

  const [gateway] = useState(() => new GatewayService());
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize Gateway Connection
  useEffect(() => {
    const init = async () => {
      try {
        setConnection({ isConnected: false, isConnecting: true });
        console.log('🚀 SubChat v2 - Initializing...');

        // Setup gateway event handlers
        gateway.onConnectionChange = (connected: boolean) => {
          console.log('🔗 Connection change:', connected);
          setConnection({ 
            isConnected: connected, 
            isConnecting: false 
          });
        };

        // Connect to gateway
        await gateway.connect(GATEWAY_URL, GATEWAY_TOKEN);
        console.log('✅ Gateway connected successfully');

        // Load initial sessions
        const initialSessions = await gateway.getSessions();
        console.log('📋 Loaded sessions:', initialSessions.length);
        setSessions(initialSessions);

      } catch (error) {
        console.error('❌ Initialization failed:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to connect to OpenClaw Gateway');
        setConnection({ 
          isConnected: false, 
          isConnecting: false, 
          error: error instanceof Error ? error.message : 'Connection failed' 
        });
      }
    };

    init();

    // Cleanup
    return () => {
      gateway.disconnect();
    };
  }, [gateway, setSessions, setConnection]);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId && connection.isConnected) {
      const loadMessages = async () => {
        try {
          console.log('📨 Loading messages for session:', currentSessionId);
          const sessionMessages = await gateway.getMessages(currentSessionId);
          console.log('✅ Loaded messages:', sessionMessages.length);
          
          // Clear existing messages for this session and add new ones
          sessionMessages.forEach(message => addMessage(message));
        } catch (error) {
          console.error('❌ Failed to load messages:', error);
        }
      };
      
      loadMessages();
    }
  }, [currentSessionId, connection.isConnected, gateway, addMessage]);

  // Send message handler
  const handleSendMessage = async (content: string): Promise<void> => {
    if (!currentSessionId || !connection.isConnected) {
      throw new Error('Not connected or no session selected');
    }

    console.log('📤 Sending message:', content);

    // Create optimistic message
    const optimisticMessage: Message = {
      id: `pending-${Date.now()}`,
      sessionId: currentSessionId,
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'pending'
    };

    // Add optimistic message
    addMessage(optimisticMessage);

    try {
      // Send to gateway
      await gateway.sendMessage(currentSessionId, content);
      
      // Update message status
      updateMessage(optimisticMessage.id, { status: 'sent' });
      console.log('✅ Message sent successfully');

      // TODO: In a real implementation, we'd wait for the response
      // and add it when received via WebSocket events

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      updateMessage(optimisticMessage.id, { status: 'failed' });
      throw error;
    }
  };

  // Loading state
  if (connection.isConnecting && !initError) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress />
        <Box sx={{ textAlign: 'center' }}>
          Connecting to OpenClaw Gateway...
        </Box>
      </Box>
    );
  }

  // Error state
  if (initError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" variant="filled">
          <strong>Connection Failed</strong><br />
          {initError}
        </Alert>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Session List Sidebar */}
        <SessionList sessions={sessions} />
        
        {/* Main Chat Area */}
        <ChatView
          session={getCurrentSession()}
          messages={getCurrentMessages()}
          onSendMessage={handleSendMessage}
          isConnected={connection.isConnected}
        />
      </Box>
    </ThemeProvider>
  );
}
