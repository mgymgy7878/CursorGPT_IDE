let allowWrite = process.env.ALLOW_WRITE === '1';
export function getAllowWrite() { return allowWrite; }
export function setAllowWrite(v: boolean) { allowWrite = !!v; } 