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
  Paper
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Delete as DeleteIcon
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

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ 
  open, 
  onClose, 
  onSaveApiKey 
}) => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load saved API keys from sessionStorage
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

  const handleRemoveApiKey = (provider: string) => {
    setApiKeys(prev => {
      const updated = { ...prev };
      delete updated[provider];
      return updated;
    });
    sessionStorage.removeItem(`subchat_api_${provider}`);
    setSuccessMessage(null);
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
          <Typography variant="h6">API Keys Configuration</Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          <Alert severity="info">
            <Typography variant="body2">
              Configure API keys to enable OpenClaw AI features. Keys are stored in the OpenClaw configuration file and session storage.
            </Typography>
          </Alert>

          {getConfiguredCount() > 0 && (
            <Alert severity="success">
              <Typography variant="body2">
                {getConfiguredCount()} API key(s) configured. OpenClaw Gateway will use these for model requests.
              </Typography>
            </Alert>
          )}

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

          <Box>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Configuration Method
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              SubChat uses OpenClaw's config.set API to write API keys directly to the configuration file.
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
              <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', margin: 0 }}>
{`# Configuration is saved to:
~/.openclaw/openclaw.json

# In the env.vars section:
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
              SubChat provides real-time visibility into OpenClaw agent conversations and enables API key configuration via the Gateway WebSocket API.
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
