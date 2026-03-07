import React, { useState } from 'react';
import {
  Box,
  
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Badge,
  Stack,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Circle as CircleIcon,
  Add as AddIcon,
  Send as SendIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAppStore } from '../store';
import type { Session } from '../services/gateway';

interface SessionListProps {
  sessions: Session[];
  onOpenSettings: () => void;
}

export const SessionList: React.FC<SessionListProps> = ({ sessions, onOpenSettings }) => {
  const { currentSessionId, setCurrentSession } = useAppStore();
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date().getTime();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const handleSessionClick = (sessionId: string) => {
    console.log('🖱️ Session clicked:', sessionId);
    setCurrentSession(sessionId);
  };

  const handleStartNewChat = async () => {
    if (!newMessage.trim() || isStarting) return;
    
    setIsStarting(true);
    try {
      setNewMessage('');
      setNewChatOpen(false);
      alert('To start a new conversation, please use the OpenClaw CLI:\n\nopenclaw agent --message "Your message here" --agent fixus');
    } catch (error) {
      console.error('❌ Failed to start new chat:', error);
    } finally {
      setIsStarting(false);
    }
  };


  return (
    <Box sx={{ width: 320, height: '100vh', borderRight: 1, borderColor: 'divider' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
            SubChat v2.1.0
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton size="small" onClick={onOpenSettings} title="Settings">
              <SettingsIcon fontSize="small" />
            </IconButton>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setNewChatOpen(true)}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              New
            </Button>
          </Stack>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {sessions.length} sessions
        </Typography>
      </Box>

      {/* Sessions List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
        {sessions.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CircleIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="body2" color="text.secondary" mb={2}>
              No active sessions
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setNewChatOpen(true)}
              size="small"
            >
              Start New Chat
            </Button>
          </Box>
        ) : (
          sessions.map(session => (
            <ListItemButton
              key={session.id}
              selected={session.id === currentSessionId}
              onClick={() => handleSessionClick(session.id)}
              sx={{
                py: 1.5,
                px: 2,
                borderBottom: 1,
                borderColor: 'divider',
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  borderRight: 3,
                  borderRightColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.light'
                  }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <CircleIcon 
                  color={session.isActive ? 'primary' : 'disabled'} 
                  fontSize="small" 
                />
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography 
                      variant="body2" 
                      component="span" 
                      noWrap 
                      sx={{ fontWeight: 500 }}
                    >
                      {session.name}
                    </Typography>
                    {session.isActive && (
                      <CircleIcon sx={{ fontSize: 8, color: 'success.main' }} />
                    )}
                  </Stack>
                }
                secondary={
                  <Stack 
                    direction="row" 
                    alignItems="center" 
                    justifyContent="space-between" 
                    spacing={1} 
                    sx={{ mt: 0.5 }}
                  >
                    <Chip 
                      label={session.agentId} 
                      size="small" 
                      variant="outlined" 
                      sx={{ fontSize: '0.7rem', height: 20 }} 
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatTimeAgo(session.lastActivity)}
                    </Typography>
                  </Stack>
                }
              />
              
              {session.messageCount > 0 && (
                <Badge 
                  badgeContent={session.messageCount > 99 ? '99+' : session.messageCount}
                  color="primary"
                  sx={{ ml: 1 }}
                >
                  <Box />
                </Badge>
              )}
            </ListItemButton>
          ))
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          OpenClaw Gateway
        </Typography>
      </Box>

      {/* New Chat Dialog */}
      <Dialog open={newChatOpen} onClose={() => setNewChatOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start New Conversation</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Enter your first message to start a new conversation with an OpenClaw agent.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Hello! I'd like to..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isStarting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewChatOpen(false)} disabled={isStarting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStartNewChat}
            disabled={!newMessage.trim() || isStarting}
            startIcon={isStarting ? <CircularProgress size={16} /> : <SendIcon />}
          >
            {isStarting ? 'Starting...' : 'Start Chat'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SettingsIcon />
            <Typography variant="h6">Settings</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Alert severity="info">
              <Typography variant="body2">
                SubChat connects to OpenClaw Gateway to view conversations between agents and subagents. 
                API keys and model configuration should be managed via the OpenClaw CLI.
              </Typography>
            </Alert>
            
            <Box>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                OpenClaw CLI Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                To configure API keys and models, use these commands:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', margin: 0 }}>
{`# Configure Anthropic Claude
openclaw models auth paste-token --provider anthropic

# Check model status  
openclaw models status

# Set default model
openclaw models set anthropic/claude-sonnet-4-5`}
                </Typography>
              </Paper>
            </Box>

            <Box>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                About SubChat v2.1.0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                SubChat provides real-time visibility into OpenClaw agent conversations, 
                subagent spawning, and task delegation. For full functionality, ensure 
                your OpenClaw Gateway is properly configured with model providers.
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
