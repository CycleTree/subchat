// SubChat v2 - Session List Component
import React from 'react';
import {
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Badge,
  Chip
} from '@mui/material';
import { Circle, SmartToy } from '@mui/icons-material';
import type { Session } from '../../../shared/src/types';
import { useAppStore } from '../store';

interface SessionListProps {
  sessions: Session[];
}

export const SessionList: React.FC<SessionListProps> = ({ sessions }) => {
  const { currentSessionId, setCurrentSession } = useAppStore();

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
    <Box sx={{ width: 320, height: '100vh', borderRight: 1, borderColor: 'divider' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
          SubChat v2
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {sessions.length} sessions
        </Typography>
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
            
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" component="span" noWrap sx={{ fontWeight: 500 }}>
                    {session.name}
                  </Typography>
                  {session.isActive && (
                    <Circle sx={{ fontSize: 8, color: 'success.main' }} />
                  )}
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                  <Chip
                    label={session.agentId}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(session.lastActivity)}
                  </Typography>
                </Box>
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
        ))}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          OpenClaw Gateway
        </Typography>
      </Box>
    </Box>
  );
};
