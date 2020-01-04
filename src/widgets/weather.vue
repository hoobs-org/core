<template>
    <div v-if="weather && forecast" id="weather">
        <div class="current-weather">
            <span class="current-title">{{ $t(forecastDay(new Date())) }}</span>
            <span class="current-time">{{ formatTime(new Date()) }}</span>
            <div class="current-weather-icon" :class="`wi wi-day-${icon[weather.data.weather[0].id].icon}`"></div>
            <span class="current-description">{{ $t(icon[weather.data.weather[0].id].label) }}</span>
            <span class="current-temp">{{ Math.round(weather.data.main.temp) }}°</span>
        </div>
        <div class="details">
            <div class="detail-contents">
                <span class="detail-title">{{ $t("forecast") }}</span>
            </div>
            <div class="forecast">
                <div v-for="(day, index) in forecast.data.list" :key="index">
                    <div v-if="isNoon(openWeatherDate(day.dt_txt))" class="forecast-weather">
                        <span class="forecast-title">{{ $t(forecastDay(openWeatherDate(day.dt_txt))) }}</span>
                        <div class="forecast-weather-icon" :class="`wi wi-day-${icon[day.weather[0].id].icon}`"></div>
                        <span class="forecast-description">{{ $t(icon[day.weather[0].id].label) }}</span>
                        <span class="forecast-temp">{{ Math.round(day.main.temp) }}°</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="actions">
            <router-link to="/config/interface" class="icon">settings</router-link>
        </div>
    </div>
</template>

<script>
    import "../assets/weather-icons.css";

    import Request from "jsonp";
    import Dates from "../dates";
    import WeatherIcons from "../weather-icons.json";

    export default {
        name: "weather",

        props: {
            item: Object,
            index: Number,
            change: Function
        },

        data() {
            return {
                units: "imperial",
                toggleIcon: "toggle_on"
            }
        },

        computed: {
            weather() {
                return this.$store.state.weather;
            },

            forecast() {
                return this.$store.state.forecast;
            },

            icon() {
                return WeatherIcons;
            }
        },

        async mounted() {
            if (!this.weather || !this.weather.date || new Date().getTime() - this.weather.date.getTime() >= 900000) {
                this.loadWeather(await this.getQuery());
            }

            if (!this.forecast || !this.forecast.date || new Date().getTime() - this.forecast.date.getTime() >= 900000) {
                this.loadForecast(await this.getQuery());
            }
        },

        methods: {
            loadWeather(query) {
                Request(`https://api.openweathermap.org/data/2.5/weather?${query}&units=${this.$client.temp_units === "celsius" ? "metric" : "imperial"}&appid=${atob("ZmVjNjdiNTVmN2Y3NGRlYWEyOGRmODliYTZhNjA4MjE=")}`, null, (error, response) => {
                    if (!error) {
                        this.$store.commit("current", response);
                    }
                });
            },

            loadForecast(query) {
                Request(`https://api.openweathermap.org/data/2.5/forecast?${query}&units=${this.$client.temp_units === "celsius" ? "metric" : "imperial"}&appid=${atob("ZmVjNjdiNTVmN2Y3NGRlYWEyOGRmODliYTZhNjA4MjE=")}`, null, (error, response) => {
                    if (!error) {
                        this.$store.commit("future", response);
                    }
                });
            },

            forecastDay(value) {
                return Dates.getWeekDayName(value);
            },

            formatTime(value) {
                return Dates.formatTime(value);
            },

            isNoon(value) {
                const date = new Date(value);

                if (date.getHours() === 12 && date.getMinutes() === 0) {
                    return true;
                }

                return false;
            },

            openWeatherDate(value) {
                const p = value.split(" ");
                const d = p[0].split("-");
                const t = p[1].split(":");

                const year = parseInt(d[0], 10);
                const month = parseInt(d[1], 10) - 1;
                const date = parseInt(d[2], 10);

                const hour = parseInt(t[0], 10);
                const minute = parseInt(t[1], 10);
                const second = parseInt(t[2], 10);

                return new Date(year, month, date, hour, minute, second);
            },

            getQuery() {
                return new Promise((resolve) => {
                    const query = this.$cookie("weather_query");

                    if (query && query !== "undefined" && query !== "") {
                        return resolve(query.replace(/\|/gi, "="));
                    }

                    let results;

                    if (this.$client.longitude && this.$client.latitude && !Number.isNaN(parseFloat(this.$client.latitude)) && !Number.isNaN(parseFloat(this.$client.longitude))) {
                        const position = {
                            latitude: Math.round(parseFloat(this.$client.latitude) * 10 ) / 10,
                            longitude: Math.round(parseFloat(this.$client.longitude) * 10 ) / 10
                        }

                        Request(`https://api.openweathermap.org/data/2.5/find?lat=${position.latitude}&lon=${position.longitude}&cnt=10&appid=${atob("ZmVjNjdiNTVmN2Y3NGRlYWEyOGRmODliYTZhNjA4MjE=")}`, null, (error, response) => {
                            if (!error && response.list && Array.isArray(response.list) && response.list.length > 0) {
                                results = `id|${response.list[0].id}`;
                            } else {
                                results = `lat|${position.latitude}&lon=${position.longitude}`;
                            }

                            this.$cookie("weather_query", results, 20160);

                            return resolve(results.replace(/\|/gi, "="));
                        });
                    } else if (this.$client.country_code && this.$client.postal_code && this.$client.country_code !== "" && this.$client.postal_code !== "") {
                        if (this.$client.country_code === "CA") {
                            return resolve(`zip=${(`${this.$client.postal_code}000`).substring(0, 3)},CA`);
                        } else {
                            return resolve(`zip=${this.$client.postal_code},${this.$client.country_code}`);
                        }
                    } else {
                        this.geolocation().then((position) => {
                            position.latitude = Math.round(parseFloat(position.latitude) * 10 ) / 10,
                            position.longitude = Math.round(parseFloat(position.longitude) * 10 ) / 10;

                            Request(`https://api.openweathermap.org/data/2.5/find?lat=${position.latitude}&lon=${position.longitude}&cnt=10&appid=${atob("ZmVjNjdiNTVmN2Y3NGRlYWEyOGRmODliYTZhNjA4MjE=")}`, null, (error, response) => {
                                if (!error && response.list && Array.isArray(response.list) && response.list.length > 0) {
                                    results = `id|${response.list[0].id}`;
                                } else {
                                    results = `lat|${position.latitude}&lon=${position.longitude}`;
                                }

                                this.$cookie("weather_query", results, 20160);

                                return resolve(results.replace(/\|/gi, "="));
                            });
                        });
                    }
                });
            },

            geolocation() {
                return new Promise((resolve) => {
                    const latitude = parseFloat(this.$cookie("latitude"));
                    const longitude = parseFloat(this.$cookie("longitude"));

                    if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
                        resolve({
                            latitude,
                            longitude
                        });
                    } else {
                        const position = {
                            latitude: 40.59,
                            longitude: -105.08
                        };

                        Request("http://ip-api.com/json/", null, (error, response) => {
                            if (!error) {
                                this.$cookie("latitude", response.lat, 20160);
                                this.$cookie("longitude", response.lon, 20160);

                                position.latitude = response.lat;
                                position.longitude = response.lon;
                            }

                            resolve(position);
                        });
                    }
                });
            }
        }
    };
</script>

<style scoped>
    #weather {
        height: 100%;
        padding: 0 20px;
        display: flex;
        align-content: center;
        align-items: center;
        justify-content: space-between;
        position: relative;
        cursor: default;
    }

    #weather .current-weather {
        width: 200px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        align-content: center;
        box-sizing: border-box;
    }

    #weather .current-weather-icon {
        font-size: 60px;
        line-height: 100px;
        color: var(--title-text);
    }

    #weather .current-title {
        font-weight: bold;
        font-size: 20px;
        color: var(--title-text);
    }
    
    #weather .current-description {
        font-weight: bold;
        font-size: 20px;
    }

    #weather .current-temp {
        font-weight: bold;
        font-size: 28px;
    }

    #weather .current-time {
        margin: 0 0 10px 0;
    }

    #weather .details {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    #weather .details .detail-contents {
        display: flex;
        border-bottom: 1px var(--border) solid;
        justify-content: space-around;
        margin: 0 0 20px 0;
        padding: 0 20px 10px 20px;
    }

    #weather .detail-title {
        font-weight: bold;
        font-size: 18px;
        color: var(--title-text);
    }

    #weather .forecast {
        flex: 1;
        display: flex;
        justify-content: space-between;
        padding: 0 20px 0 0;
        overflow: auto;
    }

    #weather .forecast-weather {
        width: 100px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        align-content: center;
        box-sizing: border-box;
    }

    #weather .forecast-weather-icon {
        font-size: 40px;
        line-height: 80px;
        color: var(--title-text);
    }

    #weather .forecast-title {
        font-weight: bold;
        font-size: 14px;
    }
    
    #weather .forecast-description {
        font-weight: bold;
        font-size: 12px;
    }

    #weather .forecast-temp {
        font-weight: bold;
        font-size: 18px;
    }

    #weather .actions {
        font-size: 14px;
        position: absolute;
        top: 20px;
        right: 20px;
        display: flex;
        align-content: center;
        align-items: center;
        user-select: none;
    }

    #weather .actions .icon,
    #weather .actions a:link {
        font-size: 18px;
        color: var(--text) !important;
        text-decoration: none !important;
    }
</style>
