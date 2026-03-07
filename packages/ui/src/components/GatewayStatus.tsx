import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Alert,
  Button,
  Collapse
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface GatewayStatusProps {
  isVisible?: boolean;
}

export const GatewayStatus: React.FC<GatewayStatusProps> = ({ isVisible = false }) => {
  const [status, setStatus] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      // This would be called from the browser console or gateway instance
      // For now, just show basic info
      const info = {
        gateway: 'ws://localhost:18792/gateway',
        token: sessionStorage.getItem('subchat_gateway_token') || 'default',
        timestamp: new Date().toISOString(),
        // Add more status info here
      };
      setStatus(info);
    } catch (error) {
      console.error('Failed to get gateway status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      checkStatus();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Card sx={{ m: 2, maxWidth: 600 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Gateway Status</Typography>
          <Button
            size="small"
            onClick={checkStatus}
            disabled={loading}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Current WebSocket endpoint: ws://localhost:18792/gateway
        </Alert>

        {status && (
          <>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Gateway URL" 
                  secondary={status.gateway} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Auth Token" 
                  secondary={status.token.slice(0, 10) + '...'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Last Check" 
                  secondary={new Date(status.timestamp).toLocaleString()} 
                />
              </ListItem>
            </List>

            <Button 
              onClick={() => setExpanded(!expanded)}
              startIcon={<ExpandIcon />}
              size="small"
            >
              Developer Tools
            </Button>
            
            <Collapse in={expanded}>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Console Commands:
                </Typography>
                <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
{`testGateway()        // Test WebSocket connection
fixGatewayAuth()     // Reset authentication
showCurrentToken()   // Display current token
gateway              // Access gateway instance`}
                </Typography>
              </Box>
            </Collapse>
          </>
        )}
      </CardContent>
    </Card>
  );
};
