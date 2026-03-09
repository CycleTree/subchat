import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Chip,
  Collapse,
  IconButton,
  List,
  ListItemButton,
  Stack,
  Typography,
} from '@mui/material';
import {
  AccountTree,
  ChevronRight,
  Circle,
  ExpandMore,
  SmartToy,
  SubdirectoryArrowRight,
} from '@mui/icons-material';
import type { Session } from '../../../shared/src/types';
import type { SessionTreeNode } from '../store';
import { useAppStore } from '../store';

interface SessionTreeProps {
  tree: SessionTreeNode[];
}

interface TreeNodeProps {
  node: SessionTreeNode;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  sessionLookup: Map<string, Session>;
}

const INDENT_STEP = 18;

const collectExpandableIds = (nodes: SessionTreeNode[]) => {
  const ids = new Set<string>();
  const walk = (items: SessionTreeNode[]) => {
    for (const item of items) {
      if (item.children.length > 0) {
        ids.add(item.session.id);
        walk(item.children);
      }
    }
  };

  walk(nodes);
  return ids;
};

const countNodes = (nodes: SessionTreeNode[]): number =>
  nodes.reduce((total, node) => total + 1 + countNodes(node.children), 0);

const countSpawnedNodes = (nodes: SessionTreeNode[]): number =>
  nodes.reduce((total, node) => total + (node.depth > 0 ? 1 : 0) + countSpawnedNodes(node.children), 0);

const countRoots = (nodes: SessionTreeNode[]): number => nodes.length;

const formatRelativeTime = (date: Date) => {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));

  if (minutes < 1) {
    return 'now';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  expandedIds,
  onToggleExpand,
  sessionLookup,
}) => {
  const { currentSessionId, setCurrentSession } = useAppStore();
  const { session, children, depth, parentSessionId, hasMissingParent } = node;
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(session.id);
  const parentSession = parentSessionId ? sessionLookup.get(parentSessionId) : undefined;

  return (
    <Box>
      <ListItemButton
        selected={session.id === currentSessionId}
        onClick={() => setCurrentSession(session.id)}
        sx={{
          alignItems: 'flex-start',
          py: 1.25,
          pr: 2,
          pl: 2 + depth * INDENT_STEP,
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
        <Box
          sx={{
            width: 26,
            mr: 1,
            display: 'flex',
            justifyContent: 'center',
            mt: 0.25,
          }}
        >
          {hasChildren ? (
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                onToggleExpand(session.id);
              }}
              sx={{ p: 0.25 }}
              aria-label={isExpanded ? 'Collapse children' : 'Expand children'}
            >
              {isExpanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
            </IconButton>
          ) : (
            <Box sx={{ width: 24, height: 24 }} />
          )}
        </Box>

        <Box
          sx={{
            width: 26,
            mr: 1.25,
            mt: 0.3,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {depth === 0 ? (
            <SmartToy color={session.isActive ? 'primary' : 'disabled'} fontSize="small" />
          ) : (
            <SubdirectoryArrowRight
              color={session.isActive ? 'primary' : 'disabled'}
              fontSize="small"
            />
          )}
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 0 }} noWrap>
              {session.name}
            </Typography>
            {session.isActive && <Circle sx={{ fontSize: 8, color: 'success.main' }} />}
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 0.5 }}
          >
            <Chip
              label={session.agentId}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.7rem',
                height: 20,
                '& .MuiChip-label': { px: 1 },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {formatRelativeTime(session.lastActivity)}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 0.9 }}>
            <Chip
              label={depth === 0 ? 'root agent' : `spawned depth ${depth}`}
              size="small"
              color={depth === 0 ? 'default' : 'primary'}
              variant={depth === 0 ? 'outlined' : 'filled'}
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
            {hasChildren && (
              <Chip
                label={`${children.length} child${children.length === 1 ? '' : 'ren'}`}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: '0.65rem' }}
              />
            )}
          </Stack>

          {depth > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
              {parentSession
                ? `spawned from ${parentSession.name}`
                : hasMissingParent
                  ? `spawned from missing parent: ${parentSessionId}`
                  : `spawned from ${parentSessionId}`}
            </Typography>
          )}
        </Box>

        {session.messageCount > 0 && (
          <Badge
            badgeContent={session.messageCount > 99 ? '99+' : session.messageCount}
            color="primary"
            sx={{ ml: 1.5, mt: 0.75 }}
          >
            <Box />
          </Badge>
        )}
      </ListItemButton>

      {hasChildren && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ borderLeft: 1, borderColor: 'divider', ml: 4 + depth * INDENT_STEP }}>
            {children.map((child) => (
              <TreeNode
                key={child.session.id}
                node={child}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                sessionLookup={sessionLookup}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export const SessionTree: React.FC<SessionTreeProps> = ({ tree }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => collectExpandableIds(tree));

  useEffect(() => {
    const nextExpandableIds = collectExpandableIds(tree);
    setExpandedIds((previous) => {
      const next = new Set(previous);
      let changed = false;

      for (const id of nextExpandableIds) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }

      for (const id of Array.from(next)) {
        if (!nextExpandableIds.has(id)) {
          next.delete(id);
          changed = true;
        }
      }

      return changed ? next : previous;
    });
  }, [tree]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const sessionLookup = useMemo(() => {
    const lookup = new Map<string, Session>();
    const walk = (items: SessionTreeNode[]) => {
      for (const item of items) {
        lookup.set(item.session.id, item.session);
        walk(item.children);
      }
    };

    walk(tree);
    return lookup;
  }, [tree]);

  if (tree.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No active sessions
        </Typography>
      </Box>
    );
  }

  const totalSessions = countNodes(tree);
  const spawnedSessions = countSpawnedNodes(tree);
  const rootSessions = countRoots(tree);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
          <AccountTree fontSize="small" color="action" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Agent hierarchy
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          <Chip label={`${rootSessions} root`} size="small" variant="outlined" />
          <Chip label={`${spawnedSessions} spawned`} size="small" color="primary" variant="outlined" />
          <Chip label={`${totalSessions} total`} size="small" variant="outlined" />
        </Stack>
      </Box>

      <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
        {tree.map((node) => (
          <TreeNode
            key={node.session.id}
            node={node}
            expandedIds={expandedIds}
            onToggleExpand={handleToggleExpand}
            sessionLookup={sessionLookup}
          />
        ))}
      </List>
    </Box>
  );
};
