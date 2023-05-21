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
				let modal = new AirgapSuggestModal(this.app);
				modal.emptyStateText = "Type to search for a note"
				modal.setPlaceholder("Search for a note")
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
	
	// Returns all available suggestions.
	getSuggestions(query: string): string[] {
		if (query.length < 3) {
			return []
		}
		return this.plugin.settings.basenames.split("\n").filter((basename: string) =>
		basename.toLowerCase().includes(query.toLowerCase())
		);
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
		
		new Setting(containerEl)
		.setName("Basenames")
		.setDesc("A list of all note basenames")
		.addTextArea((text) =>
		text
		.setPlaceholder("Enter basenames")
		.setValue(this.plugin.settings.basenames)
		.onChange(async (value) => {
			this.plugin.settings.basenames = value;
			await this.plugin.saveSettings();
		})
		);

		new Setting(containerEl)
		.setName("Vault Indicator")
		.setDesc("The string to be used to indicate that a note is in the airgapped vault")
		.addText((text) =>
		text
		.setPlaceholder("Enter vault indicator")
		.setValue(this.plugin.settings.vaultIndicator)
		.onChange(async (value) => {
			this.plugin.settings.vaultIndicator = value;
			await this.plugin.saveSettings();
		})
		)
	}
}
