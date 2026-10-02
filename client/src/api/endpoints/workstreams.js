import apiClient from '../client'
import { API_ENDPOINTS } from '@/constants/api'

export const workstreamsApi = {
  // Workstream management
  getProjectWorkstreams: (projectId, params) =>
    apiClient.get(API_ENDPOINTS.WORKSTREAMS.BASE(projectId), { params }),

  createWorkstream: (projectId, data) =>
    apiClient.post(API_ENDPOINTS.WORKSTREAMS.BASE(projectId), data),

  getWorkstreamById: (workstreamId) =>
    apiClient.get(API_ENDPOINTS.WORKSTREAMS.BY_ID(workstreamId)),

  updateWorkstream: (workstreamId, data) =>
    apiClient.patch(API_ENDPOINTS.WORKSTREAMS.BY_ID(workstreamId), data),

  deleteWorkstream: (workstreamId) =>
    apiClient.delete(API_ENDPOINTS.WORKSTREAMS.BY_ID(workstreamId)),

  // Members
  getMembers: (workstreamId) =>
    apiClient.get(API_ENDPOINTS.WORKSTREAMS.MEMBERS(workstreamId)),

  addMember: (workstreamId, data) =>
    apiClient.post(API_ENDPOINTS.WORKSTREAMS.MEMBERS(workstreamId), data),

  removeMember: (workstreamId, userId) =>
    apiClient.delete(API_ENDPOINTS.WORKSTREAMS.MEMBER_BY_ID(workstreamId, userId)),
}
