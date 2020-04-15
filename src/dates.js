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

export default class Dates {
    static today() {
        const date = new Date();

        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);

        return date;
    }

    static formatDate(value) {
        value = new Date(value);

        return `${value.getMonth() + 1}/${value.getDate()}/${value.getFullYear()}`;
    }

    static formatTime(value, seconds) {
        value = new Date(value);

        if (seconds) {
            return `${value.getHours() % 12 ? value.getHours() % 12 : 12}:${value.getMinutes() < 10 ? `0${value.getMinutes()}` : value.getMinutes()}:${value.getSeconds() < 10 ? `0${value.getSeconds()}` : value.getSeconds()} ${value.getHours() >= 12 ? "PM" : "AM"}`;
        } else {
            return `${value.getHours() % 12 ? value.getHours() % 12 : 12}:${value.getMinutes() < 10 ? `0${value.getMinutes()}` : value.getMinutes()} ${value.getHours() >= 12 ? "PM" : "AM"}`;
        }
    }

    static formatSqlDate(value) {
        value = new Date(value);

        return `${value.getFullYear()}-${Data.pad(value.getMonth() + 1)}-${Data.pad(value.getDate())}`;
    }

    static formatSqlDateTime(value) {
        value = new Date(value);

        return `${value.getFullYear()}-${Data.pad(value.getMonth() + 1)}-${Data.pad(value.getDate())} ${Data.pad(value.getHours())}:${Data.pad(value.getMinutes())}:00`;
    }

    static toIso(date) {
        date = new Date(date);

        return `${date.getFullYear()}-${Data.pad(date.getMonth() + 1)}-${Data.pad(date.getDate())}T${Data.pad(date.getHours())}:${Data.pad(date.getMinutes())}`;
    }

    static timePeriod(date) {
        date = new Date(date);

        if (date.getHours() < 12) {
            return "morning";
        } else if (date.getHours() < 18) {
            return "afternoon";
        } else {
            return "evening";
        }
    }

    static season(date) {
        date = new Date(date);

        switch(date.getMonth() + 1) {
            case 12:
            case 1:
            case 2:
                return "winter";

            case 3:
            case 4:
            case 5:
                return "spring";

            case 6:
            case 7:
            case 8:
                return "summer";

            default:
                return "fall";
        }
    }

    static ordinal(value) {
        value = parseInt(value, 10);

        if (Number.isNaN(value) || value <= 0) {
            return "";
        }

        if (value % 10 === 1 && value % 100 !== 11) {
            return "st";
        }

        if (value % 10 === 2 && value % 100 !== 12) {
            return "nd";
        }

        if (value % 10 === 3 && value % 100 !== 13) {
            return "rd";
        }

        return "th";
    }

    static addHours(date, hours) {
        const value = new Date(date);

        value.setTime(value.getTime() + (hours * 60 * 60 * 1000));

        return value;
    }

    static addDays(date, days) {
        return Dates.addHours(date, (days * 24));
    }

    static firstOfTheMonth(date) {
        date = new Date(date);

        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    static lastOfTheMonth(date) {
        const value = new Date(date);

        value.setMonth(value.getMonth() + 1);

        return Dates.addDays(this.first(value), -1);
    }

    static getSunday(date) {
        const day = new Date(date);

        return new Date(day.setDate(day.getDate() - day.getDay() + (day.getDay() === 0 ? -6 : 1) - 1));
    }

    static getMinCacheTime() {
        return Dates.formatSqlDateTime(new Date());
    }

    static getWeekDayName(value) {
        value = new Date(value);

        let day = null;

        if (Object.prototype.toString.call(value) === "[object Date]") {
            day = value.getDay();
        } else if (Number.isInteger(parseInt(value, 10))) {
            day = parseInt(value, 10);
        }

        if (!Number.isInteger(day)) {
            return "";
        }

        switch (day % 7) {
            case 1:
                return "monday";

            case 2:
                return "tuesday";

            case 3:
                return "wednesday";

            case 4:
                return "thursday";

            case 5:
                return "friday";

            case 6:
                return "saturday";

            default:
                return "sunday";
        }
    }

    static getMonthName(value) {
        value = new Date(value);

        let month = null;

        if (Object.prototype.toString.call(value) === "[object Date]") {
            month = value.getMonth();
        } else if (Number.isInteger(parseInt(value, 10))) {
            month = parseInt(value, 10);
        }

        if (!Number.isInteger(month)) {
            return "";
        }

        switch (month % 12) {
            case 1:
                return "february";

            case 2:
                return "march";

            case 3:
                return "april";

            case 4:
                return "may";

            case 5:
                return "june";

            case 6:
                return "july";

            case 7:
                return "august";

            case 8:
                return "september";

            case 9:
                return "october";

            case 10:
                return "november";

            case 11:
                return "december";

            default:
                return "january";
        }
    }

    static displayDate(date) {
        date = new Date(date);

        const now = new Date();

        if (now.getFullYear() === date.getFullYear()) {
            return `${Dates.getMonthName(date)} ${date.getDate()}`;
        }

        return `${Dates.getMonthName(date)} ${date.getDate()} ${date.getFullYear()}`;
    }

    static getAgeDisplay(date) {
        date = new Date(date);

        if (date && date instanceof Date) {
            const age = new Date() - date;
            const future = age < 0;

            if (Math.abs(age) < 60000) {
                return "Now";
            }

            if (Math.abs(age) < 3600000 && Math.abs(age) >= 120000) {
                return `${future ? "In " : ""}${Math.floor(Math.abs(age) / 60000)} minutes${future ? "" : " ago"}`;
            }

            if (Math.abs(age) < 3600000) {
                return `${future ? "In " : ""}${Math.floor(Math.abs(age) / 60000)} minute${future ? "" : " ago"}`;
            }

            if (Math.abs(age) < 86400000 && Math.abs(age) >= 7200000) {
                return `${future ? "In " : ""}${Math.floor(Math.abs(age) / 3600000)} hours${future ? "" : " ago"}`;
            }

            if (Math.abs(age) < 86400000) {
                return `${future ? "In " : ""}${Math.floor(Math.abs(age) / 3600000)} hour${future ? "" : " ago"}`;
            }

            if (age > 0 && age < 604800000 && age >= 172800000) {
                return `${Math.floor(Math.abs(age) / 86400000)} days ago`;
            }

            if (age > 0 && age < 604800000) {
                return `${Math.floor(Math.abs(age) / 86400000)} day ago`;
            }
        }

        return "";
    }

    static getDateRange(date, hours) {
        date = new Date(date);

        const now = new Date().getTime();

        let start = Dates.addHours(date, hours * -1);
        let end = new Date(date);

        if (date > now) {
            start = Dates.addHours(now, hours * -1);
            end = new Date(now);
        }

        return {
            start,
            end
        };
    }

    static latestDate(date1, date2) {
        date1 = new Date(date1);
        date2 = new Date(date2);

        if (date2 && date2 !== "") {
            const latest = new Date(date2);

            if (!date1 || latest > date1) {
                return new Date(latest);
            }
        }

        return date1;
    }
}
