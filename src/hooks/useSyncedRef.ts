import { useRef, useEffect } from 'react';

export function useSyncedRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
