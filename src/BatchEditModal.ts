import { App, Modal, TFile, TFolder, Notice } from 'obsidian';

export class BatchEditModal extends Modal {
    private selectedFiles: Set<TFile> = new Set();

    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('batch-edit-modal');

        const modalContent = contentEl.createDiv({ cls: 'modal-content' });
        const fileSelectorColumn = modalContent.createDiv({ cls: 'file-selector-column' });
        const editControlsColumn = modalContent.createDiv({ cls: 'edit-controls-column' });

        this.createFileSelector(fileSelectorColumn);
        this.createEditControls(editControlsColumn);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private createFileSelector(container: HTMLElement) {
        const fileTree = this.contentEl.createDiv({ cls: 'file-tree' });
        this.renderFolder(fileTree, this.app.vault.getRoot());
    }
    
    private renderFolder(container: HTMLElement, folder: TFolder) {
        const folderEl = container.createDiv({ cls: 'folder' });
        const checkbox = folderEl.createEl('input', { type: 'checkbox' });
        folderEl.createSpan({ text: folder.name });
    
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
    
    private renderFile(container: HTMLElement, file: TFile) {
        const fileEl = container.createDiv({ cls: 'file' });
        const checkbox = fileEl.createEl('input', { type: 'checkbox' });
        fileEl.createSpan({ text: file.name });
    
        checkbox.addEventListener('change', (e) => {
            this.toggleFileSelection(file, (e.target as HTMLInputElement).checked);
        });
    }
    
    private toggleFolderSelection(folder: TFolder, isSelected: boolean) {
        folder.children.forEach(child => {
            if (child instanceof TFolder) {
                this.toggleFolderSelection(child, isSelected);
            } else if (child instanceof TFile) {
                this.toggleFileSelection(child, isSelected);
            }
        });
    }
    
    private toggleFileSelection(file: TFile, isSelected: boolean) {
        if (isSelected) {
            this.selectedFiles.add(file);
        } else {
            this.selectedFiles.delete(file);
        }
    }
    
    private createEditControls(container: HTMLElement) {
        const controlsContainer = this.contentEl.createDiv({ cls: 'edit-controls' });
    
        const propertyNameInput = controlsContainer.createEl('input', { type: 'text', placeholder: 'Property Name (e.g., state, family)' });

        const propertyValueInput = controlsContainer.createEl('input', { type: 'text', placeholder: 'Property Value (e.g., California, Smith)' });
        
        // Add explanatory text
        const explanatoryText = controlsContainer.createEl('p', { 
        text: 'To add list-type values, please separate the values by ","',
        cls: 'explanatory-text' });

        const applyButton = controlsContainer.createEl('button', { text: 'Apply Changes' });

        applyButton.addEventListener('click', () => this.applyChanges(propertyNameInput.value, propertyValueInput.value));
    }
    
    private async applyChanges(propertyName: string, propertyValue: string) {
        for (const file of this.selectedFiles) {
            const content = await this.app.vault.read(file);
            const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter || {};
    
            if (!frontmatter[propertyName]) {
                frontmatter[propertyName] = [];
            }
            if (!Array.isArray(frontmatter[propertyName])) {
                frontmatter[propertyName] = [frontmatter[propertyName]];
            }
            const values = propertyValue.split(',').map(v => v.trim());
            frontmatter[propertyName] = [...new Set([...frontmatter[propertyName], ...values])];
    
            const newContent = this.updateFrontmatter(content, frontmatter);
            await this.app.vault.modify(file, newContent);
        }
    
        new Notice(`Batch edit completed: Added "${propertyValue}" to "${propertyName}" for ${this.selectedFiles.size} files`);
        this.close();
    }

    private processListInput(input: string): string[] {
        return input.split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);
    }
    
    
    private updateFrontmatter(content: string, frontmatter: any): string {
        const yamlString = JSON.stringify(frontmatter, null, 2);
        return `---\n${yamlString}\n---\n${content.split('---').slice(2).join('---')}`;
    }
    
}
