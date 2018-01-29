window.addEventListener("load", main);

let listSelectedFiles = [];
let displaySelectedFiles;
let filesToLi = {};

function main() {
    setupListeners()
}

function setupListeners() {
    let importFolder = document.getElementById("import");
    let table = document.getElementById("fileList");
    displaySelectedFiles = document.getElementById("selectedFiles");


    importFolder.addEventListener("change", function (ev) {
        let files = ev.path[0].files;
        console.log(files);
        fillFileList(files, table)

    })
}

function updateSelectedFilesList (file, val) {
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
    let tbody = document.createElement("tbody");
    table.appendChild(tbody);
    let tr = document.createElement("tr");
    tr.className = "fileInfo";

    let td = document.createElement("td");

    for (let file of files) {
        let tri = tr.cloneNode(false);
        tri.addEventListener("mousedown", function () {
            let toggle = tri.classList.toggle("trActive");
            console.log(toggle);
            updateSelectedFilesList(file, toggle);
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

