import { App, PluginSettingTab, Setting } from 'obsidian';
import PersonNotePlugin from '../main';

// Define the settings tab class
export default class PersonNoteSettingTab extends PluginSettingTab {
    plugin: PersonNotePlugin;

    constructor(app: App, plugin: PersonNotePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Template path')
            .setDesc('Path to the template file for person notes')
            .addText(text => text
                .setPlaceholder('Templates/PersonNoteTemplate.md')
                .setValue(this.plugin.settings.templatePath)
                .onChange(async (value) => {
                    this.plugin.settings.templatePath = value;
                    await this.plugin.saveSettings();
                }));
        
        new Setting(containerEl)
            .setName('Contacts import path')
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