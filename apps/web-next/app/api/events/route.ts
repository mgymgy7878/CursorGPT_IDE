export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        const data = `event: hb\ndata: ${new Date().toISOString()}\n\n`;
        controller.enqueue(encoder.encode(data));
      }, 5000);
      
      // Cleanup after 60 seconds
      setTimeout(() => {
        clearInterval(interval);
        controller.close();
      }, 60000);
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
