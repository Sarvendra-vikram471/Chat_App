const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Request failed')
  }

  if (response.status === 204) return null
  return response.json()
}

export { API_BASE_URL }
