import Chartkick from "chartkick";
import DeepEqual from "deep-equal";
import DeepMerge from "deepmerge";

let chartId = 1;

let createComponent = function (Vue, tagName, chartType) {
    let chartProps = [
        "adapter",
        "colors",
        "curve",
        "dataset",
        "decimal",
        "discrete",
        "donut",
        "download",
        "label",
        "legend",
        "library",
        "max",
        "messages",
        "min",
        "points",
        "prefix",
        "refresh",
        "stacked",
        "suffix",
        "thousands",
        "title",
        "xmax",
        "xmin",
        "xtitle",
        "ytitle"
    ];

    Vue.component(tagName, {
        props: [
            "data",
            "id",
            "width",
            "height"
        ].concat(chartProps),

        render: function (createElement) {
            return createElement("div", {
                attrs: {
                    id: this.chartId
                },
                style: this.chartStyle
            }, [
                "Loading..."
            ]);
        },

        data: function () {
            return {
                chartId: null
            };
        },

        computed: {
            chartStyle: function () {
                this.data;
                this.chartOptions;

                return {
                    height: this.height || "300px",
                    lineHeight: this.height || "300px",
                    width: this.width || "100%",
                    textAlign: "center",
                    fontSize: "14px",
                    fontFamily: "'Lucida Grande', 'Lucida Sans Unicode', Verdana, Arial, Helvetica, sans-serif"
                };
            },

            chartOptions: function () {
                let options = {};
                let props = chartProps;

                for (let i = 0; i < props.length; i++) {
                    let prop = props[i];

                    if (this[prop] !== undefined) {
                        options[prop] = this[prop];
                    }
                }

                return options;
            }
        },

        created: function () {
            this.chartId = this.chartId || this.id || (`chart-${chartId += 1}`);
        },

        mounted: function () {
            this.updateChart();
            this.savedState = this.currentState();
        },

        updated: function () {
            let currentState = this.currentState();

            if (!DeepEqual(currentState, this.savedState)) {
                this.updateChart();
                this.savedState = currentState;
            }
        },

        beforeDestroy: function () {
            if (this.chart) {
                this.chart.destroy();
            }
        },

        methods: {
            updateChart: function () {
                if (this.data !== null) {
                    if (this.chart) {
                        this.chart.updateData(this.data, this.chartOptions);
                    } else {
                        this.chart = new chartType(this.chartId, this.data, this.chartOptions);
                    }
                } else if (this.chart) {
                    this.chart.destroy();
                    this.chart = null;
                    this.$el.innerText = "Loading...";
                }
            },

            currentState: function () {
                return DeepMerge({}, {
                    data: this.data,
                    chartOptions: this.chartOptions
                });
            }
        }
    });
}

Chartkick.version = "0.5.2";

Chartkick.install = function (Vue, options) {
    if (options && options.adapter) {
        Chartkick.addAdapter(options.adapter);
    }

    createComponent(Vue, "line-chart", Chartkick.LineChart);
    createComponent(Vue, "pie-chart", Chartkick.PieChart);
    createComponent(Vue, "column-chart", Chartkick.ColumnChart);
    createComponent(Vue, "bar-chart", Chartkick.BarChart);
    createComponent(Vue, "area-chart", Chartkick.AreaChart);
    createComponent(Vue, "scatter-chart", Chartkick.ScatterChart);
    createComponent(Vue, "geo-chart", Chartkick.GeoChart);
    createComponent(Vue, "timeline", Chartkick.Timeline);
}

export default Chartkick;
