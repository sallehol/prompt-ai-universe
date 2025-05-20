
import React, { useState } from 'react';
import { useApiKeys } from '@/hooks/useApiKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // For better accessibility
import { logger } from '@/utils/logger';
// Icons like Eye, EyeOff, Save, Trash are not in the allowed list for lucide-react.
// We will use text or skip icons for those actions.

const ApiKeyManager: React.FC = () => {
  const { apiKeys, setApiKey, removeApiKey, isApiKeysLoaded } = useApiKeys();
  const [newProvider, setNewProvider] = useState('');
  const [newKey, setNewKey] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editKey, setEditKey] = useState<Record<string, string>>({});

  const handleAddOrUpdateKey = () => {
    if (newProvider.trim() && newKey.trim()) {
      logger.log(`[ApiKeyManager] Adding/Updating key for provider: ${newProvider.trim()}`);
      setApiKey(newProvider.trim(), newKey.trim());
      setNewProvider('');
      setNewKey('');
    } else {
      logger.warn('[ApiKeyManager] Provider or Key is empty.');
    }
  };

  const handleEditKeyChange = (provider: string, value: string) => {
    setEditKey(prev => ({ ...prev, [provider]: value }));
  };

  const handleSaveEditedKey = (provider: string) => {
    if (editKey[provider] !== undefined && editKey[provider].trim() !== "") {
      logger.log(`[ApiKeyManager] Saving edited key for provider: ${provider}`);
      setApiKey(provider, editKey[provider].trim());
      // Optionally clear editKey state for this provider or handle UI update
      setEditKey(prev => {
        const updated = {...prev};
        delete updated[provider]; // Or set to current key if input clears
        return updated;
      });
    } else {
       logger.warn(`[ApiKeyManager] Edited key for ${provider} is empty, not saving.`);
    }
  };
  
  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  if (!isApiKeysLoaded) {
    return <p>Loading API keys...</p>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-card border border-border rounded-lg shadow">
      <h2 className="text-2xl font-semibold text-light-text border-b border-border pb-3 mb-6">API Key Management</h2>
      
      <div className="space-y-4">
        {Object.keys(apiKeys).length === 0 && (
          <p className="text-medium-text">No API keys configured yet.</p>
        )}
        {Object.entries(apiKeys).map(([provider, key]) => (
          <div key={provider} className="p-4 border border-border/70 rounded-md space-y-3 bg-deep-bg/30">
            <p className="font-medium text-light-text text-lg">{provider}</p>
            <div className="flex items-center gap-2">
              <Input
                id={`api-key-${provider}`}
                type={showKeys[provider] ? 'text' : 'password'}
                value={editKey[provider] !== undefined ? editKey[provider] : key}
                onChange={(e) => handleEditKeyChange(provider, e.target.value)}
                className="flex-1 bg-card/80 border-input text-light-text placeholder-medium-text"
                aria-label={`${provider} API Key`}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleShowKey(provider)}
                className="text-medium-text hover:text-light-text"
              >
                {showKeys[provider] ? 'Hide' : 'Show'}
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSaveEditedKey(provider)}
                    disabled={editKey[provider] === undefined || editKey[provider] === key}
                >
                    Save Changes
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    logger.log(`[ApiKeyManager] Removing key for provider: ${provider}`);
                    removeApiKey(provider);
                  }}
                >
                  Remove Key
                </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-6 border-t border-border mt-6 space-y-4">
        <h3 className="text-xl font-semibold text-light-text">Add New API Key</h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full md:w-auto">
            <Label htmlFor="new-provider" className="block text-sm font-medium mb-1 text-medium-text">Provider Name</Label>
            <Input
              id="new-provider"
              value={newProvider}
              onChange={(e) => setNewProvider(e.target.value)}
              placeholder="e.g., openai, anthropic"
              className="bg-card/80 border-input text-light-text placeholder-medium-text"
            />
          </div>
          <div className="flex-1 w-full md:w-auto">
            <Label htmlFor="new-key" className="block text-sm font-medium mb-1 text-medium-text">API Key Value</Label>
            <Input
              id="new-key"
              type="password"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Enter API key"
              className="bg-card/80 border-input text-light-text placeholder-medium-text"
            />
          </div>
          <Button 
            onClick={handleAddOrUpdateKey} 
            className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!newProvider.trim() || !newKey.trim()}
          >
            Add Key
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;
