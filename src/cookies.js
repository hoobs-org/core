import Request from "axios";

export default class Cookies {
    static set(name, value, minutes) {
        const date = new Date();

        date.setTime(date.getTime() + (minutes * 60000));

        document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
    }

    static get(name) {
        name = `${name}=`;

        const cookies = decodeURIComponent(document.cookie).split(";");

        for(var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];

            while (cookie.charAt(0) === " ") {
                cookie = cookie.substring(1);
            }
            
            if (cookie.indexOf(name) === 0) {
                const value = cookie.substring(name.length, cookie.length);

                if (!value || value === "" || value === "null") {
                    return null;
                } else {
                    return value;
                }
            }
        }
        
        return null;
    }

    static validate(api) {
        return new Promise((resolve) => {
            Request.defaults.headers.get["Authorization"] = Cookies.get("token");

            Request.get(`${api}/api/auth/validate`).then((response) => {
                resolve(response.data.valid);
            }).catch(() => {
                resolve(false);
            });
        });
    }
}
