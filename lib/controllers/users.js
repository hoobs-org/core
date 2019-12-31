const File = require("fs-extra");
const Request = require("axios");

const { join } = require("path");

const HBS = require("../instance");
const User = require("../user");
const Server = require("../server");

module.exports = class UsersController {
    constructor(client) {
        this.client = client || false;

        if (HBS.name && HBS.name !== "") {
            HBS.app.get("/api/users/sync", (request, response) => this.sync(request, response));
        } else {
            HBS.app.get("/api/users", (request, response) => this.list(request, response));
            HBS.app.put("/api/users", (request, response) => this.create(request, response));
            HBS.app.get("/api/user/:id", (request, response) => this.get(request, response));
            HBS.app.post("/api/user/:id", (request, response) => this.update(request, response));
            HBS.app.delete("/api/user/:id", (request, response) => this.delete(request, response));
        }
    }

    async sync(request, response) {
        if (HBS.name && HBS.name !== "" && HBS.config.server.client) {
            if (File.existsSync(join(Server.paths.config, HBS.name || "", "access.json"))) {
                File.unlinkSync(join(Server.paths.config, HBS.name || "", "access.json"));
            }

            Request.defaults.headers.get["Authorization"] = request.headers.authorization;

            HBS.users = (await Request.get(`${HBS.config.server.client}/api/auth/sync`)).data;

            File.appendFileSync(join(Server.paths.config, HBS.name || "", "access.json"), HBS.JSON.toString(HBS.users));

            return response.send({
                success: true
            });
        } else {
            return response.send({
                error: "Instance not properly setup."
            });
        }
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
            if (this.client) {
                const instances = HBS.config.client.instances || [];

                for (let i = 0; i < instances.length; i++) {
                    Request.defaults.headers.get["Authorization"] = request.headers.authorization;
                    Request.get(`${instances[i]}/api/users/sync`);
                }
            }

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

        if (this.client) {
            const instances = HBS.config.client.instances || [];

            for (let i = 0; i < instances.length; i++) {
                Request.defaults.headers.get["Authorization"] = request.headers.authorization;
                Request.get(`${instances[i]}/api/users/sync`);
            }
        }

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

        if (this.client) {
            const instances = HBS.config.client.instances || [];

            for (let i = 0; i < instances.length; i++) {
                Request.defaults.headers.get["Authorization"] = request.headers.authorization;
                Request.get(`${instances[i]}/api/users/sync`);
            }
        }

        return response.send({
            success: true
        });
    }
}
