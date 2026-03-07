// SubChat v2.0.1 - Session List Component with New Chat Feature
import React, { useState } from 'react';
import {
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Badge,
  Chip,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import { Circle, SmartToy, Add, Chat, Settings } from '@mui/icons-material';
import type { Session } from '../../../shared/src/types';
import { useAppStore } from '../store';

interface SessionListProps {
  sessions: Session[];
  onStartNewConversation?: (message: string) => Promise<void>;
  onOpenSettings?: () => void;
}

export const SessionList: React.FC<SessionListProps> = ({ 
  sessions, 
  onStartNewConversation,
  onOpenSettings
}) => {
  const { currentSessionId, setCurrentSession } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [starting, setStarting] = useState(false);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
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
    if (!newChatMessage.trim() || !onStartNewConversation || starting) return;

    setStarting(true);
    try {
      await onStartNewConversation(newChatMessage.trim());
      setNewChatMessage('');
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to start new conversation:', error);
    } finally {
      setStarting(false);
    }
  };

  return (
    <Box sx={{ width: 320, height: '100vh', borderRight: 1, borderColor: 'divider' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
            SubChat v2.0.1
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              onClick={() => onOpenSettings?.()}
              title="Settings"
            >
              <Settings fontSize="small" />
            </IconButton>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
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

      {/* Session List */}
      <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
        {sessions.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Chat sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="body2" color="text.secondary" mb={2}>
              No active sessions
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
              size="small"
            >
              Start New Chat
            </Button>
          </Box>
        ) : (
          sessions.map((session) => (
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
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SmartToy 
                  color={session.isActive ? 'primary' : 'disabled'} 
                  fontSize="small" 
                />
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" component="span" noWrap sx={{ fontWeight: 500 }}>
                      {session.name}
                    </Typography>
                    {session.isActive && (
                      <Circle sx={{ fontSize: 8, color: 'success.main' }} />
                    )}
                  </Stack>
                }
                secondary={
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip
                      label={session.agentId}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(session.lastActivity)}
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
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          OpenClaw Gateway
        </Typography>
      </Box>

      {/* New Chat Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
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
            value={newChatMessage}
            onChange={(e) => setNewChatMessage(e.target.value)}
            disabled={starting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={starting}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleStartNewChat} 
            disabled={!newChatMessage.trim() || starting}
            startIcon={starting ? undefined : <Chat />}
          >
            {starting ? 'Starting...' : 'Start Chat'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
