export const config={nearViewport:'600px',embedTimeoutMs:15000,healthIntervalMs:5000} as const;
export type ViewState='ready'|'loading'|'awaiting-user-action'|'error'|'unavailable';

export const HOST='vinylink-card';
