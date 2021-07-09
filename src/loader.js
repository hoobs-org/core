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

class Loader {
    constructor(logo, foreground, background) {
        this.logo = logo;

        this.foreground = foreground;
        this.background = background;

        this.loading = false;
    }

    load() {
        this.loading = false;

        window.location.reload();
    }

    write(title, message) {
        if (!this.loading) {
            this.loading = true;

            document.body.innerHTML = "";

            document.write(`
                <!DOCTYPE html>
                <html>
                
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>HOOBS</title>
                    <style>
                        body {
                            margin: 0;
                            background-color: ${this.background};
                        }
                
                        .content {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            flex-direction: column;
                            height: 100vh;
                        }
                
                        .logo {
                            max-width: 90vw;
                        }
                
                        .logo-fill {
                            fill: ${this.foreground}
                        }
                
                        .logo-stroke {
                            fill: none;
                            stroke: ${this.foreground};
                            stroke-width: 4;
                            stroke-miterlimit: 10;
                        }
                
                        .marquee {
                            overflow: hidden;
                            position: relative;
                            width: 450px;
                            max-width: 90vw;
                            height: 3px;
                            margin: 20px 0 50px 0;
                            background: ${this.foreground}42;
                        }
                    
                        .marquee div {
                            position: absolute;
                            width: 40%;
                            margin: 0;
                            height: 3px;
                            background: ${this.foreground};
                            -moz-animation: loading-marquee 2s linear infinite alternate;
                            -webkit-animation: loading-marquee 2s linear infinite alternate;
                            animation: loading-marquee 2s linear infinite alternate;
                        }

                        .loading-title {
                            color: ${this.foreground};
                            font-size: 27px;
                            font-family: sans-serif;
                            text-align: center;
                        }

                        .loading-message {
                            color: ${this.foreground};
                            font-size: 17px;
                            font-family: sans-serif;
                            text-align: center;
                            max-width: 300px;
                            margin-top: 7px;
                            opacity: 0.5;
                        }
                    
                        @-moz-keyframes loading-marquee {
                            0% {
                                -moz-transform: translateX(280%);
                            }
                    
                            100% {
                                -moz-transform: translateX(-140%);
                            }
                        }
                    
                        @-webkit-keyframes loading-marquee {
                            0% {
                                -webkit-transform: translateX(280%);
                            }
                    
                            100% {
                                -webkit-transform: translateX(-140%);
                            }
                        }
                    
                        @keyframes loading-marquee {
                            0% {
                                -moz-transform: translateX(280%);
                                -webkit-transform: translateX(280%);
                                transform: translateX(280%);
                            }
                    
                            100% {
                                -moz-transform: translateX(-140%);
                                -webkit-transform: translateX(-140%);
                                transform: translateX(-140%);
                            }
                        }
                    </style>
                </head>
                
                <body>
                    <div class="content">
                        <div>${this.logo}</div>
                        <div class="marquee">
                            <div></div>
                        </div>
                        <div class="loading-title">${title || ""}</div>
                        <div class="loading-message">${message || ""}</div>
                    </div>
                </body>
                
                </html>
            `);
        } else {
            const elements = {
                title: document.querySelector(".loading-title"),
                message: document.querySelector(".loading-message")
            };

            if (elements.title && title && title !== "") elements.title.innerHTML = title === "null" ? "" : title;
            if (elements.message && message && message !== "") elements.message.innerHTML = message === "null" ? "" : message;
        }
    }
}

export default function (logo, foreground, background) {
    return new Loader(logo, foreground, background);
}