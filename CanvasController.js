class CanvasController
{
    constructor(document, canvas, ctx, treeBuilder, familyTree, cnvXOffset, cnvYOffset, cnvPassiveXOffset, cnvPassiveYOffset, canvasScale, maxScale) {
        this.document = document;
        this.canvas = canvas;
        this.ctx = ctx;
        this.treeBuilder = treeBuilder;
        this.familyTree = familyTree;
        this.cnvXOffset = cnvXOffset;
        this.cnvYOffset = cnvYOffset;
        this.cnvPassiveXOffset = cnvPassiveXOffset;
        this.cnvPassiveYOffset = cnvPassiveYOffset;
        this.canvasScale = canvasScale;
        this.maxScale = maxScale;
        this.highlightedIndis = [];
        this.relationPathMembers = [];
        this.currentHighlightedIndiIndex = -1;
        this.selectedIndi = null;
        this.sidebar = this.document.getElementById('sidebar');
        this.lastSearchedName = "";
    }

    drawTree() {
        if (this.familyTree.indis.length <= 0) {
            alert("Ошибка. Попробуйте ещё раз");
            return;
        }
        this.setCanvasSizesAndBounds();
        this.treeBuilder.drawTree();
    }

    scale(newScale) {
        if (this.familyTree.indis.length <= 0) {
            alert("Ошибка. Попробуйте ещё раз");
            return;
        }
        // var windowCenterX = window.scrollX / this.canvasScale;
        // var windowCenterY = window.scrollY / this.canvasScale;
        // // console.log(windowCenterX);
        // // console.log(windowCenterY);
        // let oldScale = this.canvasScale;
        this.updateCanvasScale(newScale);
        this.drawTree();
        //scrollTo(windowCenterX * newScale + this.canvasLeft, windowCenterY * newScale + this.canvasTop);
    }

    handleMouseDown(e, click) {
        let xVal = e.pageX - this.canvasLeft;
        let yVal = e.pageY - this.canvasTop;
        for (let i = 0; i < this.familyTree.indis.length; i++) {
            let indi = this.familyTree.indis[i];
            if (!this.checkClick(indi, xVal, yVal))
                continue;

            if (click == "leftMouse") {
                if (indi.name == "") return;
                this.unselectIndi();
                this.clearHighlightedIndis();
                this.selectIndi(indi);
                this.highlightedIndis.push(indi);
            }
            else if (click == "rightMouse") {
                this.clearHighlightedIndis();
                this.treeBuilder.highlightIndis(this.relationPathMembers, this.treeBuilder.defaultColor, this.treeBuilder.textColor, this.treeBuilder.strokesColor);
                this.relationPathMembers = [];
                if (this.selectedIndi == null) return;
                
                let members = this.familyTree.getTwoIndiRelationPathMembers(this.selectedIndi, indi);
                this.relationPathMembers = members;
                members.forEach(member => {
                    member.highlighted = true;
                });
                this.highlightedIndis = members;
                this.treeBuilder.highlightIndis(members, this.treeBuilder.highlightColor, this.treeBuilder.highlightTextColor, this.treeBuilder.highlightStrokesColor);
            }
            return;
        } 
    }

    toggleElement(elementName, state) {
        let element = this.document.getElementById(elementName);
        
        if (state == 'passive') {
            element.classList.remove(elementName + '_active');
            element.classList.toggle(elementName + '_passive');
        }
        else if (state == 'active') {
            element.classList.remove(elementName + '_passive');
            element.classList.toggle(elementName + '_active');
        }
    }

    checkClick(indi, x, y) {
        return (x >= indi.x * this.canvasScale && x <= (indi.x + indi.length) * this.canvasScale && y >= indi.y * this.canvasScale && y <= (indi.y + this.treeBuilder.boxHeight) * this.canvasScale);
    }

    updateSidebar(indi) {
        let indiNameText = (indi == null ? "Неизвестно" : indi.name);
        let indiIdText = (indi == null ? "Неизвестно" : indi.id);
        let indiGenerationText = (indi == null ? "Неизвестно" : indi.generation);
        let indiFatherText = (indi == null ? "Неизвестно" : (indi.ancestor == true ? "Неизвестно" : indi.father.name));
        let indiBirthDateText = (indi == null ? "Неизвестно" : indi.birthDate);
        let indiDeathDateText = (indi == null ? "Неизвестно" : indi.deathDate);
        let downloadFamilyBtnDisplay = (indi == null ? "none" : "block");
        let editFamilyBtnDisplay = (indi == null ? "none" : "block");
        let updateBranchInputLabelDisplay = (indi == null ? "none" : "inline-flex");

        this.document.getElementById("indiName").innerText = indiNameText;
        this.document.getElementById("indiId").innerText = "id: " + indiIdText;
        this.document.getElementById("indiGeneration").innerText = "Поколение: " + indiGenerationText;
        this.document.getElementById("indiFather").innerText = "Отец: " + indiFatherText;
        this.document.getElementById("indiBirthDate").innerText = "Дата рождения: " + indiBirthDateText;
        this.document.getElementById("indiDeathDate").innerText = "Дата смерти: " + indiDeathDateText;
        this.document.getElementById("downloadFamilyBtn").style.display = downloadFamilyBtnDisplay;
        this.document.getElementById("editFamilyBtn").style.display = editFamilyBtnDisplay;
        this.document.getElementById("updateBranchInputLabel").style.display = updateBranchInputLabelDisplay;
    }

    openSidebar() {
        this.toggleElement('sidebar', 'active');
        this.toggleElement('toggleSidebarBtnImg', 'active');
    }

    closeSidebar() {
        this.toggleElement('sidebar', 'passive');
        this.toggleElement('toggleSidebarBtnImg', 'passive');
    }

    searchIndisByName(name) {
        this.lastSearchedName = name;
        if (this.highlightedIndis.length > 0) {
            this.unselectIndi();
            this.clearHighlightedIndis(false);
        }

        this.familyTree.indis.forEach(indi => {
            if (this.compareNames(indi.name.toLowerCase(), name.toLowerCase())) {
                this.highlightedIndis.push(indi);
            }
        });
        
        this.highlightedIndis.sort((indi1, indi2) => {return indi2.children.length > indi1.children.length});

        let button = this.document.getElementById("nextFoundIndiBtn");
        if (this.highlightedIndis.length > 0) {
            this.nextFoundIndi();
            this.enableNextFoundIndiBtn(button);
            return;
        }
        alert("С именем " + name + " не был найден ни один человек");

        this.lastSearchedName = "";
        this.disableNextFoundIndiBtn(button);
        this.document.getElementById("indiSearchInputName").value = "";
        this.unselectIndi();
        this.clearHighlightedIndis();
    }

    selectIndi(indi) {
        if (this.selectedIndi != null) {
            this.unselectIndi();
            return;
        }
        this.selectedIndi = indi;
        this.selectedIndi.highlighted = true;
        this.treeBuilder.highlightIndi(indi, this.treeBuilder.highlightColor, this.treeBuilder.highlightTextColor, this.treeBuilder.highlightStrokesColor);
        this.updateSidebar(indi);
    }

    unselectIndi() {
        if (this.selectedIndi == null) {
            return;
        }
        this.selectedIndi.highlighted = false;
        this.selectedIndi = null;
        this.updateSidebar(null);
    }

    clearHighlightedIndis(resetSearchData=true) {
        if (resetSearchData) {
            this.lastSearchedName = "";
            this.disableNextFoundIndiBtn(this.document.getElementById("nextFoundIndiBtn"));
            this.document.getElementById("indiSearchInputName").value = "";
        }

        this.familyTree.indis.forEach(indi => {
            indi.highlighted = false;
        });

        if (this.currentHighlightedIndiIndex != -1) {
            this.highlightFamily(this.highlightedIndis[this.currentHighlightedIndiIndex], this.treeBuilder.defaultColor, this.treeBuilder.textColor, this.treeBuilder.strokesColor, this.treeBuilder.linesColor, 1);
            this.currentHighlightedIndiIndex = -1;
        }
        if (this.highlightedIndis.length > 0) {
            this.highlightedIndis.forEach(member => {
                member.highlighted = false;
                this.treeBuilder.highlightIndi(member, this.treeBuilder.defaultColor, this.treeBuilder.linesColor, this.treeBuilder.strokesColor, this.treeBuilder.linesColor, 1);
            });
            this.highlightedIndis = [];
            if (this.selectedIndi != null) {
                this.highlightedIndis.push(this.selectedIndi);
                this.selectedIndi.highlighted = true;
            }
        }
    }

    nextFoundIndi() {
        if (this.currentHighlightedIndiIndex != -1) {
            let indi = this.highlightedIndis[this.currentHighlightedIndiIndex];
            this.unselectIndi();
            this.familyTree.getFamilyMembers(indi, [indi]).forEach(member => {
                member.highlighted = false;
            });
            // this.treeBuilder.highlightIndi(indi, this.treeBuilder.defaultColor, this.treeBuilder.linesColor, this.treeBuilder.strokesColor, this.treeBuilder.linesColor, 1);
            this.highlightFamily(indi, this.treeBuilder.defaultColor, this.treeBuilder.textColor, this.treeBuilder.strokesColor, this.treeBuilder.linesColor, 1);
        }
        
        if (this.currentHighlightedIndiIndex < this.highlightedIndis.length-1)
            this.currentHighlightedIndiIndex += 1;
        else 
            this.currentHighlightedIndiIndex = 0;

        const indi = this.highlightedIndis[this.currentHighlightedIndiIndex];
        this.selectIndi(indi, this.currentHighlightedIndiIndex);
        let [maxX, minX, maxY, minY] = this.familyTree.getFamilyBounds(indi, 0, 1000000, 0, 1000000);
        const newScale = this.calcScaleToFitBranch(maxX, minX, maxY, minY);
        this.treeBuilder.updateCanvasScale(newScale);

        this.familyTree.getFamilyMembers(indi, [indi]).forEach(member => {
            member.highlighted = true;
        });

        if (newScale != this.canvasScale) {
            this.scale(newScale);
            this.document.getElementById("scale").value = newScale * 100;
        }
        else
            this.highlightFamily(indi, this.treeBuilder.highlightColor, this.treeBuilder.highlightTextColor, this.treeBuilder.highlightStrokesColor, this.treeBuilder.highlightLinesColor, 2);

        this.scrollToIndi(maxX, minX, maxY, minY);
    }

    compareNames(name1, name2) {
        if (name1.length < name2.length) {
            return false;
        }
        for (let i = 0; i <= name1.length - name2.length; i++) {
            let c = 0;
            for (let j = 0; j < name2.length; j++) {
                if (name2[j] == name1[i+j]) {
                    c++;
                }
            }
            if (c >= name1.length*0.75) {
                return true;
            }
        }

        return false;
    }

    scrollToIndi(maxX, minX, maxY, minY) {
        let button = this.document.getElementById("nextFoundIndiBtn");
        button.setAttribute("disabled", "disabled");
        setTimeout(() => {this.enableNextFoundIndiBtn(button)}, 100);
        scrollTo((minX + (maxX - minX)/2) * this.canvasScale + this.canvasLeft - window.innerWidth/2, (minY + (maxY - minY)/2) * this.canvasScale + this.canvasTop - window.innerHeight/2);
    }

    disableNextFoundIndiBtn(button) {
        button.setAttribute("disabled", "disabled");
        button.innerText = "Заполните поле слева";
    }

    enableNextFoundIndiBtn(button) {
        button.removeAttribute("disabled");
        button.innerText = "Следующий (" + (this.currentHighlightedIndiIndex + 1) + "/" + this.highlightedIndis.length + ")";
    }

    calcScaleToFitBranch(maxX, minX, maxY, minY) {
        let newScaleX = (window.innerWidth)/(maxX - minX);
        let newScaleY = (window.innerHeight)/(maxY - minY);
        let newScale = Math.min(newScaleX, newScaleY);

        return newScale < this.maxScale ? newScale : this.maxScale;
    }

    setCanvasSizesAndBounds() {
        const newWidth = this.treeBuilder.treeBounds[0] * this.canvasScale;
        const newHeight = this.treeBuilder.treeBounds[1] * this.canvasScale;
        this.canvas.width = newWidth + this.cnvXOffset > window.innerWidth ? newWidth + this.cnvXOffset : window.innerWidth;
        this.canvas.height = newHeight + this.cnvYOffset > window.innerHeight ? newHeight + this.cnvYOffset : window.innerHeight;
        this.canvasLeft = this.cnvPassiveXOffset;
        this.canvasTop = this.cnvPassiveYOffset;
    }

    updateCanvasScale(newScale) {
        this.canvasScale = newScale;
    }

    highlightFamily(indi, color, textColor, strokesColor, linesColor, lineWidth) {
        this.treeBuilder.highlightFamily(indi, color, textColor, strokesColor);
        this.treeBuilder.drawLines(this.familyTree.getFamilyMembers(indi, [indi]), linesColor, lineWidth);
    }
}
