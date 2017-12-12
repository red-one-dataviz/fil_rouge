// TODO - sale, refaire la gestion de la concurrence
var mySocket;
var dropContainer;
var uploadBtn;
var uploadFile;
var btnStart;
var btnAddFile;

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
    listFilesBody = document.querySelector("#listFiles tbody");

    dropContainer.ondragover = dropContainer.ondragenter = function (evt) {
        evt.preventDefault();
    };
    uploadBtn.onchange = function (e) {
        console.log("onchange");
        console.log(e);
        console.log(this.value)
//        uploadFile.value = this.value;
        uploadFile.value = uploadBtn.files.length > 1 ? uploadBtn.files.length + " files selected" : uploadBtn.files.length + " file selected";

    };
    dropContainer.ondrop = function (evt) {
        // REALLY UGLY SORRY REMI :D
        console.log("ondrop");
        console.log(evt)
        console.log(uploadFile.value);

        uploadBtn.files = evt.dataTransfer.files;
        evt.preventDefault();
    };

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
//        d.Datetime = parseTime(d.Datetime);
        d["date time"] = parseTime(d["date time"]);
    }
    console.log("Beautiful data");
    console.log(data)
    console.log(metaData);
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
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Extract the list of dimensions and create a scale for each.
    x.domain(dimensions = d3.keys(data[0]).filter(function (d, i) {
        // TODO - dégueux
        console.log(i,d);
        if(d === 'date time'){
            return(y[d] = d3.scaleTime()
                .domain(d3.extent(data, function (p) {
                    return p[d];
                }))
                .range([height, 15]));
        }
        if(d !== 'indexFile'){ //TO BE IMPROVED (REMI IS CRYING)

            return (y[d] = d3.scaleLinear()
                .domain(d3.extent(data, function (p) {
                    return +p[d];
                }))
                .range([height, 15]));
        }
    }));

    extents = dimensions.map(function (p) {
        return [0, 0];
    });
    // Add grey background lines for context.
    background = svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("d", path);

    console.log(data);
    console.log(toShow);

    // Add blue foreground lines for focus.
    var idColor = 0;
    var lastId = data[0].indexFile;
    foreground = svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
//        .data(data)
        .data(data)
        .enter().append("path")
        .attr("class", function (d, i) {
            return metaData.pc.colors[d.indexFile];
        })
        .attr("d", path);
    //console.log(dimensions);

    // Add a group element for each dimension.
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
                background.attr("visibility", "hidden");
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
                background
                    .attr("d", path)
                    .transition()
                    .delay(500)
                    .duration(0)
                    .attr("visibility", null);
            }));


    //console.log(dimensions);
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

        foreground.style("display", function (d) {
            return dimensions.every(function (p, i) {
                if (extents[i][0] == 0 && extents[i][0] == 0) {
                    return true;
                }
                return extents[i][1] <= d[p] && d[p] <= extents[i][0];
            }) ? null : "none";
        });
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


var toShow = new Set();



function addFile(e) {
    console.log(uploadBtn.files);
    console.log("added !");
    console.log("Length of file input : " + uploadBtn.files.length);

    // Parcourir les fichiers en input avec boucle
    var fin = idxFile + uploadBtn.files.length;
    for (var i = 0, len = uploadBtn.files.length; i < len; i++) {
        var file = uploadBtn.files[i];
//            console.log(file);
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
                    console.log("Data formatted : ");
                    console.log(data);
                    // TODO Faire plus rapidement avec une propriété supp sur les points
                    // a exclure lors de la construction des axes
                    // uniquement pour le styling
                    // Un peu dégueu
                    limits.push(limits[limits.length - 1] + data.length);
                    dataAll = dataAll.concat(data);
                    let info = {
                        'name': theFile.name,
                        'nbLines': data.length,
                        'data': e.target.result,
                        'indexFile': idxFile
                    };
                    files.push(info);
                    addRowToList(info);
                    idxFile++;
                    // TODO On peut pas faire à la sortie du for car
                    // asynchrone, voir plus propre avec promesses.
                    if (idxFile === fin) {
                        // Eviter de clear all et de redessiner
                        //document.getElementById("graphSpace").innerHTML = "";
                        console.log(dataAll);
                        //mySocket.send(JSON.stringify(dataAll));
                        //fillPC(dataAll);
                    }
                });
            };
        })(file);
        reader.readAsDataURL(file);
    }
}

function sendPreprocessingRequest(data) {
    var msg = {
        "task": "preprocess",
        "data": data,
        "date": Date.now(),
        "idReq": getIdReq()
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
    for (let id of toShow) {
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
    toShow.add(info.indexFile);
    console.log("Update Checkbox");

    console.log(toShow);
    // Add eventListener
    tdCheckBox.addEventListener("click", function(e){
        if(toShow.has(info.indexFile)){
            toShow.delete(info.indexFile);
        }
        else{
            toShow.add(info.indexFile);
        }
        console.log(toShow);
    });

    // Add Bin
    const btnBin = document.createElement("button");
    btnBin.type = "button";
    btnBin.innerHTML = "Remove";
    btnBin.clicked = false;
    btnBin.addEventListener("click", function(e){
        dataAll = dataAll.filter(el => (el.indexFile !== info.indexFile));
        if(toShow.has(info.indexFile)){
            toShow.delete(info.indexFile);
        }
        removeRow(info.indexFile);
        // document.getElementById("graphSpace").innerHTML = "";
        // var dataToShow = dataAll.filter(el => toShow.has(el.indexFile));
        // mySocket.send(JSON.stringify(dataToShow));
    });


    tr.appendChild(tdCheckBox);
    tr.appendChild(btnBin);

    listFilesBody.appendChild(tr)
}

function plotSelectedFiles(e){
    // TODO : plot selected files from checkboxes
    document.getElementById("graphSpace").innerHTML = "";
    metaData.pc.colors = {};
    let idColor = 0;
    toShow.forEach(function(key){
        metaData.pc.colors[key] = colorClassesPath[idColor];
        idColor = (idColor + 1) % colorClassesPath.length;
    });
    dataToShow = dataAll.filter(el => toShow.has(el.indexFile));
    //mySocket.send(JSON.stringify(dataToShow));
    sendPreprocessingRequest(dataAll);

}
