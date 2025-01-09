import { App, Plugin, PluginSettingTab, Setting, MarkdownView, Notice, TFile, normalizePath } from 'obsidian';
import { defaultTemplate } from './defaultTemplate';

// Define the settings interface
interface PersonNotePluginSettings {
    templatePath: string;
}

// Define the default settings
const DEFAULT_SETTINGS: PersonNotePluginSettings = {
    templatePath: ''
};

// Define the main plugin class
export default class PersonNotePlugin extends Plugin {
    settings: PersonNotePluginSettings;

    async onload() {
        console.log('PersonNotePlugin loaded');

        // Load settings
        await this.loadSettings();

        // Add a command to the Obsidian command palette
        this.addCommand({
            id: 'add-person-note',
            name: 'Add Person Note',
            callback: () => {
                console.log('Add Person Note command executed');
                this.addPersonNote();
            }
        });

        // Add settings tab
        this.addSettingTab(new PersonNoteSettingTab(this.app, this));
    }

    // Method to create a new person note
    async addPersonNote() {
        console.log('addPersonNote method called');

        // Prompt the user for the file name
        const fileName = await this.promptForFileName();
        if (!fileName) {
            console.log('No file name provided');
            return;
        }

        let template = defaultTemplate;

        // Read the template from the configured .md file if the path is not empty
        if (this.settings.templatePath) {
            const templateFilePath = normalizePath(this.settings.templatePath);
            const templateFile = this.app.vault.getAbstractFileByPath(templateFilePath) as TFile;
            if (!templateFile) {
                new Notice('Template file not found');
                return;
            }
            template = await this.app.vault.read(templateFile);
        }

        // Create a new file with the template
        const file = await this.app.vault.create(`People/${fileName}.md`, template.replace('{{title}}', fileName));
        console.log(`File created: People/${fileName}.md`);
        
        // Open the newly created file using Workspace.getLeaf
        const leaf = this.app.workspace.getLeaf();
        await leaf.openFile(file);
        console.log(`File opened: People/${fileName}.md`);
    }

    // Method to prompt the user for the file name
    async promptForFileName(): Promise<string | null> {
        return new Promise((resolve) => {
            const prompt = new Notice('Enter the file name:', 0);
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'File name';
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    prompt.hide();
                    resolve(input.value);
                }
            });
            prompt.noticeEl.appendChild(input);
            input.focus();
        });
    }

    // Load settings
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    // Save settings
    async saveSettings() {
        await this.saveData(this.settings);
    }
}

// Define the settings tab class
class PersonNoteSettingTab extends PluginSettingTab {
    plugin: PersonNotePlugin;

    constructor(app: App, plugin: PersonNotePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Template Path')
            .setDesc('Path to the template file for person notes')
            .addText(text => text
                .setPlaceholder('Templates/PersonNoteTemplate.md')
                .setValue(this.plugin.settings.templatePath)
                .onChange(async (value) => {
                    this.plugin.settings.templatePath = value;
                    await this.plugin.saveSettings();
                }));
    }
}
