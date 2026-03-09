// SubChat v2 - Session Tree Component (Hierarchical View)
import React, { useState, useCallback } from 'react';
import {
  List,
  ListItemButton,
  ListItemIcon,
  Typography,
  Box,
  Badge,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Circle,
  SmartToy,
  ExpandMore,
  ChevronRight,
  SubdirectoryArrowRight,
} from '@mui/icons-material';
import type { SessionTreeNode } from '../store';
import { useAppStore } from '../store';

interface SessionTreeProps {
  tree: SessionTreeNode[];
}

interface TreeNodeProps {
  node: SessionTreeNode;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}

const INDENT_PX = 24;

const TreeNode: React.FC<TreeNodeProps> = ({ node, expandedIds, onToggleExpand }) => {
  const { currentSessionId, setCurrentSession } = useAppStore();
  const { session, children, depth } = node;
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(session.id);

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
    <>
      <ListItemButton
        selected={session.id === currentSessionId}
        onClick={() => setCurrentSession(session.id)}
        sx={{
          py: 1.5,
          pl: 2 + depth * (INDENT_PX / 8),
          pr: 2,
          borderBottom: 1,
          borderColor: 'divider',
          position: 'relative',
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
        {/* Connector lines */}
        {depth > 0 && (
          <Box
            sx={{
              position: 'absolute',
              left: depth * (INDENT_PX / 8) * 8 + 8,
              top: 0,
              bottom: 0,
              width: 16,
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: '50%',
                width: '1px',
                bgcolor: 'divider',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: '50%',
                width: 12,
                height: '1px',
                bgcolor: 'divider',
              },
            }}
          />
        )}

        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(session.id);
            }}
            sx={{ mr: 0.5, p: 0.25 }}
          >
            {isExpanded ? (
              <ExpandMore fontSize="small" />
            ) : (
              <ChevronRight fontSize="small" />
            )}
          </IconButton>
        ) : (
          <Box sx={{ width: 28, mr: 0.5 }} />
        )}

        <ListItemIcon sx={{ minWidth: 32 }}>
          {depth === 0 ? (
            <SmartToy
              color={session.isActive ? 'primary' : 'disabled'}
              fontSize="small"
            />
          ) : (
            <SubdirectoryArrowRight
              color={session.isActive ? 'primary' : 'disabled'}
              fontSize="small"
            />
          )}
        </ListItemIcon>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mt: 0.5,
              gap: 1,
            }}
          >
            <Chip
              label={session.agentId}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.7rem',
                height: 20,
                '& .MuiChip-label': {
                  px: 1,
                },
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
      </ListItemButton>

      {/* Render children if expanded */}
      {hasChildren &&
        isExpanded &&
        children.map((child) => (
          <TreeNode
            key={child.session.id}
            node={child}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
          />
        ))}
    </>
  );
};

export const SessionTree: React.FC<SessionTreeProps> = ({ tree }) => {
  // Start with all nodes expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    const collectIds = (nodes: SessionTreeNode[]) => {
      for (const node of nodes) {
        if (node.children.length > 0) {
          ids.add(node.session.id);
          collectIds(node.children);
        }
      }
    };
    collectIds(tree);
    return ids;
  });

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  if (tree.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No active sessions
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
      {tree.map((node) => (
        <TreeNode
          key={node.session.id}
          node={node}
          expandedIds={expandedIds}
          onToggleExpand={handleToggleExpand}
        />
      ))}
    </List>
  );
};
