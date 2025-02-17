# ConnectMore Plugin

ConnectMore is a plugin for Obsidian that helps you manage notes about people. It allows you to create individual person notes, import contacts from a VCF file, and batch edit metadata for multiple files.

## Features

- Create individual person notes using a template.
- Import contacts from a VCF file and create notes for each contact.
- Batch edit metadata for multiple files.

## Prerequisites

- Make sure your NodeJS is at least v16 (`node --version`).
- Create a folder called `People` in your vault to store person notes.

## How to Use

### Creating Individual Person Notes

1. Open the command palette (Ctrl+P or Cmd+P) and search for "Add Person Note".
2. Enter the file name for the new person note.
3. A new note will be created in the `People` folder using the default template or the template specified in the settings.

### Importing Contacts from a VCF File

1. Set the path to your VCF file in the plugin settings under "Contacts Import Path".
2. Open the command palette (Ctrl+P or Cmd+P) and search for "Import Contacts".
3. The plugin will read the VCF file and create notes for each contact in the `People` folder.

### Batch Edit Metadata

1. Click the ribbon icon labeled "Batch Metadata Editor" to open the Batch Edit Modal.
2. Select the files you want to edit from the file selector column.
3. Enter the property name and value you want to add or update.
4. Click "Apply Changes" to batch edit the selected files.

## Settings

- **Template Path**: Path to the template file for person notes.
- **Contacts Import Path**: Path to the VCF file for importing contacts.