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

const { exec } = require("child_process");
const { join, dirname } = require("path");
const Migration = require("@hoobs/migration");
const HBS = require("../server/instance");

module.exports = class MigrationController {
    constructor() {
        HBS.app.get("/api/migration/instances", (_request, response) => response.send(MigrationController.instances()));
        HBS.app.get("/api/migration/prerun/:instance", (request, response) => MigrationController.prerun(request, response));
        HBS.app.get("/api/migration/execute/:instance", (request, response) => MigrationController.execute(request, response));
    }

    static async prerun(request, response) {
        const tasks = new Migration.tasks(false);
        const instances = MigrationController.instances();
        const instance = instances.find((item) => item.name === request.params.instance);

        if (instance) {
            await tasks.interrogate("hoobs", instance.value, request.query.split === "true");

            return response.send({ count: tasks.count, tasks: tasks.serialize().map((item) => ({ step: item.step, description: (item.description || "").replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "") })) });
        }

        return response.send({ error: "unable to find instance" });
    }

    static async execute(request, response) {
        const instances = MigrationController.instances();
        const instance = instances.find((item) => item.name === request.params.instance);
        const migration = dirname(require.resolve("@hoobs/migration"));

        if (instance) {
            exec(`sudo ${join(migration, "bin", "hbs-migrate")} -a hoobs -i hoobs -y${request.query.split === "true" ? " -s" : ""}`);

            return response.send({ success: true });
        }

        return response.send({ error: "unable to find instance" });
    }

    static instances() {
        return Migration.instance.paths("hoobs").map((item) => ({ name: MigrationController.name(item), value: item }));
    }

    static name(value) {
        return value.toLowerCase().split(" ").join("-");
    }
}
