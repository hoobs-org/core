const User = require("../user");

module.exports = class UsersController {
    constructor() {
        global.app.get("/api/users", (request, response) => this.list(request, response));
        global.app.put("/api/users", (request, response) => this.create(request, response));
        global.app.get("/api/user/:id", (request, response) => this.get(request, response));
        global.app.post("/api/user/:id", (request, response) => this.update(request, response));
        global.app.delete("/api/user/:id", (request, response) => this.delete(request, response));
    }

    list(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        const results = [];

        for (let i = 0; i < global.users.length; i++) {
            const { ...user } = global.users[i];

            results.push({
                id: user.id,
                name: user.name || "",
                admin: user.admin || false,
                username: user.username
            });
        }

        return response.send(results);
    }

    get(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        const user = global.users.filter(u => u.id === parseInt(request.params.id, 10))[0];

        if (!user) {
            return response.send({
                error: "User not found"
            });
        }

        return response.send({
            id: user.id,
            name: user.name || "",
            admin: user.admin || false,
            username: user.username
        });
    }

    async update(request, response) {
        if (!global.admin && parseInt(request.params.id, 10) !== global.user) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        if (!request.body.username || request.body.username === "" || request.body.username.length < 5) {
            return response.send({
                error: "Invalid username."
            });
        }

        if (request.body.password && !User.strongPassword(request.body.password)) {
            return response.send({
                error: "Password too weak."
            });
        }

        if (await User.update(parseInt(request.params.id, 10), request.body.name, request.body.username, request.body.password, request.body.admin)) {
            return response.send({
                success: true
            });
        }

        return response.send({
            success: false
        });
    }

    async create(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        if (!request.body.username || request.body.username === "" || request.body.username.length < 5) {
            return response.send({
                error: "Invalid username."
            });
        }

        if (!User.strongPassword(request.body.password)) {
            return response.send({
                error: "Password too weak."
            });
        }

        await User.create(request.body.name, request.body.username, request.body.password, request.body.admin);

        return response.send({
            success: true
        });
    }

    delete(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        if (!User.delete(parseInt(request.params.id, 10))) {
            return response.send({
                success: false
            });
        }

        return response.send({
            success: true
        });
    }
}
