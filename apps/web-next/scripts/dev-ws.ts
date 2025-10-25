import { WebSocketServer } from 'ws'

const port = 4001
const wss = new WebSocketServer({ port })

wss.on('connection', (ws) => {
  console.log('[dev-ws] client connected')
  
  ws.send(JSON.stringify({ 
    type: 'hello', 
    timestamp: Date.now(),
    message: 'Dev WebSocket server ready'
  }))
  
  ws.on('message', (msg) => {
    console.log('[dev-ws] received:', msg.toString())
    ws.send(msg) // Echo back
  })
  
  ws.on('close', () => {
    console.log('[dev-ws] client disconnected')
  })
})

console.log(`[dev-ws] listening on ws://127.0.0.1:${port}`)

process.on('SIGINT', () => {
  console.log('[dev-ws] shutting down...')
  wss.close(() => process.exit(0))
})

