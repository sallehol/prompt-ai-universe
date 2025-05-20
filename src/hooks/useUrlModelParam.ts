
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getModelById } from '@/data/aiModels';

export const useUrlModelParam = (defaultModel: string = 'gpt-4o-mini') => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const modelIdFromUrl = searchParams.get('model');
  const [isValidModelId, setIsValidModelId] = useState(true);
  const [attemptedModelId, setAttemptedModelId] = useState<string | null>(null);

  // Validate model from URL
  useEffect(() => {
    if (modelIdFromUrl) {
      setAttemptedModelId(modelIdFromUrl);
      const modelExists = getModelById(modelIdFromUrl);
      if (!modelExists) {
        setIsValidModelId(false);
        console.log(`[useUrlModelParam] Invalid modelId "${modelIdFromUrl}" from URL.`);
      } else {
        setIsValidModelId(true);
        console.log(`[useUrlModelParam] Valid modelId "${modelIdFromUrl}" from URL.`);
      }
    } else {
      setIsValidModelId(true); 
      setAttemptedModelId(null);
    }
  }, [modelIdFromUrl]);

  // Check for model in localStorage
  useEffect(() => {
    const modelFromStorage = localStorage.getItem('selectedModelForChat');
    if (modelFromStorage && !modelIdFromUrl && isValidModelId) {
      const modelExists = getModelById(modelFromStorage);
      if (modelExists) {
        console.log(`[useUrlModelParam] Found model "${modelFromStorage}" in localStorage. Navigating to set it in URL.`);
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('model', modelFromStorage);
        navigate({ search: newSearchParams.toString() }, { replace: true });
        localStorage.removeItem('selectedModelForChat');
      } else {
        console.warn(`[useUrlModelParam] Model "${modelFromStorage}" from localStorage is invalid. Ignoring.`);
        localStorage.removeItem('selectedModelForChat');
      }
    }
  }, [isValidModelId, navigate, modelIdFromUrl, searchParams]);

  const clearModelSearchParam = () => {
    if (searchParams.has('model')) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('model');
      navigate({ search: newSearchParams.toString() }, { replace: true });
      console.log(`[useUrlModelParam] Cleared 'model' param from URL.`);
    }
  };

  const initialModelForHook = modelIdFromUrl && isValidModelId ? modelIdFromUrl : defaultModel;

  return {
    initialModelForHook,
    isValidModelId,
    attemptedModelId,
    clearModelSearchParam
  };
};
