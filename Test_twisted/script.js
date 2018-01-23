// TODO - sale, refaire la gestion de la concurrence
var mySocket;
var dropContainer;
var uploadBtn;
var uploadFile;
var btnStart;
var btnAddFile;
var btnResample;
var slider;
var output_pourcentage;
var output_ligne_selec;

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
    btnAddFile = document.getElementById("addFile");

    btnStart = document.getElementById("startPlot");
    // btnResample = document.getElementById("resampleAllFiles");
    listFilesBody = document.querySelector("#listFiles tbody");
    listColSelectedName = document.querySelector("#colSelected thead");
    listColSelected = document.querySelector("#colSelected tbody");

    dropContainer.ondragover = dropContainer.ondragenter = function (evt) {
        evt.preventDefault();
    };
    uploadBtn.onchange = function (e) {
        uploadFile.value = uploadBtn.files.length > 1 ? uploadBtn.files.length + " files selected" : uploadBtn.files.length + " file selected";
    };
    dropContainer.ondrop = function (evt) {
        uploadBtn.files = evt.dataTransfer.files;
        evt.preventDefault();
    };

    slider = document.getElementById("myRange");
    output_pourcentage = document.getElementById("demo");
    output_pourcentage.innerHTML = slider.value; // Display the default slider value

    output_ligne_selec = document.getElementById("demo_ligne");
    output_ligne_selec.innerHTML = Math.trunc(slider.value * dataAll.length / 100);
// Update the current slider value (each time you drag the slider handle)
    slider.oninput = function() {
        output_pourcentage.innerHTML = this.value;
        output_ligne_selec.innerHTML = Math.trunc(this.value * dataAll.length / 100);
    }


    //btnAddFile.addEventListener("pointerdown", addFile, false);
    btnAddFile.addEventListener("click", addFile, false);

    btnStart.addEventListener("click", plotSelectedFiles, false);

});
var margin = {top: 110, right: 10, bottom: 10, left: 50},
    width = 1200 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

function fillPC(data) {
    var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S")
    for(let d of data){
        d["date time"] = parseTime(d["date time"]);
    }
    fillCells();
    var x = d3.scaleBand().rangeRound([0, width]).padding(1),
        y = {},
        dragging = {};

    var line = d3.line(),
        extents,
        background,
        foreground;


    var svg = d3.select("#graphSpace").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .call(d3.zoom().on("zoom", function(){
        svg.attr("transform", d3.event.transform)
        }))
        .append("g");

    // Extract the list of dimensions and create a scale for each.
    dimensions = d3.keys(data[0]).filter(function (d, i) {
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
    var idColor = 0;
    var lastId = data[0].indexFile;
    foreground = svg.append("g")
        // .attr("class", "foreground")
        .selectAll("path")
//        .data(data)
        .data(data)
        .enter().append("path")
        .attr("class", function (d, i) {
            return metaData.pc.colors[d.indexFile];
        })
        .attr("d", path);

    // Add a group element for each dimension.
    console.log("DIMENSIONS")
    console.log(dimensions)
    var g = svg.selectAll(".dimension")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function (d) {
            return "translate(" + x(d) + ")";
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

    g.append("g")
        .attr("class", "axis")
        .each(function (d, i) {
            let ax = d3.axisLeft(y[d]);
            if(d === "date time"){
                ax = d3.axisLeft(y[d]).tickFormat(d3.timeFormat("%Y-%m-%d %H:%M:%S"));
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


var files = [];
var idxFile = 0;
var dataAll = [];
// TODO
var metaData= {};
metaData.pc = {};
metaData.pc.cellColors = {};


var colorClasses = [
    "lime",
    "deepSkyBlue",
    "hotPink",
    "orange"
];

// Attempt to create colorClassesPath
var colorClassesPath = colorClasses.slice(0);
for (var i=colorClassesPath.length; i--;) {
    colorClassesPath[i] = colorClasses[i] + "Path";
}

var limits = [0];


var filesToShow = new Set();
var colToShow = new Set();



function addFile(e) {

    // Parcourir les fichiers en input avec boucle
    var fin = idxFile + uploadBtn.files.length;
    for (var i = 0, len = uploadBtn.files.length; i < len; i++) {
        var file = uploadBtn.files[i];
        var reader = new FileReader();

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
                    output_ligne_selec.innerHTML = Math.trunc(slider.value * dataAll.length / 100);
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

function sendPreprocessingRequest(data, colToShowArray,resampleValue) {
    var msg = {
        "task": "preprocess",
        "data": data,
        "date": Date.now(),
        "idReq": getIdReq(),
        "columns": colToShowArray,
        "resamplingNum": resampleValue
    };
    mySocket.send(JSON.stringify(msg));
}

var idReq = 0;

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
    let resampleValue = Math.trunc(slider.value * dataAll.length / 100);
    filesToShow.forEach(function(key){
        metaData.pc.colors[key] = colorClassesPath[idColor];
        idColor = (idColor + 1) % colorClassesPath.length;
    });
    let dataToShow = dataAll.filter(el => filesToShow.has(el.indexFile));
    //mySocket.send(JSON.stringify(dataToShow));


    let colToShowArray = Array.from(colToShow);

    console.log(colToShowArray);
    console.log(dataToShow)
    sendPreprocessingRequest(dataToShow, colToShowArray, resampleValue);

}
/*
function resampleAllFiles(e){
    // resample and plot graph
    document.getElementById("graphSpace").innerHTML = "";
    let resampleValue = slider.value;
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
    sendPreprocessingRequest(dataToShow, colToShowArray, resampleValue);
}
*/
