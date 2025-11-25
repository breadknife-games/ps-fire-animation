import type { API } from "../../../src/api/api";

let apiClient: API | null = null;

export function setApiClient(api: API) {
  apiClient = api;
}

export function getApiClient(): API {
  if (!apiClient) throw new Error("API client not ready");
  return apiClient;
}

