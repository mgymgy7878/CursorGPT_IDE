// Mock batcher implementation
export const enqueueBatch = (data: any) => {
  console.log('Enqueueing batch:', data);
  return Promise.resolve();
}; 