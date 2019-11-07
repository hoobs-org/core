const User = require("../user");

module.exports = class AuthController {
    constructor() {
        global.app.get("/api/auth", (request, response) => this.state(request, response));
        global.app.post("/api/auth", (request, response) => this.logon(request, response));
        global.app.put("/api/auth", (request, response) => this.create(request, response));
        global.app.get("/api/auth/validate", (request, response) => this.validate(request, response));
    }

    state(request, response) {
        if (global.users.length === 0) {
            return response.send({
                state: -1
            });
        }

        return response.send({
            state: 1
        });
    }

    async validate(request, response) {
        response.send({
            valid: await User.validateToken(request.headers.authorization)
        });
    }

    async logon(request, response) {
        const user = User.get(request.body.username);

        if (!user) {
            return response.send({
                token: false,
                error: "Invalid username or password."
            });
        }

        const challenge = await User.hashValue(request.body.password, user.salt);
            
        if (challenge !== user.password) {
            return response.send({
                token: false,
                error: "Invalid username or password."
            });
        }

        const remember = request.body.remember || false;

        return response.send({
            token: await User.generateToken(user.id, remember)
        });
    }

    async create(request, response) {
        if (global.users.length > 0 && !(await User.validateToken(request.headers.authorization))) {
            return response.send({
                token: false,
                error: "Unauthorized."
            });
        }

        if (global.users.length > 0 && !global.admin) {
            return response.send({
                token: false,
                error: "Unauthorized."
            });
        }

        if (!request.body.username || request.body.username === "" || request.body.username.length < 3) {
            return response.send({
                token: false,
                error: "Invalid username."
            });
        }

        if (request.body.password.length < 5) {
            return response.send({
                token: false,
                error: "Password too weak."
            });
        }

        if (global.users.length === 0) {
            request.body.admin = true;
        } else if (!global.admin) {
            request.body.admin = false;
        }

        const user = await User.create(request.body.name, request.body.username, request.body.password, request.body.admin);

        return response.send({
            token: await User.generateToken(user.id)
        });
    }
}
