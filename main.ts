import { App, Plugin, PluginSettingTab, Setting, MarkdownView, Notice, TFile, normalizePath } from 'obsidian';
import { defaultTemplate } from './defaultTemplate';

// Define the settings interface
interface PersonNotePluginSettings {
    templatePath: string;
    // New setting for contacts import file path
    contactsImportPath: string;
}

// Define the default settings
const DEFAULT_SETTINGS: PersonNotePluginSettings = {
    templatePath: '',
     // Default value for contacts import file path
    contactsImportPath: ''
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

        // New command for importing contacts
        this.addCommand({
            id: 'import-contacts',
            name: 'Import Contacts',
            callback: () => {
                console.log('Import Contacts command executed');
                this.importContacts();
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

    // Method to import contacts
    async importContacts() {
        console.log('importContacts method called');

        if (!this.settings.contactsImportPath) {
            new Notice('Contacts import file path not set');
            return;
        }

        const filePath = normalizePath(this.settings.contactsImportPath);
        const file = this.app.vault.getAbstractFileByPath(filePath) as TFile;

        if (!file) {
            new Notice('Contacts file not found');
            return;
        }

        const content = await this.app.vault.read(file);
        const contacts = this.parseVCF(content); // Implement VCF parsing
        console.log('parseVCF method called');

        for (const contact of contacts) {
            await this.createContactNote(contact);
        }

        new Notice(`Imported ${contacts.length} contacts`);
    }

    // Method to parse VCF content
    parseVCF(content: string): any[] {
        const contacts = [];
        const vcardRegex = /BEGIN:VCARD[\s\S]*?END:VCARD/g;
        let match;

        while ((match = vcardRegex.exec(content)) !== null) {
            const vcard = match[0];
            const name = vcard.match(/FN:(.*)/)?.[1] || 'Unknown';
            const phone = vcard.match(/TEL.*:(.*)/)?.[1] || '';
            const email = vcard.match(/EMAIL.*:(.*)/)?.[1] || '';
            const birthday = vcard.match(/BDAY:(.*)/)?.[1] || '';

            contacts.push({ name, phone, email, birthday });
        }

        return contacts;
    }

    // Method to create a note for each contact
    async createContactNote(contact: any) {
        const fileName = `People/${contact.name}.md`;
        const existingFile = this.app.vault.getAbstractFileByPath(fileName);

        if (existingFile) {
            new Notice(`Contact note for ${contact.name} already exists. Skipping.`);
            return;
        }

        const content = this.generateContactContent(contact);
        await this.app.vault.create(fileName, content);
    }

    // Method to generate content for each contact note
    generateContactContent(contact: any): string {
        return defaultTemplate
            .replace('{{name}}', contact.name)
            .replace('{{phone}}', contact.phone)
            .replace('{{email}}', contact.email)
            .replace('{{birthday}}', contact.birthday);
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
        
        // New setting for contacts import file path
        new Setting(containerEl)
            .setName('Contacts Import Path')
            .setDesc('Path to the VCF file for importing contacts')
            .addText(text => text
                .setPlaceholder('Contacts/contacts.vcf')
                .setValue(this.plugin.settings.contactsImportPath)
                .onChange(async (value) => {
                    this.plugin.settings.contactsImportPath = value;
                    await this.plugin.saveSettings();
                }));        
    }
}
