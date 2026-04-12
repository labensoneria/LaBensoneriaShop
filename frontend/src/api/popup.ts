import { apiFetch } from './client';

export interface PopupMessage {
  id:        string;
  content:   string;
  active:    boolean;
  createdAt: string;
}

export function getActivePopup() {
  return apiFetch<PopupMessage | null>('/api/popup');
}

export function getAdminPopups() {
  return apiFetch<PopupMessage[]>('/api/popup/admin');
}

export function createPopup(content: string) {
  return apiFetch<PopupMessage>('/api/popup/admin', {
    method: 'POST',
    body:   JSON.stringify({ content }),
  });
}

export function deactivatePopup(id: string) {
  return apiFetch<void>(`/api/popup/admin/${id}`, { method: 'DELETE' });
}
