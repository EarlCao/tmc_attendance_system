import { useState, useEffect } from 'react'

/**
 * Returns a debounced version of `value` that only updates after
 * the user has stopped changing it for `delay` milliseconds.
 *
 * Pattern in pages:
 *   const [searchInput, setSearch] = useState('')   // raw – drives SearchBar value
 *   const search = useDebounce(searchInput, 300)    // debounced – used for filtering
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
