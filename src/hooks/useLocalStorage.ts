import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const prefixedKey = `aurora-${key}`
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(prefixedKey)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(prefixedKey, JSON.stringify(storedValue))
    } catch { /* quota exceeded */ }
  }, [prefixedKey, storedValue])

  return [storedValue, setStoredValue]
}