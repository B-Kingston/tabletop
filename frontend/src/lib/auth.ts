import { useAuth as useClerkAuth } from '@/lib/clerk'

export function useAuthToken() {
  const { getToken } = useClerkAuth()

  const getAuthHeaders = async () => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  return { getAuthHeaders, getToken }
}
