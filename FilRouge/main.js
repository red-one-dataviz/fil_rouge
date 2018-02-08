// ************************* WEBSOCKET *************************
import LineChartScatterPlot from "./modules/LineChartScatterPlot.js";

let mySocket;

window.addEventListener("load", function () {
    // Crée l'instance WebSocket
    let addr = window.location.href.replace("http://", "").replace(":8080/", "");
    mySocket = new WebSocket("ws://" + addr + ":9000");
    // mySocket = new WebSocket("ws://localhost:9000");

    // Ecoute pour les messages arrivant
    mySocket.onmessage = function (event) {
        console.log(event);
        let res = JSON.parse(event.data);
        console.log(res);
        if (res.fct === "addSelectedFiles") {
            sendRequest("getListFiles");
            let filesTmp = [];
            if (res.data === "ok") {
                for (let i = 0, len = listSelectedFiles.length; i < len; i++) {
                    let file = listSelectedFiles[i];
                    console.log(i, file);
                    listAddedFiles.push(file);
                    let li = document.createElement("li");
                    li.className = "addedFile";
                    li.innerHTML = file.name;
                    displayAddedFiles.appendChild(li);
                    filesTmp.push(file);
                }
                for (let file of filesTmp) {
                    updateSelectedFilesList(file, false);
                }
                listSelectedFiles.length = 0;
                filesTmp.length = 0;
                let activeTrs = document.getElementsByClassName("trActive");
                let trs = [];
                for (let tr of activeTrs) {
                    trs.push(tr);
                }
                for (let tr of trs) {
                    tr.classList.toggle("trActive");
                    tr.classList.toggle("trDisabled");
                }
            }
        } else if (res.fct === "getListFiles") {
            console.log(res.data);
        } else if (res.fct === "getLCSPData") {
            fillLineChartScatterPlot(res.data.lcspData, res.data.lcspColumns);
        } else if (res.fct === "getColumnsLCSP") {
            createSelectAxis(res.data);
        }
    };
    // mySocket.onopen = function () {
    //     //TODO
    // }
});

function sendRequest(name, data, ...args) {
    let msg = {
        "fct": name,
        "data": data || [],
        "args": args
    };
    mySocket.send(JSON.stringify(msg));
    console.log("Request sent at : ", Date.now());
}

// ************************* OPEN CITY *************************

function openCity(evt, cityName) {
    // Declare all variables
    let i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened the tab
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
}

// ************************* ADD DATA *************************
window.addEventListener("load", main);

let listSelectedFiles = [];
let listAddedFiles = [];
let displaySelectedFiles;
let displayAddedFiles;
let filesToLi = {};
let listFilesIdx = [];

function main() {
    setupTabs();
    setupListeners();
    setUpOptions();
}

function setupTabs() {
    let addFilesTab = document.getElementById("addFilesTab");
    let drawParallelCoordinatesTab = document.getElementById("drawParallelCoordinatesTab");
    let drawLineChartScatterPlotTab = document.getElementById("drawLineChartScatterPlotTab");

    addFilesTab.addEventListener("click", function (ev) {
        openCity(event, 'addFiles');
    });

    drawParallelCoordinatesTab.addEventListener("click", function (ev) {
        openCity(event, 'Paris');
    });

    drawLineChartScatterPlotTab.addEventListener("click", function (ev) {
        openCity(event, 'drawLineChartScatterPlot');
        askLCSPData(listFilesIdx);
    });
}

function setupListeners() {
    let importFolder = document.getElementById("import");
    let table = document.getElementById("fileList");
    displaySelectedFiles = document.getElementById("selectedFiles");
    displayAddedFiles = document.getElementById("addedFiles");
    let addSelectedFiles = document.getElementById("addSelectedFiles");

    importFolder.addEventListener("change", function (ev) {
        let files = ev.path[0].files;
        console.log(files);
        fillFileList(files, table);

    });

    addSelectedFiles.addEventListener("click", function (ev) {
        readAndSendSelectedFiles(listSelectedFiles);
        // sendRequest("addSelectedFiles", "cookie");

    });
}

function setUpOptions() {
    let sideNav = document.getElementById("openSideNav");
    let closeNav = document.getElementById("closeNav");

    sideNav.addEventListener("click", function (ev) {
        document.getElementById("mySidenav").style.width = "250px";
        // document.getElementById("lscpContainer").style.marginLeft = "250px";
    });

    closeNav.addEventListener("click", function (ev) {
        document.getElementById("mySidenav").style.width = "0";
    });
}


function readAndSendSelectedFiles(files) {
    let dataAll = [];
    let nbFiles = 0;
    for (let i = 0, len = files.length; i < len; i++) {
        let file = files[i];
        let reader = new FileReader();


        reader.onload = (function (theFile) {
            return function (e) {
                d3.csv(e.target.result, function (error, data) {
                    for (let d of data) {
                        d["idxFile"] = theFile.name;
                    }
                    listFilesIdx.push(theFile.name);
                    dataAll = dataAll.concat(data);
                    nbFiles++;
                    if (nbFiles === files.length) {
                        sendRequest("addSelectedFiles", JSON.stringify(dataAll));
                    }
                });
            };
        })(file);
        reader.readAsDataURL(file);
    }
}

function updateSelectedFilesList(file, val) {
    if (val) {
        listSelectedFiles.push(file);
        let li = document.createElement("li");
        li.className = "addedFile";
        li.innerHTML = file.name;
        displaySelectedFiles.appendChild(li);
        filesToLi[file.name] = li;
    } else {
        let idx = listSelectedFiles.indexOf(file);
        listSelectedFiles.splice(idx, 1);
        let liToRM = filesToLi[file.name];
        console.log(liToRM);
        console.log(filesToLi);
        displaySelectedFiles.removeChild(liToRM);
    }
}

function fillFileList(files, table) {
    let oldTbody = table.querySelector("tbody");
    if (oldTbody) {
        oldTbody.parentElement.removeChild(oldTbody);
    }


    let tbody = document.createElement("tbody");
    table.appendChild(tbody);
    let tr = document.createElement("tr");
    tr.className = "fileInfo";

    let td = document.createElement("td");

    for (let file of files) {
        let tri = tr.cloneNode(false);
        tri.addEventListener("mousedown", function () {
            if (!tri.classList.contains("trDisabled")) {
                let toggle = tri.classList.toggle("trActive");
                console.log(toggle);
                updateSelectedFilesList(file, toggle);
            }
        });
        let tdName = td.cloneNode(false);
        let tdType = td.cloneNode(false);
        let tdSize = td.cloneNode(false);
        let tdDate = td.cloneNode(false);
        tdName.className = "nameInfo";
        tdType.className = "typeInfo";
        tdSize.className = "sizeInfo";
        tdDate.className = "dateInfo";
        tdName.innerHTML = file.name;
        tdType.innerHTML = file.type;
        tdSize.innerHTML = file.size;
        tdDate.innerHTML = file.lastModifiedDate;
        tri.appendChild(tdName);
        tri.appendChild(tdType);
        tri.appendChild(tdSize);
        tri.appendChild(tdDate);
        tbody.appendChild(tri);
    }
}

function askLCSPData(listFilesIdx) {
    console.log(listFilesIdx[0]);
    sendRequest("getLCSPData", listFilesIdx[0]);

    let selectedAddedFiles = document.getElementById("selectedAddedFiles");

    for (let file of listFilesIdx) {
        let option = document.createElement("option");
        option.innerHTML = file;
        option.value = file;
        selectedAddedFiles.appendChild(option);
    }

    let selectedXAxis = document.getElementById("xAxis");
    let selectedYAxis = document.getElementById("yAxis");
    selectedAddedFiles.addEventListener("change", function (ev) {
        sendRequest("getLCSPData", this.value, selectedXAxis.value, selectedYAxis.value);
    });
    getColumnsLSCP();
}

let lcsp;

// ************************* LINE CHART + SCATTER PLOT *************************
function fillLineChartScatterPlot(data, cols) {
    let selectedXAxis = document.getElementById("xAxis");
    let selectedYAxis = document.getElementById("yAxis");
    console.log(data);
    let lscpContainer = document.getElementById("lscpContainer");
    lscpContainer.innerHTML = "";
    lcsp = new LineChartScatterPlot("lscpContainer", data, cols);
    selectedXAxis.value = lcsp.xAxis;
    selectedYAxis.value = lcsp.yAxis;
}

function getColumnsLSCP() {
    sendRequest("getColumnsLCSP");
}

function createSelectAxis(columns) {
    let selectedXAxis = document.getElementById("xAxis");
    let selectedYAxis = document.getElementById("yAxis");
    let selectedFile = document.getElementById("selectedAddedFiles");


    for (let col of columns) {
        if (col !== "date time" && col !== "idxFile") {
            let optionX = document.createElement("option");
            optionX.innerHTML = col;
            optionX.value = col;

            let optionY = optionX.cloneNode(true);
            selectedXAxis.appendChild(optionX);
            selectedYAxis.appendChild(optionY);
        }
    }

    // TODO : make it automatic
    selectedXAxis.value = lcsp.xAxis;
    selectedYAxis.value = lcsp.yAxis;

    selectedXAxis.addEventListener("change", function (ev) {
        let featureX = selectedXAxis.value;
        let featureY = selectedYAxis.value;
        let currentFile = selectedFile.value;
        sendRequest("getLCSPData", currentFile, featureX, featureY);
    });

    selectedYAxis.addEventListener("change", function (ev) {
        let featureX = selectedXAxis.value;
        let featureY = selectedYAxis.value;
        let currentFile = selectedFile.value;
        sendRequest("getLCSPData", currentFile, featureX, featureY);
    });
}