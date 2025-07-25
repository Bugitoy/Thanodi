import { processUserPairing, soloUserLeftTheChat } from "./userController/UserController.js"

export function handleSocketConnection(io, socket) {
     // 👇 Log all incoming socket events from this client
     socket.onAny((event, ...args) => {
      console.log(`📡 Event: ${event}`, args);
    });

    // pairing
    socket.on("startConnection", () => processUserPairing(io, socket))
    socket.on("pairedUserLeftTheChat", to => io.to(to).emit("strangerLeftTheChat"))
    socket.on("soloUserLeftTheChat", () => soloUserLeftTheChat(socket))

    // exchanging video call data(offer and answer)
    socket.on('message', m => io.to(m.to).emit('message', m));

    // private message
    socket.on("private message", ({ content, to }) => io.to(to).emit("private message", {
        content: content,
        from: socket.id,
    }))

    socket.on('disconnect', () => {
        try {
            socket.removeAllListeners('startConnection');
            socket.removeAllListeners('pairedUserLeftTheChat');
            socket.removeAllListeners('soloUserLeftTheChat');
            socket.removeAllListeners('message');
            socket.removeAllListeners('private message');
        } catch (error) {
            console.error(error);
        }
    })
}
