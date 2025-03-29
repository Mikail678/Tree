let fileSelector = document.getElementById("file-selector");
let fileUploadContainer = document.getElementById("fileUploadContainer");
let canvas = document.getElementById("canvas");
let scaleSlider = document.getElementById("scale");
let indiSearchInputName = document.getElementById("indiSearchInputName");
let nextFoundIndiBtn = document.getElementById("nextFoundIndiBtn");
let sidebar = document.getElementById("sidebar");
let toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
let downloadFamilyBtn = document.getElementById("downloadFamilyBtn");
let editFamilyBtn = document.getElementById("editFamilyBtn");
let updateBranchInput = document.getElementById("updateBranchInput");
let clearHighlightedIndisBtn = document.getElementById("clearHighlightedIndisBtn");

var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;

let canvasScale = document.getElementById("scale").value/100;

let canvasLeft = canvas.offsetLeft;
let canvasTop = canvas.offsetTop;

let familyTree = new FamilyTree(xGapBtwnFrames, yGapBtwnBrothers, extraYGapBtwnCousins, boxLength, boxHeight);
let treeBuilder = new TreeBuilder(ctx, familyTree, canvasScale, boxHeight, boxLength, yGapBtwnBrothers, extraYGapBtwnCousins, xGapBtwnFrames, lineWidth, defaultColor, highlightColor, linesColor, highlightLinesColor, textColor, highlightTextColor, strokesColor, highlightStrokesColor, bgColor, bgLinesColor, crossesColor);
let canvasController = new CanvasController(document, canvas, ctx, treeBuilder, familyTree, cnvXOffset, cnvYOffset, cnvPassiveXOffset, cnvPassiveYOffset, canvasScale, maxScale);

canvas.onclick = function(e) {canvasController.handleMouseDown(e, "leftMouse")};
canvas.oncontextmenu = function(e) {canvasController.handleMouseDown(e, "rightMouse")};
scaleSlider.oninput = function() {if (scaleSlider.value/100 != canvasController.canvasScale) {updateScales(scaleSlider.value/100); canvasController.scale(scaleSlider.value/100)}};
nextFoundIndiBtn.onclick = function() {nextFoundIndi()};
toggleSidebarBtn.onclick = function() {toggleSidebar()};
downloadFamilyBtn.onclick = function() {downloadFamily(canvasController.selectedIndi, familyTree)};
editFamilyBtn.onclick = function() {openFamilyConstructor(canvasController.selectedIndi)}; 
clearHighlightedIndisBtn.onclick = function() {clearHighlightedIndis()};

addEventListener("keydown", (e) => {
    if (document.activeElement.id != "indiSearchInputName" && (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'ы'))
        toggleSidebar();
    if (e.key.toLocaleLowerCase() === 'enter') {
        if (canvasController.lastSearchedName != indiSearchInputName.value & indiSearchInputName.value != "")
            searchIndiFrameByName(indiSearchInputName.value);
        else if (canvasController.lastSearchedName != "")
            nextFoundIndi();
    }
});

canvasController.disableNextFoundIndiBtn(nextFoundIndiBtn);
hideInterface();

let familyBranch = new FamilyTree(xGapBtwnFrames, yGapBtwnBrothers, extraYGapBtwnCousins, boxLength, boxHeight);

updateBranchInput.onchange = function() {
    let file = updateBranchInput.files[0];

    let reader = new FileReader();

    reader.readAsText(file);

    reader.onloadend = function() {
        const text = reader.result;
        if (text != undefined) {
            const lines = familyTree.splitOnLines(text);
            familyBranch.setIndis(lines);
            familyTree.concat2FamilyTrees(familyTree, familyBranch);
            downloadFamily(familyTree.getAncestor(), familyTree);
        }
    }
};

fileUploadContainer.addEventListener('dragover', (event) => {
    event.preventDefault();
    fileUploadContainer.classList.add('dragging');
});

fileUploadContainer.addEventListener('dragleave', () => {
    fileUploadContainer.classList.remove('dragging');
});

fileUploadContainer.addEventListener('drop', (event) => {
    event.preventDefault();
    fileUploadContainer.classList.remove('dragging');
    let files = event.dataTransfer.files;
    handleFileUpload(files);
});

fileUploadContainer.addEventListener('click', () => {
    fileSelector.click();
});

fileSelector.addEventListener('change', () => {
    let files = fileSelector.files;
    handleFileUpload(files);
});

function handleFileUpload(files) {
    if (files.length > 0) {
        fileSelector.remove();
        fileUploadContainer.remove();
        let file = files[0];
        parse(file, familyTree);
    }
}

function parse(file, familyTree) {
    let reader = new FileReader();
    reader.readAsText(file);

    reader.onloadend = function() {
        const text = reader.result;
        if (text != undefined) {
            const lines = familyTree.splitOnLines(text);
            familyTree.setIndis(lines);
            run();
        }
    }
}

function downloadFamily(ancestor, familyTree) {
    const text = familyTree.unloadBranchToFile(ancestor);
    const blob = new Blob([text], {type:'text/plain'});
    
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = ancestor.name+".ged";
    link.click();
    URL.revokeObjectURL(link.href);
}

function run() {
    drawTree();
    showInterface();
    canvasController.updateSidebar(null);
    console.log(familyTree.indis.length);
}

function drawTree() {
    treeBuilder.configure(familyTree.indis, treeBuilder.levelX, treeBuilder.levelY);
    canvasController.drawTree();
}

function hideInterface() {
    sidebar.style.display = "none";
    toggleSidebarBtn.style.display = "none";
    nextFoundIndiBtn.style.display = "none";
    scaleSlider.style.display = "none";
    clearHighlightedIndisBtn.style.display = "none";
    indiSearchInputName.style.display = "none";
}

function showInterface() {
    sidebar.style.display = "block";
    toggleSidebarBtn.style.display = "block";
    nextFoundIndiBtn.style.display = "block";
    scaleSlider.style.display = "block";
    clearHighlightedIndisBtn.style.display = "block";
    indiSearchInputName.style.display = "block";
}

function updateScales(newScale) {
    treeBuilder.updateCanvasScale(newScale);
    canvasController.updateCanvasScale(newScale);
}

function searchIndiFrameByName(name) {
    canvasController.searchIndisByName(name);
}

function clearHighlightedIndis() {
    canvasController.unselectIndi();
    canvasController.clearHighlightedIndis();
}

function toggleSidebar() {
    if (sidebar.className.endsWith("_passive")) {
        canvasController.openSidebar();
    }
    else if (sidebar.className.endsWith("_active")) {
        canvasController.closeSidebar();
    }
}

function nextFoundIndi() {
    canvasController.nextFoundIndi();
}

function openFamilyConstructor(ancestor) {
    localStorage.setItem('textForConstructor', familyTree.unloadBranchToFile(ancestor));
    window.open('http://mikail678.github.io/Tree/ConstructorMain.html');
}

// window.addEventListener('wheel', function(event) {
//     if (event.deltaY > 0) {
//         console.log("1");
//         scaleSlider.value += 0.01;
//     }
//     else {
//         console.log("2");
//         scaleSlider.value -= 0.01;
//     }
// });
