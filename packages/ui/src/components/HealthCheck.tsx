import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  PlayArrow as TestIcon
} from '@mui/icons-material';
import { testGateway } from '../utils/websocketTest';

interface HealthCheckProps {
  isVisible?: boolean;
}

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  details?: any;
}

export const HealthCheck: React.FC<HealthCheckProps> = ({ isVisible = false }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [overall, setOverall] = useState<boolean | null>(null);
  const [duration, setDuration] = useState<number>(0);

  const runHealthCheck = async () => {
    setIsRunning(true);
    setResults([]);
    setOverall(null);
    setDuration(0);

    try {
      const testResults = await testGateway();
      setResults(testResults.results);
      setOverall(testResults.overall);
      setDuration(testResults.duration);
    } catch (error) {
      console.error('Health check failed:', error);
      setResults([{
        step: 'Test Execution',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }]);
      setOverall(false);
    } finally {
      setIsRunning(false);
    }
  };

  if (!isVisible) return null;

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckIcon color="success" /> : <ErrorIcon color="error" />;
  };

  const getOverallStatus = () => {
    if (overall === null) return { color: 'default' as const, label: 'Not tested' };
    return overall 
      ? { color: 'success' as const, label: 'Healthy' }
      : { color: 'error' as const, label: 'Failed' };
  };

  return (
    <Card sx={{ m: 2, maxWidth: 600 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">WebSocket Health Check</Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip {...getOverallStatus()} size="small" />
            <Button
              variant="contained"
              onClick={runHealthCheck}
              disabled={isRunning}
              startIcon={isRunning ? <CircularProgress size={16} /> : <TestIcon />}
              size="small"
            >
              {isRunning ? 'Testing...' : 'Run Test'}
            </Button>
          </Box>
        </Box>

        {duration > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Test completed in {duration}ms
          </Alert>
        )}

        {results.length > 0 && (
          <List dense>
            {results.map((result, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {getStatusIcon(result.success)}
                </ListItemIcon>
                <ListItemText
                  primary={result.step}
                  secondary={result.message}
                />
              </ListItem>
            ))}
          </List>
        )}

        {!isRunning && results.length === 0 && (
          <Alert severity="info">
            Click "Run Test" to check WebSocket connectivity, authentication, and API functionality.
          </Alert>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          This test verifies: WebSocket connection → Authentication → API calls
        </Typography>
      </CardContent>
    </Card>
  );
};
