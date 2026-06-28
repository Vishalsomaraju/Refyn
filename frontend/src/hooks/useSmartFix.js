import { useState } from 'react';

export function useSmartFix() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getSmartFix = async (code, language, issues, isOffline = false, model = 'gemini') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/smartfix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          issues: Array.isArray(issues) ? issues : [issues],
          offline: isOffline,
          selectedModel: model
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to generate fix');
      
      return result.data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { getSmartFix, loading, error };
}
