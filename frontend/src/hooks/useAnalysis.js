import { useState, useCallback } from 'react';

export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [usedModel, setUsedModel] = useState(null);
  const [stats, setStats] = useState(null);
  const [memoryInsights, setMemoryInsights] = useState([]);

  const analyze = useCallback(async (code, language, options) => {
    const { modelMode, selectedModel, offline } = options;
    
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setUsedModel(null);

    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          modelMode,
          selectedModel,
          offline,
          userId: localStorage.getItem("refyn_username") || null
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze code');
      }

      setAnalysis(data.data.analysis || data.data);
      setUsedModel(data.usedModel || data.data.usedModel);
      const parsedStats = data.stats || data.data.stats || {};
      setStats({
        ...parsedStats,
        model: parsedStats.usedModel || data.usedModel || data.data.usedModel || 'unknown'
      });
      setMemoryInsights(data.memoryInsights || data.data.memoryInsights || []);
      
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during analysis');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setUsedModel(null);
    setStats(null);
    setMemoryInsights([]);
    setLoading(false);
  }, []);

  return {
    analysis,
    loading,
    error,
    usedModel,
    stats,
    memoryInsights,
    analyze,
    reset
  };
}
