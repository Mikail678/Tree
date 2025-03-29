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
        this.foundIndis = [];
        this.currentFoundIndiId = -1;
        this.selectedIndi = null;
        this.editMode = true;
    }
    
    drawTree() {
        if (this.familyTree.indis.length == 0) {
            alert("Ошибка. Попробуйте ещё раз");
            return;
        }
        
        this.setCanvasSizesAndBounds();
        this.treeBuilder.drawFamily(this.treeBuilder.ancestor, this.treeBuilder.defaultColor);
        this.treeBuilder.drawLines(this.familyTree.indis, this.treeBuilder.linesColor, this.treeBuilder.lineWidth);
        this.treeBuilder.drawStrokes(this.familyTree.indis, this.treeBuilder.strokesColor);
        this.treeBuilder.drawNames(this.familyTree.indis, this.treeBuilder.textColor);
        if (this.editMode == true)
            this.treeBuilder.drawCrosses(this.familyTree.indis, this.treeBuilder.crossesColor);
        if (this.foundIndis.length > 0)
            this.highlightFamily(this.foundIndis[this.currentFoundIndiId], this.treeBuilder.highlightColor, this.treeBuilder.highlightTextColor, this.treeBuilder.highlightStrokesColor, this.treeBuilder.highlightLinesColor, 2);
    }

    scale(newScale) {
        if (this.familyTree.indis.length == 0) {
            alert("Ошибка. Попробуйте ещё раз");
            return;
        }
        this.updateCanvasScale(newScale);
        this.drawTree();
    }

    handleMouseDown(e) {
        let xVal = e.pageX - this.canvasLeft;
        let yVal = e.pageY - this.canvasTop;
        this.familyTree.indis.forEach(indi => {
            let checkClickFlag = this.checkClick(indi, xVal, yVal);
            const newIndiNameInput = this.document.getElementById('newIndiNameInput');
            if (checkClickFlag == 1) {
                if (this.selectedIndi != null) {
                    this.unselect(this.selectedIndi, newIndiNameInput);
                }
                this.startEditName(indi, newIndiNameInput);
                return;
            }
            else if (checkClickFlag == -1) {
                if (this.selectedIndi != null)
                    if (this.selectedIndi.id == indi.id)
                        this.unselect(this.selectedIndi, newIndiNameInput);
                this.deleteIndi(indi, newIndiNameInput);
                return;
            }
            // if (this.selectedIndi != null)
            //     this.unselect(this.selectedIndi, newIndiNameInput);
        });
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

    openSidebar() {
        this.toggleElement('sidebar', 'active');
        this.toggleElement('toggleSidebarBtnImg', 'active');
    }

    closeSidebar() {
        this.toggleElement('sidebar', 'passive');
        this.toggleElement('toggleSidebarBtnImg', 'passive');
    }

    unselect(indi, newIndiNameInput) {
        this.treeBuilder.drawNames([indi], this.treeBuilder.textColor);
        this.treeBuilder.drawCrosses([indi], this.treeBuilder.crossesColor);
        this.selectedIndi = null;
        this.setInputNameSettings(newIndiNameInput, indi);
    }

    select(indi) {
        this.openSidebar();
        this.updateSidebar(indi);
    }

    updateSidebar(indi) {
        let indiNameText = (indi == null ? "Неизвестно" : indi.name);
        let indiIdText = (indi == null ? "Неизвестно" : indi.id);
        let indiGenerationText = (indi == null ? "Неизвестно" : indi.generation);
        let indiFatherText = (indi == null ? "Неизвестно" : (indi.ancestor == true ? "Неизвестно" : indi.father.name));
        let indiBirthDateText = (indi == null ? "Неизвестно" : indi.birthDate);
        let indiDeathDateText = (indi == null ? "Неизвестно" : indi.deathDate);

        this.document.getElementById("indiName").innerText = indiNameText;
        this.document.getElementById("indiId").innerText = "id: " + indiIdText;
        this.document.getElementById("indiGeneration").innerText = "Поколение: " + indiGenerationText;
        this.document.getElementById("indiFather").innerText = "Отец: " + indiFatherText;
        this.document.getElementById("indiBirthDate").innerText = "Дата рождения: " + indiBirthDateText;
        this.document.getElementById("indiDeathDate").innerText = "Дата смерти: " + indiDeathDateText;
    }

    startEditName(indi, newIndiNameInput) {
        this.selectedIndi = indi;
        newIndiNameInput.value = "";
        this.setInputNameSettings(newIndiNameInput, indi);
        if (indi.name != "") {
            this.treeBuilder.drawIndi(indi, this.treeBuilder.defaultColor);
            newIndiNameInput.value = indi.name;
        }
    }

    deleteIndi(indi, newIndiNameInput) {
        let indiIndex = this.familyTree.indis.indexOf(indi);
        this.familyTree.indis.splice(indiIndex, 1);
        let indiEmptyChildIndex = this.familyTree.indis.indexOf(indi.children[0]);
        this.familyTree.indis.splice(indiEmptyChildIndex, 1);
        let childIndex = indi.father.children.indexOf(indi);
        indi.father.children.splice(childIndex, 1);
        this.treeBuilder.configure();
        this.drawTree();
        this.setInputNameSettings(newIndiNameInput, null);
    }

    setInputNameSettings(newIndiNameInput, indi) {
        if (indi != null) {
            newIndiNameInput.style.left = (indi.x * this.canvasScale + this.canvasLeft - window.scrollX) + 'px';
            newIndiNameInput.style.top = (indi.y * this.canvasScale + this.canvasTop - window.scrollY) + 'px';
            newIndiNameInput.style.height = (this.familyTree.boxHeight - this.canvasTop) * this.canvasScale + 'px';
            newIndiNameInput.style.width = (this.familyTree.boxLength - this.canvasLeft) * this.canvasScale + 'px';
            newIndiNameInput.style.size = this.familyTree.boxLength * this.canvasScale;
            newIndiNameInput.style.fontSize = 20 * this.canvasScale + 'px';
            newIndiNameInput.focus();
            return;
        }
        newIndiNameInput.style.left = '-1000px';
    }

    checkClick(indi, x, y) {
        let canDelete = indi.children.length == 1;
        if (!indi.father)
            canDelete = false;
        if ((x < indi.x * this.canvasScale) || (x > (indi.x + this.treeBuilder.boxLength) * this.canvasScale) ||
            (y < indi.y * this.canvasScale) || (y > (indi.y + this.treeBuilder.boxHeight) * this.canvasScale) || 
            this.editMode == false)
        return 0;
        if (!canDelete)
            return 1;
        if (x >  (indi.x + this.treeBuilder.boxLength - this.treeBuilder.boxHeight) * this.canvasScale)
            return -1;
        else 
            return 1;
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
