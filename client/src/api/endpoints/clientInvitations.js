import apiClient from '../client'
import { API_ENDPOINTS } from '@/constants/api'

export const clientInvitationsApi = {
  createInvitation: (data) =>
    apiClient.post(API_ENDPOINTS.CLIENT_INVITATIONS.BASE, data),
  getInvitations: (params) =>
    apiClient.get(API_ENDPOINTS.CLIENT_INVITATIONS.BASE, { params }),
  getInvitationById: (id) =>
    apiClient.get(API_ENDPOINTS.CLIENT_INVITATIONS.BY_ID(id)),
  revokeInvitation: (id) =>
    apiClient.post(API_ENDPOINTS.CLIENT_INVITATIONS.REVOKE(id)),
  verifyInvitation: (token) =>
    apiClient.get(API_ENDPOINTS.CLIENT_INVITATIONS.VERIFY(token)),
  acceptInvitation: (data) =>
    apiClient.post(API_ENDPOINTS.CLIENT_INVITATIONS.ACCEPT, data),
}
