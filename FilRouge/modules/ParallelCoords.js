import fillWithDefault from "./defaultOptions.js";

const defaultOptions = {
    progRendering: false,
    canvasRendering: false,
    filterAxis: true,
    swapAxis: false,
    opacity: 0.5,
    color: "lime",
    width: 1000,
    height: 500,
    lineWidth: 1.5
};

const color = d3.scaleOrdinal()
    .range(["#5DA5B3", "#D58323", "#DD6CA7", "#54AF52", "#8C92E8", "#E15E5A", "#725D82", "#776327", "#50AB84", "#954D56", "#AB9C27", "#517C3F", "#9D5130", "#357468", "#5E9ACF", "#C47DCB", "#7D9E33", "#DB7F85", "#BA89AD", "#4C6C86", "#B59248", "#D8597D", "#944F7E", "#D67D4B", "#8F86C2"]);


class ParallelCoords {
    constructor(id, data, options = {}) {
        this.div = d3.select("#" + id);
        this.data = data;
        // this.dimensions = dimensions;
        let opts = fillWithDefault(options, defaultOptions, true);
        this.progRendering = opts.progRendering;
        this.canvasRendering = opts.canvasRendering;
        this.filterAxis = opts.filterAxis;
        this.swapAxis = opts.swapAxis;
        this.opacity = opts.opacity;
        this.color = opts.color;
        console.log(this);
        this.margin = {top: 50, right: 100, bottom: 20, left: 100};
        this.width = opts.width - this.margin.left - this.margin.right;
        this.height = opts.height - this.margin.top - this.margin.bottom;
        this.innerHeight = this.height - 2;
        this.lineWidth = opts.lineWidth;
        this.instantiateSupport();
    }

    instantiateSupport() {
        let that = this;
        let devicePixelRatio = window.devicePixelRatio || 1;
        // let dimensions = this.dimensions;
        let width = this.width;
        let height = this.height;
        let margin = this.margin;

        let innerHeight = this.innerHeight;

        let data = this.data;
        data = d3.shuffle(data);

        let parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
        let formatTime = d3.timeFormat("%H:%M:%S");

        const types = {
            "Number": {
                key: "Number",
                coerce: function (d) {
                    return +d;
                },
                extent: d3.extent,
                within: function (d, extent, dim) {
                    return extent[0] <= dim.scale(d) && dim.scale(d) <= extent[1];
                },
                defaultScale: d3.scaleLinear().range([innerHeight, 0])
            },
            "String": {
                key: "String",
                coerce: String,
                extent: function (data) {
                    return data.sort();
                },
                within: function (d, extent, dim) {
                    return extent[0] <= dim.scale(d) && dim.scale(d) <= extent[1];
                },
                defaultScale: d3.scalePoint().range([0, innerHeight])
            },
            "Date": {
                key: "Date",
                coerce: function (d) {
                    return parseTime(d);
                    // return new Date(d);
                },
                extent: d3.extent,
                within: function (d, extent, dim) {
                    return extent[0] <= dim.scale(d) && dim.scale(d) <= extent[1];
                },
                defaultScale: d3.scaleTime().range([0, innerHeight])
            }
        };

        const dimensionsAll = [
            {
                key: "date_time",
                type: types["Date"],
                axis: d3.axisLeft().tickFormat(function (d) {
                    return formatTime(d);
                })
            },
            {
                key: "flight_time",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "take_off_switch",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "altitude",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "static_pressure",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "ground_speed",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "ind_air_speed",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "oat",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "n1_1",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "n2_1",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "nr",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "torque_1",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "tot_1",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "oil_pressure_1",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "oil_temp_1",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "fuel_flow",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "fuel_vol",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "power",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            },
            {
                key: "phase_no",
                type: types["Number"],
                scale: d3.scaleLinear().range([innerHeight, 0])
            }
        ];

        let dispKeys = [];
        for (let k in data[0]) {
            if (data[0].hasOwnProperty(k)) {
                dispKeys.push(k);
            }
        }

        let dimensions = [];
        for (let dim of dimensionsAll) {
            if (dispKeys.includes(dim.key)) {
                dimensions.push(dim);
            }
        }

        console.log(dimensions);

        this.container = this.div.append("div")
            .attr("class", "parcoords")
            .style("width", width + margin.left + margin.right + "px")
            .style("height", height + margin.top + margin.bottom + "px");

        this.svg = this.container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        this.canvas = this.container.append("canvas")
            .attr("width", width * devicePixelRatio)
            .attr("height", height * devicePixelRatio)
            .style("width", 2 * width + "px")
            .style("height", 2 * height + "px")
            .style("margin-top", margin.top + "px")
            .style("margin-left", margin.left + "px")
            .style("transform-origin", "0 0")
            .style("transform", "scale(0.5, 0.5)");

        let svg = this.svg;
        let canvas = this.canvas;
        let container = this.container;

        // let ctx = this.canvas.node().getContext("2d");
        // ctx.globalCompositeOperation = 'darken';
        // ctx.globalAlpha = this.opacity;
        // ctx.lineWidth = this.lineWidth;
        // ctx.scale(devicePixelRatio, devicePixelRatio);

        let ctx = canvas.node().getContext("2d");
        // ctx.globalCompositeOperation = 'source-over';
        ctx.globalCompositeOperation = 'darken';
        // ctx.globalAlpha = 1;
        ctx.globalAlpha = 0.15;
        ctx.lineWidth = 1;
        ctx.scale(devicePixelRatio, devicePixelRatio);

        let xscale = d3.scalePoint()
            .domain(d3.range(dimensions.length))
            .range([0, width]);

        let yAxis = d3.axisLeft();

        let axes = svg.selectAll(".axis")
            .data(dimensions)
            .enter().append("g")
            .attr("class", function (d) {
                return "axis " + d.key.replace(/ /g, "_");
            })
            .attr("transform", function (d, i) {
                return "translate(" + xscale(i) + ")";
            });

        data.forEach(function (d) {
            dimensions.forEach(function (p) {
                d[p.key] = d[p.key] === null ? null : p.type.coerce(d[p.key]);
            });

            // truncate long text strings to fit in data table
            for (let key in d) {
                if (d.hasOwnProperty(key)) {
                    if (d[key] && d[key].length > 35) d[key] = d[key].slice(0, 36);
                }
            }
        });

        // type/dimension default setting happens here
        dimensions.forEach((dim) => {
            if (!("domain" in dim)) {
                // detect domain using dimension type's extent function
                dim.domain = this.d3_functor(dim.type.extent)(data.map(function (d) {
                    return d[dim.key];
                }));
            }
            if (!("scale" in dim)) {
                // use type's default scale for dimension
                dim.scale = dim.type.defaultScale.copy();
            }
            dim.scale.domain(dim.domain);
        });

        let render = renderQueue(draw).rate(150);
        ctx.clearRect(0, 0, width, height);
        // ctx.globalAlpha = 1;
        ctx.globalAlpha = d3.min([0.85 / Math.pow(data.length, 0.3), 1]);
        render(data);


        axes.append("g")
            .each(function (d) {
                let renderAxis = "axis" in d
                    ? d.axis.scale(d.scale)  // custom axis
                    : yAxis.scale(d.scale);  // default axis
                d3.select(this).call(renderAxis);
            })
            .append("text")
            .attr("class", "title")
            .attr("text-anchor", "start")
            .text(function (d) {
                return "description" in d ? d.description : d.key;
            });

        // Add and store a brush for each axis.
        axes.append("g")
            .attr("class", "brush")
            .each(function (d) {
                d3.select(this).call(d.brush = d3.brushY()
                    .extent([[-10, 0], [10, height]])
                    .on("start", brushstart)
                    .on("brush", brush)
                    .on("end", brush)
                )
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);

        d3.selectAll(".axis.phase_no .tick text")
            .style("fill", color);

        // output.text(d3.tsvFormat(data.slice(0,24)));

        function project(d) {
            return dimensions.map(function (p, i) {
                // check if data element has property and contains a value
                if (
                    !(p.key in d) ||
                    d[p.key] === null
                ) {
                    return null;
                }

                return [xscale(i), p.scale(d[p.key])];
            });
        }

        function draw(d) {
            ctx.strokeStyle = color(d.phase_no);
            ctx.beginPath();
            let coords = project(d);
            coords.forEach(function (p, i) {
                // this tricky bit avoids rendering null values as 0
                if (p === null) {
                    // this bit renders horizontal lines on the previous/next
                    // dimensions, so that sandwiched null values are visible
                    if (i > 0) {
                        let prev = coords[i - 1];
                        if (prev !== null) {
                            ctx.moveTo(prev[0], prev[1]);
                            ctx.lineTo(prev[0] + 6, prev[1]);
                        }
                    }
                    if (i < coords.length - 1) {
                        let next = coords[i + 1];
                        if (next !== null) {
                            ctx.moveTo(next[0] - 6, next[1]);
                        }
                    }
                    return;
                }

                if (i === 0) {
                    ctx.moveTo(p[0], p[1]);
                    return;
                }

                ctx.lineTo(p[0], p[1]);
            });
            ctx.stroke();
        }

        function brushstart() {
            d3.event.sourceEvent.stopPropagation();
        }

        function brush() {
            render.invalidate();

            let actives = [];
            svg.selectAll(".axis .brush")
                .filter(function (d) {
                    return d3.brushSelection(this);
                })
                .each(function (d) {
                    actives.push({
                        dimension: d,
                        extent: d3.brushSelection(this)
                    });
                });

            let selection = {};
            for (let sel of actives) {
                selection[sel.dimension.key] = [
                    sel.dimension.scale.invert(sel.extent[0]),
                    sel.dimension.scale.invert(sel.extent[1])
                ];
            }

            that.selection = selection;

            let selected = data.filter(function (d) {
                if (actives.every(function (active) {
                        let dim = active.dimension;
                        // test if point is within extents for each active brush
                        return dim.type.within(d[dim.key], active.extent, dim);
                    })) {
                    return true;
                }
            });

            // show ticks for active brush dimensions
            // and filter ticks to only those within brush extents

            // svg.selectAll(".axis")
            //     .filter(function (d) {
            //         return actives.indexOf(d) > -1 ? true : false;
            //     })
            //     .classed("active", true)
            //     .each(function (dimension, i) {
            //         var extent = extents[i];
            //         d3.select(this)
            //             .selectAll(".tick text")
            //             .style("display", function (d) {
            //                 let value = dimension.type.coerce(d);
            //                 return dimension.type.within(value, extent, dimension) ? null : "none";
            //             });
            //     });
            //
            // // reset dimensions without active brushes
            // svg.selectAll(".axis")
            //     .filter(function (d) {
            //         return actives.indexOf(d) > -1 ? false : true;
            //     })
            //     .classed("active", false)
            //     .selectAll(".tick text")
            //     .style("display", null);


            ctx.clearRect(0, 0, width, height);
            // ctx.globalAlpha = 1;
            ctx.globalAlpha = d3.min([0.85 / Math.pow(selected.length, 0.3), 1]);
            render(selected);

            // output.text(d3.tsvFormat(selected.slice(0, 24)));
        }

    }

    d3_functor(v) {
        return typeof v === "function" ? v : function () {
            return v;
        };
    }
}

export default ParallelCoords;