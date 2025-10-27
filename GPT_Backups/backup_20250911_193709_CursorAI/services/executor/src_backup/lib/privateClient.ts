// Mock private client implementation
export const privateClient = {
  connect: () => console.log('Private client connected'),
  disconnect: () => console.log('Private client disconnected'),
  send: (data: any) => console.log('Private client send:', data)
}; 