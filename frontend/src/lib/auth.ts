import { useAuth as useClerkAuth } from '@/lib/clerk'
import { getConfiguredAuthToken } from '@/lib/api'

export function useAuthToken() {
  useClerkAuth()

  const getAuthHeaders = async () => {
    const token = await getConfiguredAuthToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  return { getAuthHeaders, getToken: getConfiguredAuthToken }
}
