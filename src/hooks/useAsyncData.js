import { useCallback, useEffect, useState } from "react";

export function useAsyncData(loader, deps = [], fallback = null) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await loader();
      setData(result ?? fallback);
      return result;
    } catch (err) {
      setError(err.message || "Unable to load data");
      if (fallback !== null) setData(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { reload(); }, [reload]);

  return { data, setData, loading, error, reload };
}
