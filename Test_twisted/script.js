// TODO - sale, refaire la gestion de la concurrence
var mySocket;
window.addEventListener("load", function() {
    // Crée l'instance WebSocket
    mySocket = new WebSocket("ws://localhost:9000");
    // Ecoute pour les messages arrivant
    mySocket.onmessage = function (event) {
        // Message reçu
        console.log("Reçu : ");
        console.log(JSON.parse(event.data));
        fillPC(JSON.parse(event.data));
    };

});

var margin = {top: 30, right: 10, bottom: 10, left: 10},
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

function fillPC(data) {
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
    x.domain(dimensions = d3.keys(data[0]).filter(function (d) {
        if(d != 'indexFile'){ //TO BE IMPROVED (REMI IS CRYING)
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

    console.log(data)
    console.log(toShow)

    // Add blue foreground lines for focus.
    foreground = svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
//        .data(data)
        .data(data)
        .enter().append("path")
        .attr("class", function (d, i) {
            var index = limits.findIndex(function (x) {
                return x > i;
            });
//                console.log(i, index, limits[index], colorClasses[index - 1]);
            // TODO Faire un modulo pour rester dans le tableau
            // attention au mod en js
            return colorClassesPath[index - 1];
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
        .each(function (d) {
            d3.select(this).call(d3.axisLeft(y[d]));
        })
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function (d) {
            return d;
        })
        .style("font-size", "20px")
        .attr("transform", " translate(0,0)");


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
// TODO refaire propre avec objets au lieu de 2 tableaux
//var colorClassesPath = [
//    "limePath",
//    "deepSkyBluePath",
//    "hotPinkPath",
//    "orangePath"
//];
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

var dropContainer = document.getElementById("dropContainer");
var uploadBtn = document.getElementById("uploadBtn");
var uploadFile = document.getElementById("uploadFile");
var btnAddFile = document.getElementById("addFile");


var btnStart = document.getElementById("startPlot");
var toShow = new Set();

dropContainer.ondragover = dropContainer.ondragenter = function (evt) {
    evt.preventDefault();
};

uploadBtn.onchange = function () {
    uploadFile.value = this.value;
};

dropContainer.ondrop = function (evt) {
    fileInput.files = evt.dataTransfer.files;
    evt.preventDefault();
};

//btnAddFile.addEventListener("pointerdown", addFile, false);
btnAddFile.addEventListener("click", addFile, false);
btnStart.addEventListener("click", plotSelectedFiles, false)

var listFilesBody = document.querySelector("#listFiles tbody")

function addFile(e) {
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
                    for (var j = 0, len = data.length; j < len; j++) {
                        data[j].indexFile = idxFile;
                    }
                    console.log("Data formatted : ");
                    console.log(data);
                    // TODO Faire plus rapidement avec une propriété supp sur les points
                    // a exclure lors de la construction des axes
                    // uniquement pour le styling
                    // Un peu dégueu
                    limits.push(limits[limits.length - 1] + data.length);
                    dataAll = dataAll.concat(data);
                    var info = {
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


function addRowToList(info) {
    // TODO Rajouter des class sur les colonnes
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.innerHTML = info.name;

    const tdNbLines = document.createElement("td");
    tdNbLines.innerHTML = info.nbLines;

    const tdColor = document.createElement("td");
    tdColor.classList.add(colorClasses[info.indexFile]);

    tr.appendChild(tdName);
    tr.appendChild(tdNbLines);
    tr.appendChild(tdColor);

    // Add CheckBox
    const tdCheckBox = document.createElement("input");
    tdCheckBox.type = "checkbox";
    var key = "cb_" + info.indexFile;
    tdCheckBox.id = key;
    tdCheckBox.checked = true
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
    btnBin.innerHTML = "Remove"
    btnBin.clicked = false;
    btnBin.addEventListener("click", function(e){
        dataAll = dataAll.filter(el => (el.indexFile !== info.indexFile));
        document.getElementById("graphSpace").innerHTML = "";
        dataToShow = dataAll.filter(el => toShow.has(el.indexFile));
        mySocket.send(JSON.stringify(dataToShow));
    });


    tr.appendChild(tdCheckBox)
    tr.appendChild(btnBin);

    listFilesBody.appendChild(tr)
}

function plotSelectedFiles(e){
// TODO : plot selected files from checkboxes
    document.getElementById("graphSpace").innerHTML = "";
    dataToShow = dataAll.filter(el => toShow.has(el.indexFile));
    mySocket.send(JSON.stringify(dataToShow));

}