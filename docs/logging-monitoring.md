# Logging & Monitoring
Homebridge(X) uses [Socket.IO](https://socket.io/) for logging and monitoring. This allows you to stream the CPU and memory stats as well as the Homebridge(X) log. The Homebridge(X) status is also streamed.

## Logging
You can stream the active log to a browser, desktop or mobile application. Here is a basic HTML example.

```html
<script src="/socket.io/socket.io.js"></script>
<script>
    const socket = io("http://localhost");

    socket.on("connect", () => {
        // what to do when the socket connects
    });

    socket.on("log", (data) => {
        // show everything conbined
    });

    socket.on("info", (data) => {
        // just activity
    });

    socket.on("debug", (data) => {
        // developer stuff
    });

    socket.on("error", (data) => {
        // something is going wrong
    });

    socket.on("fatal", (data) => {
        // very bad stuff
    });

    socket.on("status", (data) => {
        // status of the server
    });

    socket.on("monitor", (data) => {
        // cpu and memory load
    });

    socket.on("disconnect", () => {
        // what to do when the socket disconnects
    });
</script>
```

> Socket.IO is compatible with browserify and webpack
