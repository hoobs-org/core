/**************************************************************************************************
 * hoobs-core                                                                                     *
 * Copyright (C) 2020 HOOBS                                                                       *
 *                                                                                                *
 * This program is free software: you can redistribute it and/or modify                           *
 * it under the terms of the GNU General Public License as published by                           *
 * the Free Software Foundation, either version 3 of the License, or                              *
 * (at your option) any later version.                                                            *
 *                                                                                                *
 * This program is distributed in the hope that it will be useful,                                *
 * but WITHOUT ANY WARRANTY; without even the implied warranty of                                 *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the                                  *
 * GNU General Public License for more details.                                                   *
 *                                                                                                *
 * You should have received a copy of the GNU General Public License                              *
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.                          *
 **************************************************************************************************/

const HBS = require("../server/instance");
const User = require("../server/user");

module.exports = class AuthController {
    constructor(client) {
        this.client = client || false;

        HBS.app.get("/api/auth", (request, response) => this.state(request, response));
        HBS.app.post("/api/auth", (request, response) => this.logon(request, response));
        HBS.app.put("/api/auth", (request, response) => this.create(request, response));
        HBS.app.get("/api/auth/validate", (request, response) => this.validate(request, response));

        if (this.client) {
            HBS.app.get("/api/auth/sync", (request, response) => this.sync(request, response));
        }
    }

    state(_request, response) {
        if (HBS.users.length === 0) {
            return response.send({
                state: -1
            });
        }

        return response.send({
            state: 1
        });
    }

    sync(_request, response) {
        return response.send(HBS.users);
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
        if (HBS.users.length > 0 && !(await User.validateToken(request.headers.authorization))) {
            return response.send({
                token: false,
                error: "Unauthorized."
            });
        }

        if (HBS.users.length > 0 && !HBS.admin) {
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

        if (HBS.users.length === 0) {
            request.body.admin = true;
        } else if (!HBS.admin) {
            request.body.admin = false;
        }

        const user = await User.create(request.body.name, request.body.username, request.body.password, request.body.admin);

        return response.send({
            token: await User.generateToken(user.id)
        });
    }
}
