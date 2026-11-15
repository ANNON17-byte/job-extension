import '@testing-library/jest-dom';

// Chrome API mock for tests
(global as any).chrome = {
  storage: {
    local: {
      get: (_key: string, cb: (res: any) => void) => cb({}),
      set: (_items: any, cb?: () => void) => cb && cb(),
      clear: (cb?: () => void) => cb && cb(),
    },
  },
  runtime: {
    sendMessage: (_msg: any, cb?: (res: any) => void) => cb && cb({ success: true }),
    getURL: (path: string) => `chrome-extension://mock-id/${path}`,
  },
  tabs: {
    query: (_q: any, cb: (tabs: any[]) => void) => cb([{ id: 1, url: 'https://boards.greenhouse.io/test/jobs/123' }]),
    sendMessage: (_id: number, _msg: any, cb?: (res: any) => void) => cb && cb({ success: true }),
    create: (_opts: any) => {},
  },
  action: {
    setBadgeText: () => {},
    setBadgeBackgroundColor: () => {},
  },
};
