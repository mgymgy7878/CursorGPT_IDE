export const sseSerialize = (event) => `data: ${JSON.stringify(event)}\n\n`;
