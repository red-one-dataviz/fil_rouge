let line1;
let line2;
let circles;

// set the dimensions and margins of the graph
let margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

let marginSc = {top: 20, right: 20, bottom: 30, left: 50},
    widthSc = 600 - marginSc.left - marginSc.right,
    heightSc = 300 - marginSc.top - marginSc.bottom;

// parse the date / time
let parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

// set the ranges
let x = d3.scaleTime().range([0, width]);
let y = d3.scaleLinear().range([height, 0]);

// set the ranges
let xSc = d3.scaleLinear().range([0, widthSc]);
let ySc = d3.scaleLinear().range([heightSc, 0]);

// define the 1st line
let valueline = d3.line()
    .x(function(d) { return x(d["date time"] ); })
    .y(function(d) { return y(d["fuel flow"] ); });

// define the 2nd line
let valueline2 = d3.line()
    .x(function(d) { return x(d["date time"] ); })
    .y(function(d) { return y(d["altitude"] ); });

let brush = d3.brushX()
    .extent([[0,0], [width, height]])
    .on("brush end", brushed);

let brushSc = d3.brush()
    .extent([[0,0], [widthSc, heightSc]])
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

let context = svg.append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// SCATTER PLOT
// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
let svgSc = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

svgSc .append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", widthSc)
    .attr("height", heightSc);

let contextSc  = svgSc .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.csv("data.csv", function(error, data) {
    console.log(data);
    if (error) throw error;

    // format the data
    data.forEach(function(d) {
        d["date time"] = parseTime(d["date time"]);
        d["fuel flow"] = +d["fuel flow"];
        d["altitude"] = +d["altitude"];
    });

    // LINE CHART
    // Scale the range of the data
    x.domain(d3.extent(data, function(d) { return d["date time"] ; }));
    y.domain([0, d3.max(data, function(d) {
        return Math.max(d["fuel flow"] , d["altitude"] ); })]);

    // SCATTER PLOT
    // Scale the range of the data
    xSc.domain([0, d3.max(data, function(d) {
        return d["fuel flow"]; })]);
    ySc.domain([0, d3.max(data, function(d) {
        return d["altitude"]; })]);

    // LINE CHART
    // Add the valueline path.
    line1= context.append("path")
        .data([data])
        .attr("class", "line")
        .attr("clip-path", "url(#clip)")
        .style("stroke", "steelblue")
        .attr("d", valueline);

    // Add the valueline2 path.
    line2 = context.append("path")
        .data([data])
        .attr("class", "line")
        .attr("clip-path", "url(#clip)")
        .style("stroke", "indianred")
        .attr("d", valueline2);

    // Add the X Axis
    context.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add the Y Axis
    context.append("g")
        .call(d3.axisLeft(y));

    context.append("g")
        .attr("class", "brush")
        .call(brush);

    // SCATTER PLOT
    circles  = contextSc.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", function (d) {
            return xSc(d["fuel flow"]);
        })
        .attr("cy", function (d) {
            return ySc(d["altitude"]);
        })
        .attr("r", 4)
        .attr("fill", "mediumaquamarine");

    // Add the X Axis
    contextSc.append("g")
        .attr("transform", "translate(0," + heightSc + ")")
        .call(d3.axisBottom(xSc));

    // Add the Y Axis
    contextSc.append("g")
        .call(d3.axisLeft(ySc));

    contextSc.append("g")
        .attr("class", "brush")
        .call(brushSc);

});

function colorSelectedPts(lims) {
    circles.attr("fill", function (d) {
        if(x(d["date time"]) >= lims[0] && x(d["date time"]) <= lims[1]) {
            return "mediumaquamarine";
        } else {
            return "gray";
        }
    })
}

function colorSelectedSegment(lims) {
    //TODO
    console.log("kikoo brush");
    console.log(lims)
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