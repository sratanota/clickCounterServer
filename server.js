const WebSocket = require("ws")

const PORT = process.env.PORT || 4000
const MAX_PLAYERS = 5

const wss = new WebSocket.Server({ port: PORT })

let players = new Map()
let counter = 0
let gameStarted = false

function broadcast(msg) {
    const data = JSON.stringify(msg)

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data)
        }
    })
}

function broadcastPlayerList() {

    const list = Array.from(players.values())

    broadcast({
        type: "playerList",
        data: { players: list }
    })
}

function broadcastCounter() {

    broadcast({
        type: "counter",
        data: { value: counter }
    })
}

wss.on("connection", (ws) => {

    if (players.size >= MAX_PLAYERS) {

        ws.send(JSON.stringify({
            type: "serverFull",
            data: { message: "Server full (5 players max)" }
        }))

        ws.close()
        return
    }

    console.log("client connected")

    ws.on("message", (data) => {

        let msg

        try {
            msg = JSON.parse(data)
        }
        catch {
            ws.send(JSON.stringify({
                type: "error",
                data: { message: "Invalid JSON" }
            }))
            return
        }

        if (msg.type === "register") {

            const name = msg.data.name

            players.set(ws, name)

            broadcastPlayerList()

            if (players.size === MAX_PLAYERS) {
                gameStarted = true

                broadcast({
                    type: "start"
                })
            }
        }

        else if (msg.type === "click") {

            if (!gameStarted) return

            counter++
            broadcastCounter()
        }

    })

    ws.on("close", () => {

        console.log("client disconnected")

        players.delete(ws)

        broadcastPlayerList()

    })

})

console.log("WebSocket server running on port", PORT)
