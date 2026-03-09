// SubChat v2 - Session List Component
import React, { useState } from 'react';
import {
  List,
  ListItemButton,
  ListItemIcon,
  Typography,
  Box,
  Badge,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Circle, SmartToy, Settings, DarkMode, LightMode, Stop } from '@mui/icons-material';
import type { Session } from '../services/gateway';
import { useAppStore } from '../store';

interface SessionListProps {
  sessions: Session[];
  onOpenSettings?: () => void;
  onKillSession?: (sessionId: string) => Promise<void>;
}

export const SessionList: React.FC<SessionListProps> = ({ sessions, onOpenSettings, onKillSession }) => {
  const { currentSessionId, setCurrentSession, themeMode, toggleTheme } = useAppStore();

  const [killTarget, setKillTarget] = useState<Session | null>(null);
  const [killing, setKilling] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });

  const handleKillClick = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    setKillTarget(session);
  };

  const handleKillConfirm = async () => {
    if (!killTarget || !onKillSession) return;
    setKilling(true);
    try {
      await onKillSession(killTarget.id);
      setSnackbar({ open: true, message: `セッション "${killTarget.name}" を終了しました`, severity: 'success' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : '不明なエラー';
      setSnackbar({ open: true, message: `終了に失敗: ${msg}`, severity: 'error' });
    } finally {
      setKilling(false);
      setKillTarget(null);
    }
  };

  const handleKillCancel = () => {
    if (!killing) setKillTarget(null);
  };

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

  return (
    <Box sx={{ 
      width: 320, 
      height: '100vh', 
      borderRight: 1, 
      borderColor: 'divider',
      bgcolor: 'background.paper'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
            SubChat v2.1.0
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {sessions.length} sessions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={themeMode === 'light' ? 'ダークモード' : 'ライトモード'}>
            <IconButton 
              onClick={toggleTheme}
              size="small"
              sx={{ color: 'text.secondary' }}
              aria-label="toggle theme"
            >
              {themeMode === 'light' ? <DarkMode /> : <LightMode />}
            </IconButton>
          </Tooltip>
          <Tooltip title="設定">
            <IconButton 
              onClick={onOpenSettings}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <Settings />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Session List */}
      <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
        {sessions.map((session) => (
          <ListItemButton
            key={session.id}
            selected={session.id === currentSessionId}
            onClick={() => setCurrentSession(session.id)}
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
            
            <Box sx={{ flexGrow: 1 }}>
              {/* Session Name Row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 500, flexGrow: 1 }}>
                  {session.name}
                </Typography>
                {session.isActive && (
                  <Circle sx={{ fontSize: 8, color: 'success.main' }} />
                )}
              </Box>
              
              {/* Agent & Time Row */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                mt: 0.5,
                gap: 1
              }}>
                <Chip
                  label={session.agentId}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.7rem', 
                    height: 20,
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatTime(session.lastActivity)}
                </Typography>
              </Box>
            </Box>
            
            {session.messageCount > 0 && (
              <Badge
                badgeContent={session.messageCount > 99 ? '99+' : session.messageCount}
                color="primary"
                sx={{ ml: 1 }}
              >
                <Box />
              </Badge>
            )}

            {session.isActive && onKillSession && (
              <Tooltip title="セッションを終了">
                <IconButton
                  size="small"
                  onClick={(e) => handleKillClick(e, session)}
                  sx={{
                    ml: 0.5,
                    color: 'error.main',
                    opacity: 0.6,
                    '&:hover': { opacity: 1, bgcolor: 'error.light' }
                  }}
                  aria-label={`kill session ${session.name}`}
                >
                  <Stop fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </ListItemButton>
        ))}

        {sessions.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No active sessions
            </Typography>
          </Box>
        )}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          OpenClaw Gateway
        </Typography>
      </Box>

      {/* Kill Confirmation Dialog */}
      <Dialog open={!!killTarget} onClose={handleKillCancel}>
        <DialogTitle>セッションを終了しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            セッション <strong>{killTarget?.name}</strong> (Agent: {killTarget?.agentId}) を強制終了します。この操作は取り消せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleKillCancel} disabled={killing}>
            キャンセル
          </Button>
          <Button
            onClick={handleKillConfirm}
            color="error"
            variant="contained"
            disabled={killing}
            startIcon={killing ? <CircularProgress size={16} color="inherit" /> : <Stop />}
          >
            {killing ? '終了中...' : '終了する'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
