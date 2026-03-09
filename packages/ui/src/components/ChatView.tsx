// SubChat v2 - Chat View Component
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Chip,
  Stack,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Snackbar,
  Button,
  Alert,
  Divider
} from '@mui/material';
import { Send, Circle, ArrowBack, ContentCopy, ExpandMore, ExpandLess, Psychology } from '@mui/icons-material';
import type { Session, Message } from '../../../shared/src/types';
import { useAppStore } from '../store';

const COLLAPSE_THRESHOLD = 300;

interface ChatViewProps {
  session: Session | null;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  onSendIntervention: (content: string) => Promise<void>;
  isConnected: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  session,
  messages,
  onSendMessage,
  onSendIntervention,
  isConnected
}) => {
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingIntervention, setSendingIntervention] = useState(false);
  const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Store and responsive setup
  const { 
    clearCurrentSession, 
    saveDraft, 
    clearDraft, 
    getDraft, 
    queueMessage,
    getSessionQueuedCount,
    getSessionInterventions
  } = useAppStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load draft when session changes
  useEffect(() => {
    if (session) {
      const draft = getDraft(session.id);
      setInputValue(draft);
    } else {
      setInputValue('');
    }
  }, [session, getDraft]);

  // Enhanced input change handler with draft persistence
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Save draft automatically (debounced by React's batching)
    if (session) {
      if (value.trim()) {
        saveDraft(session.id, value);
      } else {
        clearDraft(session.id);
      }
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || sending || sendingIntervention || !session) return;

    const messageContent = inputValue.trim();
    
    // Clear input and draft immediately for better UX
    setInputValue('');
    clearDraft(session.id);

    if (!isConnected) {
      // Queue message when offline
      queueMessage(messageContent, session.id);
      console.log('📥 Message queued for later delivery:', messageContent);
      return;
    }

    // Send immediately when online
    setSending(true);
    try {
      await onSendMessage(messageContent);
      console.log('✅ Message sent immediately:', messageContent);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleIntervention = async () => {
    if (!inputValue.trim() || sending || sendingIntervention || !session) return;

    const interventionContent = inputValue.trim();
    setInputValue('');
    clearDraft(session.id);
    setSendingIntervention(true);

    try {
      await onSendIntervention(interventionContent);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to send intervention');
      setInputValue(interventionContent);
      saveDraft(session.id, interventionContent);
    } finally {
      setSendingIntervention(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleIntervention();
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'user': return 'primary';
      case 'assistant': return 'secondary';
      case 'system': return 'default';
      default: return 'default';
    }
  };

  const getMessageAlignment = (role: string) => {
    return role === 'user' ? 'flex-end' : 'flex-start';
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySnackbarOpen(true);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const toggleMessageExpanded = (messageId: string) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  // Dynamic status text based on connection and queue state
  const getStatusText = () => {
    if (sending) return "Sending...";
    if (sendingIntervention) return "Sending intervention...";
    if (!isConnected) {
      const queuedCount = session ? getSessionQueuedCount(session.id) : 0;
      if (queuedCount > 0) {
        return `Offline - ${queuedCount} message${queuedCount > 1 ? 's' : ''} queued`;
      }
      return "Offline - message will be queued";
    }
    return "Press Enter to send • Shift+Enter for new line";
  };

  // Enhanced placeholder text
  const getPlaceholder = () => {
    if (!isConnected) return "Type a message (will be queued)...";
    return "Type a message...";
  };

  if (!session) {
    return (
      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'grey.50'
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Select a session to start chatting
        </Typography>
      </Box>
    );
  }

  const interventions = getSessionInterventions(session.id)
    .slice()
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <Paper data-testid="message" 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Back button for mobile */}
          {isMobile && (
            <IconButton
              onClick={clearCurrentSession}
              size="small"
              sx={{ mr: 1 }}
              aria-label="Back to sessions"
            >
              <ArrowBack />
            </IconButton>
          )}
          
          <Box>
            <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
              {session.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip label={session.agentId} size="small" color="primary" variant="outlined" />
              <Typography variant="caption" color="text.secondary">
                {messages.length} messages
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Circle 
            sx={{ 
              fontSize: 12, 
              color: isConnected ? 'success.main' : 'error.main' 
            }} 
          />
          <Typography variant="caption" color="text.secondary">
            {isConnected ? 'Connected' : 'Disconnected'}
          </Typography>
        </Box>
      </Paper>

      {/* Messages */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: 2,
          bgcolor: 'grey.50'
        }}
      >
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Intervention History
          </Typography>
          {interventions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No interventions yet.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {interventions.map((entry) => (
                <Box key={entry.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={entry.status}
                      size="small"
                      color={entry.status === 'failed' ? 'error' : entry.status === 'sent' ? 'success' : 'warning'}
                      variant="outlined"
                      sx={{ height: 20 }}
                    />
                    {entry.transport && (
                      <Chip
                        label={entry.transport}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20 }}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(entry.timestamp)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {entry.content}
                  </Typography>
                  {entry.error && (
                    <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
                      {entry.error}
                    </Typography>
                  )}
                  <Divider sx={{ mt: 1 }} />
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        {messages.length === 0 ? (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%' 
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No messages yet. Start a conversation!
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: getMessageAlignment(message.role),
                }}
              >
                <Paper
                  elevation={message.status === 'queued' ? 0 : 1}
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: message.status === 'queued' ? 'grey.100' : 
                             message.role === 'user' ? 'primary.light' : 'background.paper',
                    color: message.status === 'queued' ? 'text.secondary' :
                           message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                    opacity: message.status === 'queued' ? 0.8 : 1,
                    border: message.status === 'queued' ? '1px dashed' : 'none',
                    borderColor: message.status === 'queued' ? 'warning.main' : 'transparent',
                  }}
                >
                  {message.content.length >= COLLAPSE_THRESHOLD && !expandedMessages.has(message.id) ? (
                    <>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content.slice(0, COLLAPSE_THRESHOLD)}...
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => toggleMessageExpanded(message.id)}
                        endIcon={<ExpandMore />}
                        sx={{ mt: 0.5, p: 0, minWidth: 'auto', textTransform: 'none', fontSize: '0.75rem' }}
                      >
                        続きを読む
                      </Button>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                      {message.content.length >= COLLAPSE_THRESHOLD && (
                        <Button
                          size="small"
                          onClick={() => toggleMessageExpanded(message.id)}
                          endIcon={<ExpandLess />}
                          sx={{ mt: 0.5, p: 0, minWidth: 'auto', textTransform: 'none', fontSize: '0.75rem' }}
                        >
                          折りたたむ
                        </Button>
                      )}
                    </>
                  )}

                  {/* Message status for pending/queued messages */}
                  {message.status && message.status !== 'sent' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      {message.status === 'pending' && (
                        <CircularProgress size={12} />
                      )}
                      {message.status === 'queued' && (
                        <Circle sx={{ fontSize: 8, color: 'warning.main' }} />
                      )}
                      <Typography 
                        variant="caption" 
                        color={message.status === 'queued' ? 'warning.main' : 'text.secondary'}
                      >
                        {message.status === 'queued' ? 'Queued for delivery' : message.status}
                      </Typography>
                    </Box>
                  )}
                </Paper>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Chip
                    label={message.role}
                    size="small"
                    color={getRoleColor(message.role) as any}
                    sx={{ fontSize: '0.7rem', height: 18 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(message.timestamp)}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleCopyMessage(message.content)}
                    sx={{
                      p: 0.25,
                      opacity: 0.6,
                      '&:hover': { opacity: 1 }
                    }}
                    aria-label="Copy message"
                  >
                    <ContentCopy sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Stack>
        )}
      </Box>

      {/* Input */}
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <Box sx={{ flexGrow: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              variant="outlined"
              placeholder={getPlaceholder()}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              disabled={sending || sendingIntervention}
              size="small"
              error={!isConnected && !sending}
              helperText={!isConnected ? "Offline mode - messages will be queued" : "Enter: send / Ctrl+Enter: intervene"}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-error': {
                    '& fieldset': {
                      borderColor: 'warning.main',
                      borderWidth: 1,
                    },
                  },
                },
              }}
            />
          </Box>
          <IconButton
            onClick={handleSend}
            disabled={!inputValue.trim() || sending || sendingIntervention}
            color={!isConnected ? "warning" : "primary"}
            sx={{ mb: 0.5 }}
            title={!isConnected ? "Message will be queued" : "Send message"}
          >
            {sending ? <CircularProgress size={20} /> : <Send />}
          </IconButton>
          <IconButton
            onClick={handleIntervention}
            disabled={!inputValue.trim() || sending || sendingIntervention || !isConnected}
            color="secondary"
            sx={{ mb: 0.5 }}
            title={isConnected ? "Send intervention to this session (Ctrl+Enter)" : "Interventions require a live connection"}
          >
            {sendingIntervention ? <CircularProgress size={20} /> : <Psychology />}
          </IconButton>
        </Box>

        {actionError && (
          <Alert severity="error" sx={{ mt: 1 }} onClose={() => setActionError(null)}>
            {actionError}
          </Alert>
        )}
        
        {/* Status bar */}
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {getStatusText()}
          </Typography>
        </Box>
      </Box>

      {/* Copy success feedback */}
      <Snackbar
        open={copySnackbarOpen}
        autoHideDuration={2000}
        onClose={() => setCopySnackbarOpen(false)}
        message="Copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};
