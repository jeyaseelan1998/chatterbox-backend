const express = require("express")
const http = require('http');
const { Server } = require("socket.io");

const { open } = require("sqlite")
const sqlite3 = require("sqlite3")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const path = require("path")
const cors = require("cors")



const app = express()

app.use(cors())
app.use(express.json())

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const secretKey = "CHATTERBOX_TOKEN"
const PORT = process.env.PORT || 1111
const dbPath = path.join(__dirname, "chatterbox.db")
let db = null


const initializeDBAndStartServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        })

        httpServer.listen(PORT, () => console.log(`Server started with PORT_NUMBER = ${PORT}`))
    }
    catch (err) {
        console.log(err.message)
        process.exit(1)
    }
}

initializeDBAndStartServer()

io.on("connection", (socket) => {

    console.log("user connected", socket.id);

    socket.on("join_room", (data) => {
        socket.join(data.roomId)
    })

    socket.on("send_message", (data) => {
        io.to(data.roomId).emit("receive_message", {
            ...data,
            timeStamp: Date.now()
        })
    })

    socket.on("create_room", (roomId) => {
        io.emit("update_room", roomId)
    })

    socket.on("logout", () => {
        io.in(socket.id).disconnectSockets();
    })

    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    })
})