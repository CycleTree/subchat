// SubChat v2 - Main Application (Environment-aware)
import { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Alert, CircularProgress } from '@mui/material';
import { SessionList } from './components/SessionList';
import { ChatView } from './components/ChatView';
import { SettingsDialog } from './components/SettingsDialog';
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

// Environment-aware Gateway Configuration
const getGatewayConfig = () => {
  const isDev = import.meta.env.DEV;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isDev || isLocalhost) {
    // Development: Local OpenClaw Gateway
    return {
      url: 'ws://localhost:18792/gateway',
      token: '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f'
    };
  } else {
    // Production: Fly.io OpenClaw Gateway
    return {
      url: 'wss://subchat-openclaw-gateway.fly.dev/gateway',  // Will be updated with actual Fly.io URL
      token: import.meta.env.VITE_OPENCLAW_TOKEN || 'subchat-gateway-token-2026'
    };
  }
};

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
    setCurrentSession,
  } = useAppStore();

  const [gateway] = useState(() => new GatewayService());
  const [initError, setInitError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gatewayConfig] = useState(getGatewayConfig);

  // Initialize Gateway Connection
  useEffect(() => {
    const init = async () => {
      try {
        // Reset error state at start
        setInitError(null);
        setConnection({ isConnected: false, isConnecting: true });
        console.log('🚀 SubChat v2 - Initializing...');
        console.log('🔗 Gateway URL:', gatewayConfig.url);

        // Setup gateway event handlers
        gateway.onConnectionChange = (connected: boolean) => {
          console.log('🔗 Connection change:', connected);
          setConnection({ 
            isConnected: connected, 
            isConnecting: false 
          });
          
          // Clear error when successfully connected
          if (connected) {
            setInitError(null);
          }
        };

        // Connect to gateway
        await gateway.connect(gatewayConfig.url, gatewayConfig.token);
        console.log('✅ Gateway connected successfully');

        // Load initial sessions
        const initialSessions = await gateway.getSessions();
        console.log('📋 Loaded sessions:', initialSessions.length);
        setSessions(initialSessions);

        // Clear error on successful initialization
        setInitError(null);

      } catch (error) {
        console.error('❌ Initialization failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to connect to OpenClaw Gateway';
        setInitError(errorMessage);
        setConnection({ 
          isConnected: false, 
          isConnecting: false, 
          error: errorMessage 
        });
      }
    };

    init();

    // Cleanup
    return () => {
      gateway.disconnect();
    };
  }, [gateway, setSessions, setConnection, gatewayConfig]);

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

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      updateMessage(optimisticMessage.id, { status: 'failed' });
      throw error;
    }
  };

  // API key configuration handler
  const handleSaveApiKey = async (provider: string, apiKey: string): Promise<void> => {
    if (!connection.isConnected) {
      throw new Error("Not connected to gateway");
    }

    console.log(`🔑 Configuring ${provider} API key`);

    try {
      await gateway.configureApiKey(provider, apiKey);
      console.log(`✅ ${provider} API key configured successfully`);
    } catch (error) {
      console.error(`❌ Failed to configure ${provider} API key:`, error);
      throw error;
    }
  };

  // Start new conversation handler
  const handleStartNewConversation = async (message: string): Promise<void> => {
    if (!connection.isConnected) {
      throw new Error("Not connected to gateway");
    }

    console.log("💬 Starting new conversation:", message);

    try {
      const sessionId = await gateway.startNewConversation(message);
      console.log("✅ New session created:", sessionId);

      const updatedSessions = await gateway.getSessions();
      setSessions(updatedSessions);
      console.log("📋 Sessions refreshed after new chat");

      setCurrentSession(sessionId);
      console.log("🎯 Selected new session:", sessionId);

    } catch (error) {
      console.error("❌ Failed to start new conversation:", error);
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
          <br />
          <small style={{ color: '#666' }}>{gatewayConfig.url}</small>
        </Box>

      </Box>

    );
  }

  // Error state - only show if currently not connected AND have error
  if (initError && !connection.isConnected) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" variant="filled">
          <strong>Connection Failed</strong><br />
          {initError}
          <br />
          <small>Gateway: {gatewayConfig.url}</small>
        </Alert>
      </Box>

    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Session List Sidebar */}
        <SessionList sessions={sessions} onStartNewConversation={handleStartNewConversation} onOpenSettings={() => setSettingsOpen(true)} />
        
        {/* Main Chat Area */}
        <ChatView
          session={getCurrentSession()}
          messages={getCurrentMessages()}
          onSendMessage={handleSendMessage}
          isConnected={connection.isConnected}
        />
      </Box>


        {/* Settings Dialog */}
        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSaveApiKey={handleSaveApiKey}
        />
    </ThemeProvider>
  );
}
