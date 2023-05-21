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

	// Add new command that opens a modal dialog to search for a note from the basenames list
	// this.addCommand({
	// 	id: "open-sample-modal-basename-search",
	// 	name: "Search for note by basename",
    //     editorCallback: (editor: Editor) => {
	// 		let modal = new AirgapSuggestModal(this.app);
	// 		modal.plugin = this;
	// 		modal.open();
	// 	}
	// });
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
}

const DEFAULT_SETTINGS: AirgapSettings = {
	basenames: ''
}

export class AirgapSuggestModal extends SuggestModal<String> {
	plugin: AirgapPlugin;

	// Returns all available suggestions.
	getSuggestions(query: string): string[] {
		if (query.length < 3) {
			return [""]
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
			view.editor.replaceRange("[[" + basename + "]]", newCursor);

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
  }
}



// interface MyPluginSettings {
// 	mySetting: string;
// }

// const DEFAULT_SETTINGS: MyPluginSettings = {
// 	mySetting: 'default'
// }

// export default class MyPlugin extends Plugin {
// 	settings: MyPluginSettings;

// 	async onload() {
// 		await this.loadSettings();

// 		// This creates an icon in the left ribbon.
// 		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
// 			// Called when the user clicks the icon.
// 			new Notice('This is a notice!');
// 		});
// 		// Perform additional things with the ribbon
// 		ribbonIconEl.addClass('my-plugin-ribbon-class');

// 		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
// 		const statusBarItemEl = this.addStatusBarItem();
// 		statusBarItemEl.setText('Status Bar Text');

// 		// This adds a simple command that can be triggered anywhere
// 		this.addCommand({
// 			id: 'open-sample-modal-simple',
// 			name: 'Open sample modal (simple)',
// 			callback: () => {
// 				new SampleModal(this.app).open();
// 			}
// 		});
// 		// This adds an editor command that can perform some operation on the current editor instance
// 		this.addCommand({
// 			id: 'sample-editor-command',
// 			name: 'Sample editor command',
// 			editorCallback: (editor: Editor, view: MarkdownView) => {
// 				console.log(editor.getSelection());
// 				editor.replaceSelection('Sample Editor Command');
// 			}
// 		});
// 		// This adds a complex command that can check whether the current state of the app allows execution of the command
// 		this.addCommand({
// 			id: 'open-sample-modal-complex',
// 			name: 'Open sample modal (complex)',
// 			checkCallback: (checking: boolean) => {
// 				// Conditions to check
// 				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
// 				if (markdownView) {
// 					// If checking is true, we're simply "checking" if the command can be run.
// 					// If checking is false, then we want to actually perform the operation.
// 					if (!checking) {
// 						new SampleModal(this.app).open();
// 					}

// 					// This command will only show up in Command Palette when the check function returns true
// 					return true;
// 				}
// 			}
// 		});

// 		// This adds a settings tab so the user can configure various aspects of the plugin
// 		this.addSettingTab(new SampleSettingTab(this.app, this));

// 		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
// 		// Using this function will automatically remove the event listener when this plugin is disabled.
// 		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
// 			console.log('click', evt);
// 		});

// 		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
// 		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
// 	}

// 	onunload() {

// 	}

// 	async loadSettings() {
// 		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
// 	}

// 	async saveSettings() {
// 		await this.saveData(this.settings);
// 	}
// }

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const {contentEl} = this;
// 		contentEl.setText('Woah!');
// 	}

// 	onClose() {
// 		const {contentEl} = this;
// 		contentEl.empty();
// 	}
// }

// class SampleSettingTab extends PluginSettingTab {
// 	plugin: MyPlugin;

// 	constructor(app: App, plugin: MyPlugin) {
// 		super(app, plugin);
// 		this.plugin = plugin;
// 	}

// 	display(): void {
// 		const {containerEl} = this;

// 		containerEl.empty();

// 		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

// 		new Setting(containerEl)
// 			.setName('Setting #1')
// 			.setDesc('It\'s a secret')
// 			.addText(text => text
// 				.setPlaceholder('Enter your secret')
// 				.setValue(this.plugin.settings.mySetting)
// 				.onChange(async (value) => {
// 					console.log('Secret: ' + value);
// 					this.plugin.settings.mySetting = value;
// 					await this.plugin.saveSettings();
// 				}));
// 	}
// }
