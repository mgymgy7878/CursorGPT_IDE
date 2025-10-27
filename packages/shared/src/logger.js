export const log = (level, message, meta) => {
    const line = JSON.stringify({ level, message, meta, ts: new Date().toISOString() });
    if (level === 'error')
        console.error(line);
    else if (level === 'warn')
        console.warn(line);
    else
        console.log(line);
};
