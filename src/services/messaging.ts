import type { FormDetectionResult, FieldMapping, JobDescription } from '../types/form';
import type { Profile } from '../types/profile';

export type MessageType =
  | 'DETECT_PAGE_FORM'
  | 'PAGE_FORM_DETECTED'
  | 'TRIGGER_AUTOFILL'
  | 'AUTOFILL_COMPLETE'
  | 'OPEN_REVIEW_PANEL'
  | 'CLOSE_REVIEW_PANEL'
  | 'OPEN_DASHBOARD'
  | 'GET_PROFILE'
  | 'SAVE_PROFILE'
  | 'GET_TAB_STATUS'
  | 'UPDATE_MAPPINGS'
  | 'APPLY_APPROVED_FIELDS'
  | 'GENERATE_AI_ANSWER'
  | 'PARSE_JOB_DESCRIPTION';

export interface ExtensionMessage<T = unknown> {
  type: MessageType;
  payload?: T;
}

export interface ExtensionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function sendTabMessage<Req = unknown, Res = unknown>(
  tabId: number,
  type: MessageType,
  payload?: Req
): Promise<ExtensionResponse<Res>> {
  if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.sendMessage) {
    return { success: false, error: 'Chrome tabs API not available' };
  }
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response || { success: true });
      }
    });
  });
}

export async function sendRuntimeMessage<Req = unknown, Res = unknown>(
  type: MessageType,
  payload?: Req
): Promise<ExtensionResponse<Res>> {
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    return { success: false, error: 'Chrome runtime API not available' };
  }
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response || { success: true });
      }
    });
  });
}

