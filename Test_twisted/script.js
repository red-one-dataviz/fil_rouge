// TODO - sale, refaire la gestion de la concurrence
let mySocket;
let dropContainer;
let uploadBtn;
let uploadFile;
let btnStart;
let btnLineChart;
let drawSelectedAxis;
let slider;
let valOpa;
let listColSelectedName;
let listColSelected

window.addEventListener("load", function() {
    // Crée l'instance WebSocket
    mySocket = new WebSocket("ws://localhost:9000");
    // Ecoute pour les messages arrivant
    mySocket.onmessage = function (event) {
        var res = JSON.parse(event.data);
        var time = Date.now() - res.date;
        // Message reçu
        console.log("Reçu : ");
        console.log(res);
        console.log("Traitement de la requète en " + time + " ms");
        if(res.task === "preprocess") {
            fillPC(res.data);
        }
    };
    dropContainer = document.getElementById("dropContainer");
    uploadBtn = document.getElementById("uploadBtn");
    uploadFile = document.getElementById("uploadFile");
    // btnAddFile = document.getElementById("addFile");
    slider = document.getElementById("range");
    valOpa = document.getElementById("valOpa");

    btnStart = document.getElementById("startPlot");
    listFilesBody = document.querySelector("#listFiles tbody");
    listColSelectedName = document.querySelector("#colSelected thead");
    listColSelected = document.querySelector("#colSelected tbody");
    btnLineChart = document.getElementById("btnLineChart");

    dropContainer.ondragover = dropContainer.ondragenter = function (evt) {
        evt.preventDefault();
    };

    uploadBtn.onchange = function (e) {
        uploadFile.value = uploadBtn.files.length > 1 ? uploadBtn.files.length + " files selected" : uploadBtn.files.length + " file selected";

        // Directly load data (no use of a button anymore)
        addFile(uploadBtn.files);
    };

    dropContainer.ondrop = function (evt) {
        uploadBtn.files = evt.dataTransfer.files;
        evt.preventDefault();

        // Directly load data (no use of a button anymore)
        // console.log(evt.dataTransfer.files);
        // addFile(evt.dataTransfer.files);
    };

    //btnAddFile.addEventListener("pointerdown", addFile, false);
    // btnAddFile.addEventListener("click", addFile, false);

    btnStart.addEventListener("click", plotSelectedFiles, false);
    valOpa.innerHTML = slider.value;

    slider.addEventListener("input", function() {
        if(parseInt(this.value) !== parseInt(valOpa.innerHTML)){
            valOpa.innerHTML = this.value;
            d3.selectAll(".foreground path:not(.notSelected)")
            .style("stroke-opacity", this.value / 100);
        }
    }, false);

    btnLineChart.addEventListener("click", createLineChart, false);

});

function createLineChart() {
    drawSelectedAxis();
}

let margin = {top: 110, right: 10, bottom: 10, left: 50},
    width = 1200 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

function fillPC(data) {
//    var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S")
    let parseTime = d3.timeParse("%H:%M:%S")
    for(let d of data){
        d["date time"] = parseTime(d["date time"]);
    }
    fillCells();
    let x = d3.scaleBand().rangeRound([0, width]).padding(1),
        y = {},
        dragging = {};

    let line = d3.line(),
        extents,
        background,
        foreground;


    let svg = d3.select("#graphSpace").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Extract the list of dimensions and create a scale for each.
    let dimensions = d3.keys(data[0]).filter(function (d, i) {
        // TODO - dégueux
        if(d === 'date time'){
            return(y[d] = d3.scaleTime()
                .domain(d3.extent(data, function (p) {
                    return p[d];
                }))
                .range([height, 15]));
        }
        if(d !== 'indexFile'){

            return (y[d] = d3.scaleLinear()
                .domain(d3.extent(data, function (p) {
                    return +p[d];
                }))
                .range([height, 15]));
        }
    });
    let index = dimensions.indexOf("date time");
    let t = dimensions[0];
    dimensions[0] = dimensions[index];
    dimensions[index] = t;
    x.domain(dimensions);

    extents = dimensions.map(function (p) {
        return [0, 0];
    });
    // TODO - background
    // // Add grey background lines for context.
    // background = svg.append("g")
    //     .attr("class", "background")
    //     .selectAll("path")
    //     .data(data)
    //     .enter().append("path")
    //     .attr("d", path);


    // Add blue foreground lines for focus.
    let idColor = 0;
    let lastId = data[0].indexFile;
    foreground = svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        //        .data(data)
        .data(data)
        .enter().append("path")
        .attr("class", function (d, i) {
            return metaData.pc.colors[d.indexFile];
        })
        .style("stroke-opacity", parseInt(valOpa.innerHTML)/100)
        .attr("d", path);

    // Add a group element for each dimension.
    console.log("DIMENSIONS");
    console.log(dimensions);

    let queueAxisLineChart = [];

    // TODO - pas super propre faire avec des classes !
    function addToQueue(text, d) {

        if (queueAxisLineChart.length >= 2) {
            let old = queueAxisLineChart.shift();
            old.text.style.fill = "white";
            queueAxisLineChart[0].text.style.fill = "hotpink";
        }
        queueAxisLineChart.push({
            text: text,
            d: d
        });
        if (queueAxisLineChart.length === 1) {
            text.style.fill = "hotpink";
        } else {
            text.style.fill = "lime";
            drawSelectedAxis();
        }

        // if (queueAxisLineChart.length === 2) {
        //
        // }
        // console.log(queueAxisLineChart)
    }

    let g = svg.selectAll(".dimension")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function (d) {
            return "translate(" + x(d) + ")";
        })
        .on('click', function(d) {
            console.log(event);
            addToQueue(event.target, d);
        })
        .call(d3.drag()
            .subject(function (d) {
                return {x: x(d)};
            })
            .on("start", function (d) {
                dragging[d] = x(d);
                // TODO - background
                // background.attr("visibility", "hidden");
            })
            .on("drag", function (d) {
                dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                foreground.attr("d", path);
                dimensions.sort(function (a, b) {
                    return position(a) - position(b);
                });
                x.domain(dimensions);
                g.attr("transform", function (d) {
                    return "translate(" + position(d) + ")";
                })
            })
            .on("end", function (d) {
                delete dragging[d];
                transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                transition(foreground).attr("d", path);
                // TODO - background
                // background
                //     .attr("d", path)
                //     .transition()
                //     .delay(500)
                //     .duration(0)
                //     .attr("visibility", null);
            }));


    // Add an axis and title.
    drawSelectedAxis = function() {
        let traits = [queueAxisLineChart[0].d, queueAxisLineChart[1].d];
        drawLineChart(data, traits);
    };

    g.append("g")
        .attr("class", "axis")
        .each(function (d, i) {
            let ax = d3.axisLeft(y[d]);
            if(d === "date time"){
                ax = d3.axisLeft(y[d]).tickFormat(d3.timeFormat("%H:%M:%S"));
//                ax = d3.axisLeft(y[d]).tickFormat(d3.timeFormat("%Y-%m-%d %H:%M:%S"));
            }
            d3.select(this).call(ax);
        })
        .append("text")
        // .style("text-anchor", "middle")
        .style("text-anchor", "start")
        .attr("y", -9)
        .text(function (d) {
            return d;
        })
        .style("font-size", "20px")
        // .attr("dx", "-.8em")
        // .attr("dy", "1.8em")
        // .attr("transform", " translate(0,0)");
        .attr("transform", "translate(0,10) rotate(-45)");


    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function (d) {
            d3.select(this)
                .call(y[d].brush = d3.brushY()
                    .extent([[-8, 0], [8, height]])
                    .on("brush start", brushstart)
                    .on("brush", brush_parallel_chart));
        })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);

    function position(d) {
        var v = dragging[d];
        return v == null ? x(d) : v;
    }

    function transition(g) {
        return g.transition().duration(500);
    }

    // Returns the path for a given data point.
    function path(d) {
        return line(dimensions.map(function (p) {
            return [position(p), y[p](d[p])];
        }));
    }

    function brushstart() {
        d3.event.sourceEvent.stopPropagation();
    }

    function brush_parallel_chart() {
        for (var i = 0; i < dimensions.length; ++i) {
            if (d3.event.target == y[dimensions[i]].brush) {
                extents[i] = d3.event.selection.map(y[dimensions[i]].invert, y[dimensions[i]]);

            }
        }

        foreground.attr("class", function (d) {
            return dimensions.every(function (p, i) {
                if (extents[i][0] == 0 && extents[i][0] == 0) {
                    return true;
                }
                return extents[i][1] <= d[p] && d[p] <= extents[i][0];
            }) ? metaData.pc.colors[d.indexFile] : "notSelected";
        });

        // TODO - background
        // foreground.style("display", function (d) {
        //     return dimensions.every(function (p, i) {
        //         if (extents[i][0] == 0 && extents[i][0] == 0) {
        //             return true;
        //         }
        //         return extents[i][1] <= d[p] && d[p] <= extents[i][0];
        //     }) ? null : "none";
        // });
    }
}

function drawLineChart(data, traits) {
    console.log(data);
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

    d3.selectAll(".svgTemp").remove();

    let svg = d3.select("body").append("svg")
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
    let svgSc = d3.select("body").append("svg")
        .attr("class", "svgTemp")
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

    let drawTooltip;

    // format the data
    data.forEach(function (d) {
        // d["date time"] = parseTime(d["date time"]);
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

    drawTooltip = function() {
        // console.log(event);
        let x_mouse = d3.mouse(tippi.node())[0];
        // let x_mouse = event.offsetX;
        let datetime = x.invert(d3.mouse(tippi.node())[0]);

        let datetimeCompare = formatTime(datetime);

        let minD = data[0];
        let min = Math.abs(x(minD["date time"]) - x_mouse);
        for(let d of data) {
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
        colorSelectedPts(selection);
        drawTooltip();
    }

    function brushedSc() {
        let selection = d3.event.selection || [0, widthSc];
        colorSelectedSegment(selection)
    }
}


let files = [];
let idxFile = 0;
let dataAll = [];
// TODO
let metaData= {};
metaData.pc = {};
metaData.pc.cellColors = {};


let colorClasses = [
    "lime",
    "deepSkyBlue",
    "hotPink",
    "orange"
];

// Attempt to create colorClassesPath
let colorClassesPath = colorClasses.slice(0);
for (let i=colorClassesPath.length; i--;) {
    colorClassesPath[i] = colorClasses[i] + "Path";
}

let limits = [0];


let filesToShow = new Set();
let colToShow = new Set();



function addFile(e) {

    // Parcourir les fichiers en input avec boucle
    let fin = idxFile + uploadBtn.files.length;
    for (let i = 0, len = uploadBtn.files.length; i < len; i++) {
        let file = uploadBtn.files[i];
        let reader = new FileReader();

        reader.onload = (function (theFile) {
            return function (e) {
                d3.csv(e.target.result, function (error, data) {
//                        fillPC(data);
                    //data_formatted = data;
                    for (let j = 0, len = data.length; j < len; j++) {
                        data[j].indexFile = idxFile;
                        //data[j].Datetime = parseTime(data[j].Datetime);
                    }
                    // TODO Faire plus rapidement avec une propriété supp sur les points
                    // a exclure lors de la construction des axes
                    // uniquement pour le styling
                    // Un peu dégueu
                    limits.push(limits[limits.length - 1] + data.length);
                    dataAll = dataAll.concat(data);
                    let info = {
                        'name': theFile.name,
                        'nbLines': data.length,
                        'data': data,
//                        'data': e.target.result,
                        'indexFile': idxFile
                    };
                    console.log(info);
                    files.push(info);
                    addRowToList(info);
                    idxFile++;
                });
            };
        })(file);
        reader.readAsDataURL(file);
    }
}

function sendPreprocessingRequest(data, colToShowArray) {
    let msg = {
        "task": "preprocess",
        "data": data,
        "date": Date.now(),
        "idReq": getIdReq(),
        "columns": colToShowArray
    };
    mySocket.send(JSON.stringify(msg));
}

let idReq = 0;

function getIdReq() {
    return idReq++;
}

function fillCells() {

    for (const prop in metaData.pc.cellColors) {
        if (metaData.pc.cellColors.hasOwnProperty(prop)) {
            metaData.pc.cellColors[prop].className = "";
        }
    }
    for (let id of filesToShow) {
        // TODO - on peut faire mieux que ça
        metaData.pc.cellColors[id].classList.add(metaData.pc.colors[id].slice(0, -4));
    }
}

function removeRow(id) {
    let trs = document.getElementsByClassName("affPc");
    for(let tr of trs) {
        if(tr.index === id) {
            tr.parentNode.removeChild(tr);
        }
    }
}

function selectColumns(info){
    const tr = document.createElement("tr");
    const trCB = document.createElement("tr");

    // Get column names
    let dimensions = d3.keys(info.data[0]);
    let index = dimensions.indexOf("date time");
    let t = dimensions[0];
    dimensions[0] = dimensions[index];
    dimensions[index] = t;

    for (let d of dimensions){
        colToShow.add(d);
        if (d != "indexFile"){
            const thFeature = document.createElement("th")
            thFeature.innerHTML = d;
            tr.appendChild(thFeature);

            // Add CheckBox
            const tdCheckBox = document.createElement("td");
            const checkBox = document.createElement("input");
            checkBox.type = "checkbox";
            checkBox.id = "cb_" + d;
            checkBox.checked = true;
            checkBox.addEventListener("click", function(e){
            console.log("clicking : " + d);
                if(colToShow.has(d)){
                    console.log("removing : "+ d);
                    colToShow.delete(d);
                }
                else{
                console.log("adding : " + d);
                    colToShow.add(d);
                    }
                });
            tdCheckBox.appendChild(checkBox)
            trCB.appendChild(tdCheckBox);

        }
    }

    listColSelectedName.appendChild(tr);
    listColSelected.appendChild(trCB);
}

function addRowToList(info) {
    // TODO Rajouter des class sur les colonnes
    const tr = document.createElement("tr");
    tr.index = info.indexFile;
    tr.className = "affPc";

    const tdName = document.createElement("td");
    tdName.innerHTML = info.name;

    const tdNbLines = document.createElement("td");
    tdNbLines.innerHTML = info.nbLines;

    const tdColor = document.createElement("td");
    // tdColor.classList.add(colorClasses[info.indexFile]);

    tr.appendChild(tdName);
    tr.appendChild(tdNbLines);
    tr.appendChild(tdColor);
    metaData.pc.cellColors[info.indexFile] = tdColor;

    // Add CheckBox
    const tdCheckBox = document.createElement("input");
    tdCheckBox.type = "checkbox";
    tdCheckBox.id = "cb_" + info.indexFile;
    tdCheckBox.checked = true;
    filesToShow.add(info.indexFile);
    tdCheckBox.addEventListener("click", function(e){
        if(filesToShow.has(info.indexFile)){
            filesToShow.delete(info.indexFile);
        }
        else{
            filesToShow.add(info.indexFile);
        }
    });

    // Add Bin
    const btnBin = document.createElement("button");
    btnBin.type = "button";
    btnBin.innerHTML = "Remove";
    btnBin.clicked = false;
    btnBin.addEventListener("click", function(e){
        dataAll = dataAll.filter(el => (el.indexFile !== info.indexFile));
        if(filesToShow.has(info.indexFile)){
            filesToShow.delete(info.indexFile);
        }
        removeRow(info.indexFile);
        // document.getElementById("graphSpace").innerHTML = "";
        // var dataToShow = dataAll.filter(el => filesToShow.has(el.indexFile));
        // mySocket.send(JSON.stringify(dataToShow));
    });


    tr.appendChild(tdCheckBox);
    tr.appendChild(btnBin);

    listFilesBody.appendChild(tr)

    if (info.indexFile === 0){
        selectColumns(info);
    }
}

function plotSelectedFiles(e){
    // TODO : plot selected files from checkboxes
    document.getElementById("graphSpace").innerHTML = "";
    metaData.pc.colors = {};
    let idColor = 0;
    filesToShow.forEach(function(key){
        metaData.pc.colors[key] = colorClassesPath[idColor];
        idColor = (idColor + 1) % colorClassesPath.length;
    });
    let dataToShow = dataAll.filter(el => filesToShow.has(el.indexFile));
    //mySocket.send(JSON.stringify(dataToShow));


    let colToShowArray = Array.from(colToShow);
    console.log(colToShowArray);
    console.log(dataToShow)
    sendPreprocessingRequest(dataToShow, colToShowArray);

}
