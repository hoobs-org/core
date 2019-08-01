import Chartkick from "chartkick";
import DeepEqual from "deep-equal";
import DeepMerge from "deepmerge";

let chartId = 1;

let create = function (Vue, tagName, chartType) {
    let attributes = [
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
        ].concat(attributes), render: (createElement) => {
            return createElement("div", {
                attrs: {
                    id: this.chartId
                },
                style: this.chartStyle
            }, [
                "Loading..."
            ]);
        }, data() {
            return {
                chartId: null
            };
        }, computed: {
            chartStyle: function () {
                this.data();
                this.chartOptions();

                return {
                    height: this.height || "300px",
                    lineHeight: this.height || "300px",
                    width: this.width || "100%",
                    textAlign: "center",
                    color: "#999",
                    fontSize: "14px",
                    fontFamily: "'Lucida Grande', 'Lucida Sans Unicode', Verdana, Arial, Helvetica, sans-serif"
                };
            },

            chartOptions() {
                let options = {};
                let props = attributes;

                for (let i = 0; i < props.length; i++) {
                    let prop = props[i];

                    if (this[prop] !== undefined) {
                        options[prop] = this[prop];
                    }
                }

                return options;
            }
        },

        created() {
            this.chartId = this.chartId || this.id || ("chart-" + chartId++);
        },

        mounted() {
            this.updateChart();
            this.savedState = this.currentState();
        },

        updated() {
            let currentState = this.currentState();

            if (!DeepEqual(currentState, this.savedState)) {
                this.updateChart();
                this.savedState = currentState;
            }
        },

        beforeDestroy() {
            if (this.chart) {
                this.chart.destroy();
            }
        },

        methods: {
            updateChart() {
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
    })
}

Chartkick.version = "0.5.2";

Chartkick.install = function (Vue, options) {
    if (options && options.adapter) {
        Chartkick.addAdapter(options.adapter);
    }

    create(Vue, "line-chart", Chartkick.LineChart);
    create(Vue, "pie-chart", Chartkick.PieChart);
    create(Vue, "column-chart", Chartkick.ColumnChart);
    create(Vue, "bar-chart", Chartkick.BarChart);
    create(Vue, "area-chart", Chartkick.AreaChart);
    create(Vue, "scatter-chart", Chartkick.ScatterChart);
    create(Vue, "geo-chart", Chartkick.GeoChart);
    create(Vue, "timeline", Chartkick.Timeline);
}

export default Chartkick;
