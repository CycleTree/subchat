// Find existing imports and add SettingsDialog
import { SettingsDialog } from './components/SettingsDialog';

// Add state
const [settingsOpen, setSettingsOpen] = useState(false);

// Add API key handler after existing handlers
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

// Add start conversation handler
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

// Update SessionList with props
<SessionList 
  sessions={sessions} 
  onStartNewConversation={handleStartNewConversation} 
  onOpenSettings={() => setSettingsOpen(true)} 
/>

// Add SettingsDialog before </ThemeProvider>
<SettingsDialog
  open={settingsOpen}
  onClose={() => setSettingsOpen(false)}
  onSaveApiKey={handleSaveApiKey}
/>

// Add setCurrentSession to useAppStore destructuring
