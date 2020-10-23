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

import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        user: null,
        messages: [],
        categories: [],
        command: null,
        weather: null,
        forecast: null,
        version: null,
        running: false,
        locked: false,
        refresh: null,
        screen: {
            width: null,
            height: null
        },
        uptime: 0,
        uptime: {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
        },
        cpu: {
            used: null,
            history: [
                [0,  -1], [1,  -1], [2,  -1], [3,  -1],
                [4,  -1], [5,  -1], [6,  -1], [7,  -1],
                [8,  -1], [9,  -1], [10, -1], [11, -1],
                [12, -1], [13, -1], [14, -1], [15, -1],
                [16, -1], [17, -1], [18, -1], [19, -1]
            ]
        },
        memory: {
            load: null,
            total: null,
            used: null,
            history: [
                [0,  -1], [1,  -1], [2,  -1], [3,  -1],
                [4,  -1], [5,  -1], [6,  -1], [7,  -1],
                [8,  -1], [9,  -1], [10, -1], [11, -1],
                [12, -1], [13, -1], [14, -1], [15, -1],
                [16, -1], [17, -1], [18, -1], [19, -1]
            ]
        },
        menus: {
            nav: false,
            service: false,
            instance: false
        },
        query: "",
        results: [],
        streamed: {},
        notifications: []
    },
    mutations: {
        session(state, user) {
            state.user = user;
        },

        lock(state) {
            state.locked = true;
        },

        unlock(state) {
            state.locked = false;
        },

        update(state) {
            state.refresh = new Date();
        },

        reboot(state) {
            state.refresh = new Date();
        },

        show(state, menu) {
            state.menus[menu] = true;
        },

        hide(state, menu) {
            state.menus[menu] = false;
        },

        toggle(state, menu) {
            state.menus[menu] = !state.menus[menu];
        },

        resize(state, dimension) {
            state.screen = dimension;
        },

        log(state, message) {
            if (message === "{CLEAR}") {
                state.messages = [];
            } else {
                state.messages.push(message)

                while (state.messages.length > 500) {
                    state.messages.shift();
                }
            }
        },

        commands(state, payload) {
            state.command = payload;
        },

        push(state, payload) {
            state.notifications.push(payload);

            while (state.notifications.length > 5) {
                state.notifications.shift();
            }
        },

        dismiss(state, index) {
            state.notifications.splice(index, 1);
        },

        load(state, notifications) {
            state.notifications = notifications;
        },

        monitor(state, payload) {
            const units = (value) => {
                const results = {
                    value: Math.round((value / 1073741824) * 100) / 100,
                    units: "GB"
                };

                while (results.value < 1 && results.units !== "KB") {
                    results.value = Math.round((results.value * 1024) * 100) / 100;

                    switch (results.units) {
                        case "GB":
                            results.units = "MB";
                            break;

                        case "MB":
                            results.units = "KB";
                            break;
                    }
                }

                return results;
            }

            switch (payload.name) {
                case "status":
                    state.version = payload.data.version;
                    state.running = payload.data.running;

                    let diff = payload.data.uptime;

                    state.uptime.days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    diff -=  state.uptime.days * (1000 * 60 * 60 * 24);
                    state.uptime.hours = Math.floor(diff / (1000 * 60 * 60));
                    diff -= state.uptime.hours * (1000 * 60 * 60);
                    state.uptime.minutes = Math.floor(diff / (1000 * 60));
                    diff -= state.uptime.minutes * (1000 * 60);
                    state.uptime.seconds = Math.floor(diff / (1000));
                    diff -= state.uptime.seconds * (1000);
                    break;

                case "load":
                    if (state.cpu && state.memory) {
                        state.cpu.used = 100 - Math.round(payload.data.cpu.currentload_idle);
                        state.cpu.available = Math.round(payload.data.cpu.currentload_idle);

                        state.memory.load = Math.round((payload.data.memory.active * 100) / payload.data.memory.total);
                        state.memory.total = units(payload.data.memory.total);
                        state.memory.used = units(payload.data.memory.active);

                        for (let i = 0; i < state.cpu.history.length - 1; i++) {
                            state.cpu.history[i] = state.cpu.history[i + 1];
                            state.cpu.history[i][0] = i;

                            state.memory.history[i] = state.memory.history[i + 1];
                            state.memory.history[i][0] = `${i}`;
                        }

                        state.cpu.history[state.cpu.history.length - 1] = [state.cpu.history.length - 1, state.cpu.used];
                        state.memory.history[state.memory.history.length - 1] = [state.memory.history.length - 1, state.memory.load];
                    }

                    break;

                default:
                    state.streamed[payload.name] = payload.data;
                    break;
            }
        },

        search(state, query) {
            state.query = query;
        },

        last(state, results) {
            state.results = results;
        },

        category(state, data) {
            state.categories = data;
        },

        current(state, data) {
            state.weather = {
                date: new Date(),
                data
            }
        },

        future(state, data) {
            state.forecast = {
                date: new Date(),
                data
            }
        }
    }
});
