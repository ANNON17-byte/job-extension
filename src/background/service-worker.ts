import { storageService } from '../services/storage';
import { seedProfile } from '../data/seed-profile';
import type { ExtensionMessage } from '../services/messaging';

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('ApplyMate installed/updated:', details.reason);
  const isFirst = await storageService.isFirstRun();
  if (isFirst) {
    await storageService.initializeWithSeed();
    console.log('ApplyMate: Seed profile initialized.');
  }
});

// Tab update badge handling
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (message.type === 'PAGE_FORM_DETECTED' && sender.tab?.id) {
    const payload = message.payload as {
      hasForm: boolean;
      fieldCount: number;
      isApplicationForm: boolean;
    };

    if (payload.hasForm && payload.fieldCount > 0) {
      chrome.action.setBadgeText({
        tabId: sender.tab.id,
        text: payload.isApplicationForm ? 'JOB' : `${payload.fieldCount}`,
      });
      chrome.action.setBadgeBackgroundColor({
        tabId: sender.tab.id,
        color: payload.isApplicationForm ? '#10b981' : '#3b82f6',
      });
    } else {
      chrome.action.setBadgeText({ tabId: sender.tab.id, text: '' });
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'OPEN_DASHBOARD') {
    const dashboardUrl = chrome.runtime.getURL('dashboard.html');
    chrome.tabs.create({ url: dashboardUrl });
    sendResponse({ success: true });
    return true;
  }

  sendResponse({ success: true });
  return true;
});

