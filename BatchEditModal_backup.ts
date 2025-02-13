import { App, Modal, TFile, TFolder, Notice } from 'obsidian';

type DomElementInfo = {
    id: string;
    // other properties...
};

export class BatchEditModal extends Modal {
    selectedFiles: Set<TFile> = new Set();

    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('batch-edit-modal');

        contentEl.createEl('h2', { text: 'Batch Metadata Editor' });

        const container = contentEl.createDiv({ cls: 'batch-edit-container' });
        const col1 = container.createDiv({ cls: 'batch-edit-column' });
        const col2 = container.createDiv({ cls: 'batch-edit-column' });
        const col3 = container.createDiv({ cls: 'batch-edit-column' });

        this.createFileTree(col1);
        this.createSelectedFilesGrid(col2);
        this.createEditControls(col3);

        // Ensure the edit-type-select element is created
        //if (!document.getElementById('edit-type-select')) {
        //    console.error('Element with ID "edit-type-select" not found after createEditControls');
        //}

        // Make columns resizable
        this.makeColumnsResizable(container);
    }

    makeColumnsResizable(container: HTMLElement) {
        const columns = container.querySelectorAll('.batch-edit-column');
        columns.forEach((column, index) => {
            if (index < columns.length - 1) {
                const resizer = column.createDiv({cls: 'column-resizer'});
                let x = 0;
                let w = 0;

                const mouseDownHandler = (e: MouseEvent) => {
                    x = e.clientX;
                    w = parseInt(window.getComputedStyle(column as HTMLElement).width, 10);
                    document.addEventListener('mousemove', mouseMoveHandler);
                    document.addEventListener('mouseup', mouseUpHandler);
                };

                const mouseMoveHandler = (e: MouseEvent) => {
                    const dx = e.clientX - x;
                    (column as HTMLElement).style.width = `${w + dx}px`;
                };

                const mouseUpHandler = () => {
                    document.removeEventListener('mousemove', mouseMoveHandler);
                    document.removeEventListener('mouseup', mouseUpHandler);
                };

                resizer.addEventListener('mousedown', mouseDownHandler);
            }
        });
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }

    createFileTree(container: HTMLElement) {
        const fileTree = container.createDiv({cls: 'file-tree'});
        const rootFolder = this.app.vault.getRoot();
        this.renderFolder(fileTree, rootFolder);
    }
    
    renderFolder(container: HTMLElement, folder: TFolder) {
        const folderEl = container.createDiv({cls: 'folder'});
        const checkbox = folderEl.createEl('input', {type: 'checkbox'});
        folderEl.createSpan({text: folder.name});

        checkbox.addEventListener('change', (e) => {
            this.toggleFolderSelection(folder, (e.target as HTMLInputElement).checked);
        });

        folder.children.forEach(child => {
            if (child instanceof TFolder) {
                this.renderFolder(folderEl, child);
            } else if (child instanceof TFile) {
                this.renderFile(folderEl, child);
            }
        });
    }
    
    renderFile(container: HTMLElement, file: TFile) {
        const fileEl = container.createDiv({cls: 'file'});
        const checkbox = fileEl.createEl('input', {type: 'checkbox'});
        fileEl.createSpan({text: file.name});
    
        checkbox.addEventListener('change', (e) => {
            this.toggleFileSelection(file, (e.target as HTMLInputElement).checked);
        });
    }
    
    toggleFolderSelection(folder: TFolder, isSelected: boolean) {
        folder.children.forEach(child => {
            if (child instanceof TFolder) {
                this.toggleFolderSelection(child, isSelected);
            } else if (child instanceof TFile) {
                this.toggleFileSelection(child, isSelected);
            }
        });
    }

    toggleFileSelection(file: TFile, isSelected: boolean) {
        if (isSelected) {
            this.selectedFiles.add(file);
        } else {
            this.selectedFiles.delete(file);
        }
        this.updateSelectedFilesGrid();
    }
    
    createSelectedFilesGrid(container: HTMLElement) {
        const gridEl = container.createDiv({cls: 'selected-files-grid'});
        this.selectedFiles.forEach(file => {
            const fileEl = gridEl.createDiv({cls: 'selected-file'});
            const checkbox = fileEl.createEl('input', {type: 'checkbox'}) as HTMLInputElement;
            checkbox.checked = true; // Set the checked property separately
            fileEl.createSpan({text: file.name});
            checkbox.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                if (target && target.checked !== undefined) {
                    if (target.checked) {
                        this.selectedFiles.add(file);
                    } else {
                        this.selectedFiles.delete(file);
                    }
                }
            });
        });
    }
    
    updateSelectedFilesGrid() {
        const gridEl = this.contentEl.querySelector('.selected-files-grid');
        if (gridEl) {
            gridEl.empty();
            this.selectedFiles.forEach(file => {
                const fileEl = gridEl.createDiv({cls: 'selected-file'});
                const checkbox = fileEl.createEl('input', {type: 'checkbox'}) as HTMLInputElement;
                checkbox.checked = true; // Set the checked property separately
                fileEl.createSpan({text: file.name});
                checkbox.addEventListener('change', (e) => {
                    this.toggleFileSelection(file, (e.target as HTMLInputElement).checked);
                });
            });
        }
    }
    

    createEditControls(container: HTMLElement) {
        const editTypeSelect = container.createEl('select', { id: 'edit-type-select' } as any);
        const optionAdd = editTypeSelect.createEl('option', { text: 'Add', value: 'add' });
        const optionRemove = editTypeSelect.createEl('option', { text: 'Remove', value: 'remove' });
        editTypeSelect.value = 'add'; // Set default value to "Add"

        const propertyTypeSelect = container.createEl('select');
        ['Text', 'List'].forEach(type => {
            propertyTypeSelect.createEl('option', { value: type.toLowerCase(), text: type });
        });

        const propertyNameInput = container.createEl('input', { type: 'text', placeholder: 'Property Name' });
        const propertyValueInput = container.createEl('input', { type: 'text', placeholder: 'Property Value' });

        const applyButton = container.createEl('button', { text: 'Apply Changes' });
        applyButton.addEventListener('click', () => this.applyChanges());
    }
    
    async applyChanges() {
        const selectedFiles = this.getSelectedFiles();
        const editType = this.getEditType();
        const propertyType = this.getPropertyType();
        const propertyName = this.getPropertyName();
        const propertyValue = this.getPropertyValue();
    
        console.log('Selected Files:', selectedFiles);
        console.log('Edit Type:', editType);
        console.log('Property Type:', propertyType);
        console.log('Property Name:', propertyName);
        console.log('Property Value:', propertyValue);
    
        for (const file of selectedFiles) {
            const content = await this.app.vault.read(file);
            const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
    
            console.log('Original Content:', content);
            console.log('Original Frontmatter:', frontmatter);
    
            if (frontmatter) {
                switch (editType) {
                    case 'add':
                        frontmatter[propertyName] = propertyType === 'list' ? [propertyValue] : propertyValue;
                        break;
                    case 'replace':
                        if (frontmatter.hasOwnProperty(propertyName)) {
                            frontmatter[propertyName] = propertyType === 'list' ? [propertyValue] : propertyValue;
                        }
                        break;
                    case 'delete':
                        delete frontmatter[propertyName];
                        break;
                }
    
                const newContent = this.updateFrontmatter(content, frontmatter);
                console.log('Updated Content:', newContent);
    
                await this.app.vault.modify(file, newContent);
            }
        }
    
        new Notice('Batch edit completed');
        this.close();
    }
    getSelectedFiles(): TFile[] {
        return Array.from(this.selectedFiles);
    }
    
    getEditType(): string {
        const editTypeElement = this.contentEl.querySelector('#edit-type-select') as HTMLSelectElement;
        if (!editTypeElement) {
            throw new Error('Element with ID "edit-type-select" not found');
        }
        return editTypeElement.value;
    }

    getPropertyType(): string {
        return (this.contentEl.querySelector('#property-type-select') as HTMLSelectElement).value;
    }
    
    getPropertyName(): string {
        return (this.contentEl.querySelector('#property-name-input') as HTMLInputElement).value;
    }
    
    getPropertyValue(): string {
        return (this.contentEl.querySelector('#property-value-input') as HTMLInputElement).value;
    }
    
    

    updateFrontmatter(content: string, frontmatter: any): string {
        const yamlString = JSON.stringify(frontmatter);
        return `---\n${yamlString}\n---\n${content.split('---').slice(2).join('---')}`;
    }
    
    
}

document.addEventListener('DOMContentLoaded', () => {
    // Ensure the DOM is fully loaded before calling getEditType
    const app = new App(); // Instantiate the App class
    const batchEditModal = new BatchEditModal(app);
    try {
        const editType = batchEditModal.getEditType();
        console.log(editType);
    } catch (error) {
        console.error(error.message);
    }
});
