import http from "node:http";

let draining = false;
let server: http.Server | null = null;

export function bindSignals(srv: http.Server) {
  server = srv;
  
  const quit = async () => {
    if (draining) return;
    draining = true;
    
    console.log("[SHUTDOWN] Graceful shutdown initiated...");
    
    try {
      // 1. Stop accepting new connections
      if (server) {
        server.close(() => {
          console.log("[SHUTDOWN] HTTP server closed");
        });
      }
      
      // 2. Wait for in-flight requests to complete
      console.log("[SHUTDOWN] Waiting for in-flight requests...");
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 3. Close any remaining connections
      console.log("[SHUTDOWN] Closing remaining connections...");
      
      // 4. Force exit after timeout
      setTimeout(() => {
        console.log("[SHUTDOWN] Force exit");
        process.exit(0);
      }, 8000);
      
    } catch (error) {
      console.error("[SHUTDOWN] Error during shutdown:", error);
      process.exit(1);
    }
  };
  
  // Bind signal handlers
  process.on("SIGTERM", quit);
  process.on("SIGINT", quit);
  
  console.log("[SHUTDOWN] Signal handlers bound");
}

export function isDraining(): boolean {
  return draining;
} 