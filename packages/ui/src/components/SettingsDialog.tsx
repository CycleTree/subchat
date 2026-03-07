// SubChat v2 - Settings Dialog for API Keys
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Chip,
  Stack,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Settings, Visibility, VisibilityOff, Save, Delete } from '@mui/icons-material';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSaveApiKey: (provider: string, apiKey: string) => Promise<void>;
}

interface ApiKeyConfig {
  provider: string;
  label: string;
  placeholder: string;
  pattern: string;
  description: string;
}

const API_CONFIGS: ApiKeyConfig[] = [
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

  // Load saved API keys from sessionStorage
  useEffect(() => {
    if (open) {
      const saved: Record<string, string> = {};
      API_CONFIGS.forEach(config => {
        const savedKey = sessionStorage.getItem(`subchat_api_${config.provider}`);
        if (savedKey) {
          saved[config.provider] = savedKey;
        }
      });
      setApiKeys(saved);
      setError(null);
    }
  }, [open]);

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
    setError(null);
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const handleSave = async (provider: string) => {
    const apiKey = apiKeys[provider]?.trim();
    if (!apiKey) return;

    const config = API_CONFIGS.find(c => c.provider === provider);
    if (!config) return;

    // Validate API key format
    if (!apiKey.startsWith(config.pattern.replace('^', ''))) {
      setError(`Invalid ${config.label} API key format. Expected format: ${config.pattern}`);
      return;
    }

    setSaving(provider);
    setError(null);

    try {
      await onSaveApiKey(provider, apiKey);
      
      // Save to sessionStorage (temporary, session-only)
      sessionStorage.setItem(`subchat_api_${provider}`, apiKey);
      
      console.log(`✅ ${config.label} API key configured`);
    } catch (error) {
      console.error(`❌ Failed to save ${config.label} API key:`, error);
      setError(`Failed to configure ${config.label}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = (provider: string) => {
    setApiKeys(prev => {
      const newKeys = { ...prev };
      delete newKeys[provider];
      return newKeys;
    });
    sessionStorage.removeItem(`subchat_api_${provider}`);
  };

  const maskApiKey = (apiKey: string): string => {
    if (!apiKey) return '';
    if (apiKey.length <= 8) return '*'.repeat(apiKey.length);
    return apiKey.slice(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.slice(-4);
  };

  const getSavedKeyCount = (): number => {
    return Object.keys(apiKeys).filter(provider => apiKeys[provider]).length;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Settings />
          <Typography variant="h6">API Keys Configuration</Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          <Alert severity="info">
            <Typography variant="body2">
              Configure API keys to enable OpenClaw AI features. Keys are stored temporarily in your session only.
            </Typography>
          </Alert>

          {getSavedKeyCount() > 0 && (
            <Alert severity="success">
              <Typography variant="body2">
                {getSavedKeyCount()} API key(s) configured. You can now start conversations!
              </Typography>
            </Alert>
          )}

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {API_CONFIGS.map((config) => {
            const hasKey = !!apiKeys[config.provider];
            const isVisible = showKeys[config.provider];
            const isSaving = saving === config.provider;

            return (
              <Box key={config.provider}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {config.label}
                  </Typography>
                  {hasKey && <Chip label="Configured" size="small" color="success" />}
                </Stack>
                
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {config.description}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="flex-end">
                  <TextField
                    fullWidth
                    type={hasKey && !isVisible ? 'password' : 'text'}
                    variant="outlined"
                    placeholder={config.placeholder}
                    value={hasKey && !isVisible ? maskApiKey(apiKeys[config.provider] || '') : apiKeys[config.provider] || ''}
                    onChange={(e) => handleApiKeyChange(config.provider, e.target.value)}
                    disabled={isSaving}
                    size="small"
                    InputProps={{
                      endAdornment: hasKey ? (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => toggleShowKey(config.provider)}
                            size="small"
                          >
                            {isVisible ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ) : undefined
                    }}
                  />
                  
                  <Button
                    variant="contained"
                    onClick={() => handleSave(config.provider)}
                    disabled={!apiKeys[config.provider]?.trim() || isSaving}
                    startIcon={isSaving ? undefined : <Save />}
                    size="small"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  
                  {hasKey && (
                    <IconButton
                      onClick={() => handleDelete(config.provider)}
                      color="error"
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Stack>
              </Box>
            );
          })}
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
