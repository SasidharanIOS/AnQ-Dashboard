import { useEffect, useState } from "react";

export function useAsyncData(fetcher, deps = [], initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetcher();

        if (alive) {
          setData(result);
        }
      } catch (err) {
        if (alive) {
          setError(err);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, deps);

  return {
    data,
    loading,
    error,
    setData
  };
}

export default useAsyncData;