import apiClient from '../client'
import { API_ENDPOINTS } from '@/constants/api'

export const projectsApi = {
  getProjects: (params) => apiClient.get(API_ENDPOINTS.PROJECTS.BASE, { params }),
  getProjectById: (projectId) => apiClient.get(API_ENDPOINTS.PROJECTS.BY_ID(projectId)),
  createProject: (data) => apiClient.post(API_ENDPOINTS.PROJECTS.BASE, data),
  updateProject: (projectId, data) => apiClient.patch(API_ENDPOINTS.PROJECTS.BY_ID(projectId), data),
  updateProjectStatus: (projectId, data) => apiClient.patch(`${API_ENDPOINTS.PROJECTS.BY_ID(projectId)}/status`, data),
  deleteProject: (projectId) => apiClient.delete(API_ENDPOINTS.PROJECTS.BY_ID(projectId)),

  // Project Members
  getMembers: (projectId) => apiClient.get(API_ENDPOINTS.PROJECTS.MEMBERS(projectId)),
  addMember: (projectId, data) => apiClient.post(API_ENDPOINTS.PROJECTS.MEMBERS(projectId), data),
  updateMember: (projectId, userId, data) => apiClient.patch(`${API_ENDPOINTS.PROJECTS.MEMBERS(projectId)}/${userId}`, data),
  removeMember: (projectId, userId) => apiClient.delete(`${API_ENDPOINTS.PROJECTS.MEMBERS(projectId)}/${userId}`),

  // Project Tasks Summary
  getProjectTasks: (projectId, params) => apiClient.get(`/projects/${projectId}/tasks`, { params }),
}
