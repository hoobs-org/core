const HBS = require("../instance");
const User = require("../user");

module.exports = class UsersController {
    constructor() {
        HBS.app.get("/api/users", (request, response) => this.list(request, response));
        HBS.app.put("/api/users", (request, response) => this.create(request, response));
        HBS.app.get("/api/user/:id", (request, response) => this.get(request, response));
        HBS.app.post("/api/user/:id", (request, response) => this.update(request, response));
        HBS.app.delete("/api/user/:id", (request, response) => this.delete(request, response));
    }

    list(request, response) {
        const results = [];

        for (let i = 0; i < HBS.users.length; i++) {
            const { ...user } = HBS.users[i];

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
        const user = HBS.users.filter(u => u.id === parseInt(request.params.id, 10))[0];

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
        if (!request.body.username || request.body.username === "" || request.body.username.length < 3) {
            return response.send({
                error: "Invalid username."
            });
        }

        if (request.body.password && request.body.password.length < 5) {
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
        if (!request.body.username || request.body.username === "" || request.body.username.length < 3) {
            return response.send({
                error: "Invalid username."
            });
        }

        if (request.body.password && request.body.password.length < 5) {
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
