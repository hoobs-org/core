<template>
    <div v-if="weather && forecast" id="weather">
        <div class="current-weather">
            <span class="current-title">{{ $t("today") }}</span>
            <div class="current-weather-icon" :class="`wi wi-day-${icon[weather.data.weather[0].id].icon}`"></div>
            <span class="current-description">{{ $t(icon[weather.data.weather[0].id].label) }}</span>
            <span class="current-temp">{{ Math.round(weather.data.main.temp) }}°</span>
        </div>
        <div v-for="(day, index) in forecast.data.list" :key="index">
            <div v-if="isNoon(day.dt_txt)" class="forecast-weather">
                <span class="forecast-title">{{ $t(forecastDay(day.dt_txt)) }}</span>
                <div class="forecast-weather-icon" :class="`wi wi-day-${icon[day.weather[0].id].icon}`"></div>
                <span class="forecast-description">{{ $t(icon[day.weather[0].id].label) }}</span>
                <span class="forecast-temp">{{ Math.round(day.main.temp) }}°</span>
            </div>
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
            if (!this.weather || new Date().getTime() - this.weather.date.getTime() >= 3600000) {
                const position = await this.geolocation();

                Request(`https://api.openweathermap.org/data/2.5/weather?lat=${position.latitude}&lon=${position.longitude}&units=imperial&appid=${atob("ZmVjNjdiNTVmN2Y3NGRlYWEyOGRmODliYTZhNjA4MjE=")}`, null, (error, response) => {
                    if (!error) {
                        this.$store.commit("current", response);
                    }
                });
            }

            if (!this.forecast || new Date().getTime() - this.weather.date.getTime() >= 86400000) {
                const position = await this.geolocation();

                Request(`https://api.openweathermap.org/data/2.5/forecast?lat=${position.latitude}&lon=${position.longitude}&units=imperial&appid=${atob("ZmVjNjdiNTVmN2Y3NGRlYWEyOGRmODliYTZhNjA4MjE=")}`, null, (error, response) => {
                    if (!error) {
                        this.$store.commit("future", response);
                    }
                });
            }
        },

        methods: {
            forecastDay(value) {
                return Dates.getWeekDayName(value);
            },

            isNoon(value) {
                const date = new Date(value);

                if (date.getHours() === 12 && date.getMinutes() === 0) {
                    return true;
                }

                return false;
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
    }
    
    #weather .current-description {
        font-weight: bold;
        font-size: 20px;
    }

    #weather .current-temp {
        font-weight: bold;
        font-size: 28px;
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
</style>
