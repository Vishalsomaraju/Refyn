import { useState, useCallback } from 'react';

export function useExecute() {
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (code, language, stdin = '') => {
    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      const response = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, stdin })
      });

      if (!response.ok) {
        const errText = await response.text();
        const errData = {
          stdout: '',
          stderr: `Server error: ${response.status} — ${errText}`,
          time: null,
          memory: null,
          status: 'error',
        };
        setOutput(errData);
        return errData;
      }

      const result = await response.json();

      if (!result.success) {
        const errData = {
          stdout: '',
          stderr: result.error || 'Execution failed',
          time: null,
          memory: null,
          status: 'error',
        };
        setOutput(errData);
        return errData;
      }

      // Normalize the response shape
      const normalized = {
        stdout: result.data?.stdout || result.data?.output || '',
        stderr: result.data?.stderr || '',
        time:   result.data?.time || null,
        memory: result.data?.memory || null,
        status: result.data?.status || (result.data?.stderr ? 'error' : 'success'),
      };

      console.log('[Execute] Result:', normalized);
      setOutput(normalized);
      return normalized;
    } catch (err) {
      console.error('[Execute] fetch error:', err);
      setError(err.message);
      const errData = {
        stdout: '',
        stderr: err.message,
        time: null,
        memory: null,
        status: 'error',
      };
      setOutput(errData);
      return errData;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearOutput = useCallback(() => {
    setOutput(null);
    setError(null);
  }, []);

  return { output, loading, error, execute, clearOutput };
}
