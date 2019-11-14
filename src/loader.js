class Loader {
    constructor(logo, title, background) {
        this.logo = logo;
        this.title = title;
        this.background = background;

        this.loading = false;
    }

    load() {
        this.loading = false;

        window.location.reload();
    }

    write(system) {
        if (!this.loading) {
            this.loading = true;

            document.write(`
                <!DOCTYPE html>
                <html>
                
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>${this.title}</title>
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
                            fill: #fff
                        }
                
                        .logo-stroke {
                            fill: none;
                            stroke: #fff;
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
                            background: #ffffff42;
                        }
                    
                        .marquee div {
                            position: absolute;
                            width: 40%;
                            margin: 0;
                            height: 3px;
                            background: #fff;
                            -moz-animation: loading-marquee 2s linear infinite alternate;
                            -webkit-animation: loading-marquee 2s linear infinite alternate;
                            animation: loading-marquee 2s linear infinite alternate;
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
                    </div>
                </body>
                
                </html>
            `);
        }
    }
}

export default function (logo, title, background) {
    return new Loader(logo, title, background);
}