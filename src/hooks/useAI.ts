import { useState, useEffect, useCallback } from 'react';
import AiEngine from '@/plugins/AiEngine';

export function useAI() {
  const [models, setModels] = useState<string[]>([]);
  const [bestModel, setBestModel] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const result = await AiEngine.getAvailableModels();
      setModels(result.value.models);
      return result.value.models;
    } catch (e) {
      setModels([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const selectBest = useCallback(async (ramMB: number, cores: number, hasNPU: boolean) => {
    setLoading(true);
    try {
      const result = await AiEngine.selectBestModel({ ramMB, cores, hasNPU });
      setBestModel(result.value.model);
      setReason(result.value.reason);
      return result.value;
    } catch (e) {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, []);

  return { models, bestModel, reason, loading, loadModels, selectBest };
}
