import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Stack,
  Box,
  Chip,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Link as LinkIcon
} from '@mui/icons-material';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSaveApiKey: (provider: string, apiKey: string) => Promise<void>;
}

const API_PROVIDERS = [
  {
    provider: 'anthropic',
    label: 'Anthropic Claude',
    placeholder: 'sk-ant-api03-...',
    pattern: '^sk-ant-',
    description: 'Claude API key from console.anthropic.com'
  },
  {
    provider: 'openai',
    label: 'OpenAI',
    placeholder: 'sk-proj-...',
    pattern: '^sk-',
    description: 'OpenAI API key from platform.openai.com'
  },
  {
    provider: 'gemini',
    label: 'Google Gemini',
    placeholder: 'AIza...',
    pattern: '^AIza',
    description: 'Gemini API key from makersuite.google.com'
  }
];

const GATEWAY_TOKEN_KEY = 'subchat_gateway_token';

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ 
  open, 
  onClose, 
  onSaveApiKey 
}) => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [gatewayToken, setGatewayToken] = useState('');
  const [showGatewayToken, setShowGatewayToken] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load saved API keys and gateway token from sessionStorage
  useEffect(() => {
    if (open) {
      const keys: Record<string, string> = {};
      API_PROVIDERS.forEach(provider => {
        const saved = sessionStorage.getItem(`subchat_api_${provider.provider}`);
        if (saved) {
          keys[provider.provider] = saved;
        }
      });
      setApiKeys(keys);
      
      // Load gateway token
      const savedGatewayToken = sessionStorage.getItem(GATEWAY_TOKEN_KEY);
      if (savedGatewayToken) {
        setGatewayToken(savedGatewayToken);
      }
      
      setError(null);
      setSuccessMessage(null);
    }
  }, [open]);

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
    setError(null);
    setSuccessMessage(null);
  };

  const handleGatewayTokenChange = (value: string) => {
    setGatewayToken(value);
    setError(null);
    setSuccessMessage(null);
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const handleSaveApiKey = async (provider: string) => {
    const apiKey = apiKeys[provider]?.trim();
    if (!apiKey) return;

    const providerConfig = API_PROVIDERS.find(p => p.provider === provider);
    if (!providerConfig) return;

    // Validate API key format
    if (!apiKey.startsWith(providerConfig.pattern.replace('^', ''))) {
      setError(`Invalid ${providerConfig.label} API key format. Expected format: ${providerConfig.pattern}`);
      return;
    }

    setSaving(provider);
    setError(null);
    setSuccessMessage(null);

    try {
      await onSaveApiKey(provider, apiKey);
      
      // Save to sessionStorage
      sessionStorage.setItem(`subchat_api_${provider}`, apiKey);
      
      setSuccessMessage(`${providerConfig.label} API key configured successfully!`);
      console.log(`✅ ${providerConfig.label} API key configured`);
      
    } catch (error) {
      console.error(`❌ Failed to save ${providerConfig.label} API key:`, error);
      setError(`Failed to configure ${providerConfig.label}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(null);
    }
  };

  const handleSaveGatewayToken = () => {
    if (!gatewayToken.trim()) return;
    
    // Save gateway token to sessionStorage
    sessionStorage.setItem(GATEWAY_TOKEN_KEY, gatewayToken.trim());
    setSuccessMessage('Gateway token saved! Please refresh the page to reconnect.');
    console.log('✅ Gateway token saved to sessionStorage');
  };

  const handleRemoveApiKey = (provider: string) => {
    setApiKeys(prev => {
      const updated = { ...prev };
      delete updated[provider];
      return updated;
    });
    sessionStorage.removeItem(`subchat_api_${provider}`);
    setSuccessMessage(null);
  };

  const handleRemoveGatewayToken = () => {
    setGatewayToken('');
    sessionStorage.removeItem(GATEWAY_TOKEN_KEY);
    setSuccessMessage('Gateway token removed! Please refresh the page.');
  };

  const maskApiKey = (key: string): string => {
    if (!key) return '';
    if (key.length <= 8) return '*'.repeat(key.length);
    return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4);
  };

  const getConfiguredCount = () => {
    return Object.keys(apiKeys).filter(provider => apiKeys[provider]).length;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <SettingsIcon />
          <Typography variant="h6">SubChat Configuration</Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          <Alert severity="info">
            <Typography variant="body2">
              Configure Gateway connection and API keys for OpenClaw AI features.
              Keys are stored in session storage and OpenClaw configuration.
            </Typography>
          </Alert>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success">
              {successMessage}
            </Alert>
          )}

          {/* Gateway Token Configuration */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <LinkIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>
                OpenClaw Gateway Token
              </Typography>
              {gatewayToken && <Chip label="Configured" size="small" color="primary" />}
            </Stack>
            
            <Typography variant="body2" color="text.secondary" mb={2}>
              WebSocket authentication token for OpenClaw Gateway connection
            </Typography>

            <Stack direction="row" spacing={1} alignItems="flex-end">
              <TextField
                fullWidth
                type={showGatewayToken ? 'text' : 'password'}
                variant="outlined"
                placeholder="Gateway authentication token..."
                value={showGatewayToken ? gatewayToken : maskApiKey(gatewayToken)}
                onChange={(e) => handleGatewayTokenChange(e.target.value)}
                size="small"
                InputProps={{
                  endAdornment: gatewayToken ? (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowGatewayToken(!showGatewayToken)}
                        size="small"
                      >
                        {showGatewayToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ) : undefined
                }}
              />
              
              <Button
                variant="contained"
                onClick={handleSaveGatewayToken}
                disabled={!gatewayToken.trim()}
                startIcon={<SaveIcon />}
                size="small"
              >
                Save
              </Button>

              {gatewayToken && (
                <IconButton
                  onClick={handleRemoveGatewayToken}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* API Keys Section */}
          <Box>
            <Typography variant="h6" mb={1}>
              API Keys Configuration
            </Typography>
            
            {getConfiguredCount() > 0 && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {getConfiguredCount()} API key(s) configured. OpenClaw Gateway will use these for model requests.
                </Typography>
              </Alert>
            )}

            <Stack spacing={3}>
              {API_PROVIDERS.map(provider => {
                const hasKey = !!apiKeys[provider.provider];
                const showKey = showKeys[provider.provider];
                const isLoading = saving === provider.provider;

                return (
                  <Box key={provider.provider}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {provider.label}
                      </Typography>
                      {hasKey && <Chip label="Configured" size="small" color="success" />}
                    </Stack>
                    
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {provider.description}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="flex-end">
                      <TextField
                        fullWidth
                        type={hasKey && !showKey ? 'password' : 'text'}
                        variant="outlined"
                        placeholder={provider.placeholder}
                        value={hasKey && !showKey ? maskApiKey(apiKeys[provider.provider] || '') : (apiKeys[provider.provider] || '')}
                        onChange={(e) => handleApiKeyChange(provider.provider, e.target.value)}
                        disabled={isLoading}
                        size="small"
                        InputProps={{
                          endAdornment: hasKey ? (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => toggleShowKey(provider.provider)}
                                size="small"
                              >
                                {showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ) : undefined
                        }}
                      />
                      
                      <Button
                        variant="contained"
                        onClick={() => handleSaveApiKey(provider.provider)}
                        disabled={!apiKeys[provider.provider]?.trim() || isLoading}
                        startIcon={isLoading ? <CircularProgress size={16} /> : <SaveIcon />}
                        size="small"
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </Button>

                      {hasKey && (
                        <IconButton
                          onClick={() => handleRemoveApiKey(provider.provider)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Configuration Storage
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Gateway token is stored in session storage (temporary). API keys are saved to OpenClaw configuration file.
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
              <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', margin: 0 }}>
{`Session Storage:
- Gateway Token: subchat_gateway_token
- API Keys: subchat_api_[provider]

OpenClaw Config:
~/.openclaw/openclaw.json
{
  "env": {
    "vars": {
      "ANTHROPIC_API_KEY": "sk-ant-..."
    }
  }
}`}
              </Typography>
            </Paper>
          </Box>

          <Box>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              About SubChat v2.1.0
            </Typography>
            <Typography variant="body2" color="text.secondary">
              SubChat provides real-time visibility into OpenClaw agent conversations and enables 
              API key configuration via the Gateway WebSocket API. Configure the Gateway token 
              to establish WebSocket connection.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
