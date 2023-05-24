import { App, Editor,  Notice, SuggestModal, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';

export default class AirgapPlugin extends Plugin {
	settings: AirgapSettings;
	lastKey: string = "";
	
	async onload() {
		await this.loadSettings();
		
		this.addSettingTab(new AirgapSettingTab(this.app, this));
		
		// Register keydown event handler
		this.registerDomEvent(document, "keyup", (evt: KeyboardEvent) => {
			// if event is "{" and shift is pressed and the last key pressed was also "{" then alert "Hello!"
			if (evt.key == "{" && evt.shiftKey && this.lastKey == "{") {
				// Show search modal
				let modal = new AirgapSuggestModal(this.app, this);
				modal.emptyStateText = "Type to search for a note in the airgapped vault"
				modal.setPlaceholder("Search here...")
				modal.plugin = this;
				modal.open();
			}
			
			this.lastKey = evt.key;
		});
		
		
		this.addCommand({
			id: "insert-list-of-note-titles",
			name: "Insert list of note titles",
			editorCallback: (editor: Editor) => {
				const files = this.app.vault.getMarkdownFiles()
				let basenames = ""
				for (let i = 0; i < files.length; i++) {
					basenames += files[i].basename + "\n"
				}	
				
				editor.replaceRange(basenames, editor.getCursor());
			},
		});
	}
	
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	
	async saveSettings() {
		await this.saveData(this.settings);
	}
}

interface AirgapSettings {
	basenames: string;
	vaultIndicator: string
}

const DEFAULT_SETTINGS: AirgapSettings = {
	basenames: '',
	vaultIndicator: '🔒'
}

export class AirgapSuggestModal extends SuggestModal<String> {
	plugin: AirgapPlugin;
	basenames: string[];

	constructor(app: App, plugin: AirgapPlugin) {
		super(app);
		this.plugin = plugin;
		this.basenames = this.plugin.settings.basenames.split("\n");
	}

	// Returns all available suggestions.
	getSuggestions(query: string): string[] {
		if(query.length == 0) return [];
		return this.basenames.filter((basename: string) =>
			basename.toLowerCase().includes(query.toLowerCase())
		).slice(0, 5);
	}
	
	// Renders each suggestion item.
	renderSuggestion(basename: string, el: HTMLElement) {
		el.createEl("div", {text: basename });
	}
	
	// Perform action on the selected suggestion.
	onChooseSuggestion(basename: string, evt: MouseEvent | KeyboardEvent) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		// Make sure the user is editing a Markdown file.
		if (view) {
			const cursor = view.editor.getCursor();
			let newCursor = cursor;
			newCursor.ch -= 2;
			// Insert the suggestion at the cursor.
			view.editor.replaceRange("[[" + basename + "|"+ this.plugin.settings.vaultIndicator + " " + basename + "]]", newCursor);
			
			// Remove {{ and }} from the line
			let line = view.editor.getLine(cursor.line);
			let newLine = line;
			newLine = newLine.replace("{{", "");
			newLine = newLine.replace("}}", "");
			view.editor.setLine(cursor.line, newLine);
		}
	}
}

export class AirgapSettingTab extends PluginSettingTab {
	plugin: AirgapPlugin;
	
	constructor(app: App, plugin: AirgapPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	
	display(): void {
		let { containerEl } = this;
		
		
		containerEl.empty();

		containerEl.createEl("h3", {text: "Obsidian Airgap Settings"});

		containerEl.createEl("p", {text: "This plugin allows you to link to notes in an airgapped vault. This is useful if you want to link to ideas from one vault while working in a different one without the danger of mixing up the two."});

		containerEl.createEl("h2", {text: "Preparation"});

		containerEl.createEl("p", {text: "To use this plugin, you must first create a list of all note titles in your airgapped vault."});

		containerEl.createEl("p", {text: "1. To do this, open the vault whose notes you want to link to but keep airgapped."});

		containerEl.createEl("p", {text: "2. Search for \"Insert list of note titles\" using the command-palette, then run it."});

		containerEl.createEl("p", {text: "3. Copy this list and paste it into the \"Airgapped Titles List\" setting below."});

		containerEl.createEl("h2", {text: "Usage"});

		containerEl.createEl("p", {text: "To link from your current to a note in the airgapped vault, type \"{{\". This will trigger the search and a list of suggestions will appear. Select the note you want to link to and press enter. The link will be inserted into your note. The link will be marked as an airgapped link using the indicator you set below."});

		new Setting(containerEl)
		.setName("Airgapped Note List")
		.setDesc("A list of all note titles located in your airgapped vault. This is used to provide suggestions when searching for a note. ")
		.addTextArea((text) =>
		text
		.setPlaceholder("Enter Note Titles")
		.setValue(this.plugin.settings.basenames)
		.onChange(async (value) => {
			this.plugin.settings.basenames = value;
			await this.plugin.saveSettings();
		})
		);

		new Setting(containerEl)
		.setName("Airgap Indicator")
		.setDesc("The string to be used to indicate that a link is to a note in the airgapped vault.")
		.addText((text) =>
		text
		.setPlaceholder("Enter a vault indicator")
		.setValue(this.plugin.settings.vaultIndicator)
		.onChange(async (value) => {
			this.plugin.settings.vaultIndicator = value;
			await this.plugin.saveSettings();
		})
		)
	}
}
