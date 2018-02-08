import fillWithDefault from "./defaultOptions.js";

const defaultOptions = {
    opacity: 0.5,
    colorScatter: "orange",
    width: 800,
    height: 325
};

class LineChartScatterPlot {
    constructor(id, data, cols, options = {}) {
        this.div = d3.select("#" + id);
        this.data = data;
        let opts = fillWithDefault(options, defaultOptions, true);
        console.log(opts);
        this.opacity = opts.opacity;
        this.colorScatter = opts.colorScatter;
        this.margin = {top: 20, right: 50, bottom: 50, left: 50};
        this.width = opts.width - this.margin.left - this.margin.right;
        this.height = opts.height - this.margin.top - this.margin.bottom;

        this.traits = cols;
        this.instanciateSupport();
        this.fillLCSP(this.data);
    }

    get xAxis() {
        return this.traits[0];
    }

    get yAxis() {
        return this.traits[1];
    }

    instanciateSupport() {
        console.log(this);

        this.container = this.div.append("div")
            .attr("class", "lcsp")
            .style("width", this.width + this.margin.left + this.margin.right + "px")
            .style("height", this.height + this.margin.top + this.margin.bottom + "px");


    }

    fillLCSP(data) {
        let width = this.width;
        let height = this.height;
        let margin = this.margin;
        let traits = this.traits;
        let circles;

        // parse the date / time
        let parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
        let formatTime = d3.timeFormat("%Y-%m-%d %H:%M:%S");

        for (let d of data) {
            d["date time"] = parseTime(d["date time"]);
        }

        // set the ranges
        let x = d3.scaleTime().range([0, width]);
        let yLeft = d3.scaleLinear().range([height, 0]);
        let yRight = d3.scaleLinear().range([height, 0]);

        // set the ranges
        let xSc = d3.scaleLinear().range([0, width]);
        let ySc = d3.scaleLinear().range([height, 0]);

        let tooltip = this.div.append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        let brush = d3.brushX()
            .extent([[0, 0], [width, height]])
            .on("brush end", brushed);

        let brushSc = d3.brush()
            .extent([[0, 0], [width, height]])
            .on("brush end", brushedSc);

        // GRIDS
        // gridlines in x axis function
        function make_x_gridlines(x0) {
            return d3.axisBottom(x0)
                .ticks(5)
        }

        // gridlines in y axis function
        function make_y_gridlines(y0) {
            return d3.axisLeft(y0)
                .ticks(5)
        }

        // LINE CHART
        // append the svg object to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin

        d3.selectAll(".svgTemp").remove();

        let svg = this.container.append("svg")
            .attr("class", "svgTemp")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        let contextBack = svg.append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        let context = svg.append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        let tooltipLine = context.append('line');


        // SCATTER PLOT
        // append the svg object to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        let svgSc = this.container.append("svg")
            .attr("class", "svgTemp")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        svgSc.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        let contextSc = svgSc.append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        let drawTooltip;

        // format the data
        data.forEach(function (d) {
            // d["date time"] = parseTime(d["date time"]);
            d[traits[0]] = +d[traits[0]];
            d[traits[1]] = +d[traits[1]];
        });


        // LINE CHART
        // Scale the range of the data
        x.domain(d3.extent(data, function (d) {
            return d["date time"];
        }));

        yLeft.domain([d3.min(data, function (d) {
            return d[traits[0]];
        }), d3.max(data, function (d) {
            return d[traits[0]];
        })]);
        yRight.domain([d3.min(data, function (d) {
            return d[traits[1]];
        }), d3.max(data, function (d) {
            return d[traits[1]];
        })]);

        // define the 1st line
        let valueline = d3.line()
            .x(function (d) {
                return x(d["date time"]);
            })
            .y(function (d) {
                return yLeft(d[traits[0]]);
            });

        // define the 2nd line
        let valueline2 = d3.line()
            .x(function (d) {
                return x(d["date time"]);
            })
            .y(function (d) {
                return yRight(d[traits[1]]);
            });

        // SCATTER PLOT
        // Scale the range of the data
        xSc.domain([d3.min(data, function (d) {
            return d[traits[0]];
        }), d3.max(data, function (d) {
            return d[traits[0]];
        })]);
        ySc.domain([d3.min(data, function (d) {
            return d[traits[1]];
        }), d3.max(data, function (d) {
            return d[traits[1]];
        })]);

        // LINE CHART
        // Add the valueline path.
        context.append("path")
            .data([data])
            .attr("class", "line")
            .attr("clip-path", "url(#clip)")
            .style("stroke", "hotpink")
            .attr("d", valueline);

        // Add the valueline2 path.
        context.append("path")
            .data([data])
            .attr("class", "line")
            .attr("clip-path", "url(#clip)")
            .style("stroke", "lime")
            .attr("d", valueline2);

        // Add the X Axis
        context.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // text label for the x axis
        context.append("text")
            .attr("transform",
                "translate(" + (width / 2) + " ," +
                (height + margin.top + 20) + ")")
            .style("text-anchor", "middle")
            .text("date time");

        // Add the Y Axis
        context.append("g")
            .attr("class", "firstAxis")
            .call(d3.axisLeft(yLeft));

        // Add the Y Axis to the right
        context.append("g")
            .attr("transform", "translate( " + width + ", 0 )")
            .attr("class", "secondAxis")
            .call(d3.axisRight(yRight));


        // text label for the y axis
        context.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("class", "firstLabel")
            .text(traits[0]);

        context.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", width + margin.right / 2 + 5)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("class", "secondLabel")
            .text(traits[1]);

        // SCATTER PLOT
        // Add the X Axis
        contextSc.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("class", "firstAxis")
            .call(d3.axisBottom(xSc));

        // add the X gridlines
        contextSc.append("g")
            .attr("class", "grid")
            .attr("transform", "translate(0," + height + ")")
            .call(make_x_gridlines(xSc)
                .tickSize(-height)
                .tickFormat("")
            );

        // text label for the x axis
        contextSc.append("text")
            .attr("transform",
                "translate(" + (width / 2) + " ," +
                (height + margin.top + 20) + ")")
            .style("text-anchor", "middle")
            .attr("class", "firstLabel")
            .text(traits[0]);

        // Add the Y Axis
        contextSc.append("g")
            .attr("class", "secondAxis")
            .call(d3.axisLeft(ySc));

        // add the Y gridlines
        contextSc.append("g")
            .attr("class", "grid")
            .call(make_y_gridlines(ySc)
                .tickSize(-width)
                .tickFormat("")
            );

        // text label for the y axis
        contextSc.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("class", "secondLabel")
            .text(traits[1]);

        contextSc.append("g")
            .attr("class", "brush")
            .call(brushSc);

        circles = contextSc.selectAll("circle")
            .data(data)
            .enter().append("circle")
            .attr("cx", function (d) {
                return xSc(d[traits[0]]);
            })
            .attr("cy", function (d) {
                return ySc(d[traits[1]]);
            })
            .attr("r", 4)
            .attr("fill", "orange");

        // TOOLTIP FUNCTIONS
        function removeTooltip() {
            if (tooltip) tooltip.style('display', 'none');
            if (tooltipLine) tooltipLine.attr('stroke', 'none').style("opacity", 0);
        }

        drawTooltip = function () {
            // console.log(event);
            let x_mouse = d3.mouse(tippi.node())[0];
            // let x_mouse = event.offsetX;
            let datetime = x.invert(d3.mouse(tippi.node())[0]);

            let datetimeCompare = formatTime(datetime);

            let minD = data[0];
            let min = Math.abs(x(minD["date time"]) - x_mouse);
            for (let d of data) {
                let val = Math.abs(x(d["date time"]) - x_mouse);
                if (val < min) {
                    min = val;
                    minD = d;
                }
            }

            tooltipLine.attr('stroke', 'white')
                .attr('x1', x(minD["date time"]))
                .attr('x2', x(minD["date time"]))
                .attr('y1', 0)
                .attr('y2', height)
                .style("opacity", 0.9);

            tooltip.html(formatTime(datetime))
                .style("opacity", .9)
                .style("display", "block")
                .style("left", (d3.event.pageX + 20) + "px")
                .style("top", (d3.event.pageY - 20) + "px")
                .append('div')
                .html(traits[0] + " : " + minD[traits[0]])
                .append('div')
                .html(traits[1] + " : " + minD[traits[1]]);
        };

        let tippi = context.append("g")
            .on('mousemove', drawTooltip)
            .on('mouseout', removeTooltip)
            .attr("class", "brush")
            .call(brush);

        function colorSelectedPts(lims) {
            circles.attr("class", function (d) {
                return (x(d["date time"]) >= lims[0] && x(d["date time"]) <= lims[1]) ? "colored" : "uncolored";
            });

            document.querySelectorAll(".colored").forEach(function(el) {
                el.parentNode.appendChild(el);
            });

            //     .attr("fill", function (d) {
            //     if (x(d["date time"]) >= lims[0] && x(d["date time"]) <= lims[1]) {
            //         return "orange";
            //     } else {
            //         return "gray";
            //     }
            // })
        }

        function colorSelectedSegment(lims) {
            let x0 = lims[0][0],
                x1 = lims[1][0],
                y0 = lims[0][1],
                y1 = lims[1][1];

            let brushed = circles.filter(function () {
                let cx = d3.select(this).attr("cx"),
                    cy = d3.select(this).attr("cy");

                return (x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1);
            });

            // Dates arrays. We suppose they are sorted
            let s = brushed._groups[0].map(u => x(u.__data__["date time"]));
            let all = circles._groups[0].map(u => x(u.__data__["date time"]));

            // console.log(s.length, all.length);
            // console.log(all);

            let j = 0;
            let intervals = [];

            let debut = -1;
            let fin = -1;
            for (let i = 0; i < all.length; i++) {
                if (all[i] === s[j]) {
                    if (debut === -1) {
                        debut = i === 0 ? all[i] : (all[i] + all[i - 1]) / 2;
                    }
                    fin = i === all.length - 1 ? all[i] : (all[i] + all[i + 1]) / 2;
                    j++;
                } else {
                    if (debut !== -1) {
                        intervals.push({deb: debut, fin: fin});
                        debut = -1;
                        fin = -1;
                    }
                }
            }
            if (debut !== -1) {
                intervals.push({deb: debut, fin: fin});
            }

            let rectTimes = contextBack.selectAll(".rectTime");
            rectTimes.remove();
            for (let inter of intervals) {
                contextBack.append("rect")
                    .attr("class", "rectTime")
                    .attr("x", inter.deb)
                    .attr("y", 0)
                    .attr("width", inter.fin - inter.deb)
                    .attr("height", height)
            }
        }


        function brushed() {
            let selection = d3.event.selection || [0, width];
            colorSelectedPts(selection);
            drawTooltip();
        }

        function brushedSc() {
            let selection = d3.event.selection || [0, width];
            colorSelectedSegment(selection)
        }
    }

}

export default LineChartScatterPlot;