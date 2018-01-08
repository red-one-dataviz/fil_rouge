let circles;

// set the dimensions and margins of the graph
let margin = {top: 20, right: 50, bottom: 50, left: 50},
    width = 960 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

let marginSc = {top: 20, right: 20, bottom: 50, left: 50},
    widthSc = 600 - marginSc.left - marginSc.right,
    heightSc = 300 - marginSc.top - marginSc.bottom;

// parse the date / time
let parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
let formatTime = d3.timeFormat("%Y-%m-%d %H:%M:%S");

// set the ranges
let x = d3.scaleTime().range([0, width]);
// let y = d3.scaleLinear().range([height, 0]);
let yLeft = d3.scaleLinear().range([height, 0]);
let yRight = d3.scaleLinear().range([height, 0]);

// set the ranges
let xSc = d3.scaleLinear().range([0, widthSc]);
let ySc = d3.scaleLinear().range([heightSc, 0]);

let tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

let brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on("brush end", brushed);

let brushSc = d3.brush()
    .extent([[0, 0], [widthSc, heightSc]])
    .on("brush end", brushedSc);

// LINE CHART
// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
let svg = d3.select("body").append("svg")
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
let tipBox;

// CHECKBOX
function createCheckbox(){
    let checkbox = document.getElementById('checkbox');
    checkbox.type = "checkbox";
    checkbox.name = "name";
    checkbox.id = "idCheckbox";
    checkbox.checked = false;
}

createCheckbox();
let checked = false;

// SCATTER PLOT
// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
let svgSc = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

svgSc.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", widthSc)
    .attr("height", heightSc);

let contextSc = svgSc.append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.csv("data.csv", function (error, data) {
    console.log(data);
    if (error) throw error;

    // let domain = {},
    let traits = d3.keys(data[0]).filter(function (d) {
        return d !== "date time";
    });
    // n = traits.length;

    // format the data
    data.forEach(function (d) {
        d["date time"] = parseTime(d["date time"]);
        d[traits[0]] = +d[traits[0]];
        d[traits[1]] = +d[traits[1]];
    });
    // traits.forEach(function(trait) {
    //     domain[trait] = d3.extent(data, function(d) { return d[trait]; });
    // });


    // LINE CHART
    // Scale the range of the data
    x.domain(d3.extent(data, function (d) {
        return d["date time"];
    }));
    // y.domain([0, d3.max(data, function(d) {
    //     return Math.max(d[traits[0]] , d[traits[1]] ); })]);

    yLeft.domain([0, d3.max(data, function (d) {
        return d[traits[0]];
    })]);
    yRight.domain([0, d3.max(data, function (d) {
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
    xSc.domain([0, d3.max(data, function (d) {
        return d[traits[0]];
    })]);
    ySc.domain([0, d3.max(data, function (d) {
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

    context.append("g")
        .attr("class", "brush")
        .call(brush);

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

    document.getElementById("idCheckbox").addEventListener("click", function(e) {
        if (checked === false) {
            console.log("Tooltip");
            tipBox = context.append('rect')
                .attr('width', width)
                .attr('height', height)
                .attr('opacity', 0)
                .on('mousemove', drawTooltip)
                .on('mouseout', removeTooltip);
            checked = true;
        } else{
            console.log("Brush");
            tipBox.remove();
            checked = false;
        }
    });

    // SCATTER PLOT
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

    // Add the X Axis
    contextSc.append("g")
        .attr("transform", "translate(0," + heightSc + ")")
        .attr("class", "firstAxis")
        .call(d3.axisBottom(xSc));

    // text label for the x axis
    contextSc.append("text")
        .attr("transform",
            "translate(" + (widthSc / 2) + " ," +
            (heightSc + marginSc.top + 20) + ")")
        .style("text-anchor", "middle")
        .attr("class", "firstLabel")
        .text(traits[0]);

    // Add the Y Axis
    contextSc.append("g")
        .attr("class", "secondAxis")
        .call(d3.axisLeft(ySc));

    // text label for the y axis
    contextSc.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginSc.left)
        .attr("x", 0 - (heightSc / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("class", "secondLabel")
        .text(traits[1]);

    contextSc.append("g")
        .attr("class", "brush")
        .call(brushSc);


    // TOOLTIP FUNCTIONS
    function removeTooltip() {
        if (tooltip) tooltip.style('display', 'none');
        if (tooltipLine) tooltipLine.attr('stroke', 'none').style("opacity", 0);
    }

    function drawTooltip() {
        let datetime = x.invert(d3.mouse(tipBox.node())[0]);

        let datetimeCompare = formatTime(datetime);

        tooltipLine.attr('stroke', 'white')
            .attr('x1', x(datetime))
            .attr('x2', x(datetime))
            .attr('y1', 0)
            .attr('y2', height)
            .style("opacity", 0.9);

        tooltip.html(formatTime(datetime))
            .style("opacity", .9)
            .style("display", "block")
            .style("left", (d3.event.pageX + 20) + "px")
            .style("top", (d3.event.pageY - 20) + "px")
            .selectAll()
            .data(data).enter()
            .append('div')
            .html(d => formatTime(d["date time"]) === datetimeCompare ? traits[0] + " : " + d[traits[0]] : null)
            .append('div')
            .html(d => formatTime(d["date time"]) === datetimeCompare ? traits[1] + " : " + d[traits[1]] : null);
    }

});

function colorSelectedPts(lims) {
    circles.attr("fill", function (d) {
        if (x(d["date time"]) >= lims[0] && x(d["date time"]) <= lims[1]) {
            return "orange";
        } else {
            return "gray";
        }
    })
}

function colorSelectedSegment(lims) {
    //TODO
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
    // console.log(intervals);

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
    // let lims = selection.map(a => x.invert(a));
    // console.log(lims);
    // colorSelectedPts(lims)
    colorSelectedPts(selection)
}

function brushedSc() {
    let selection = d3.event.selection || [0, widthSc];
    colorSelectedSegment(selection)
}