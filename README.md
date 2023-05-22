# Airgap

This plugin allows you to link to notes in an airgapped vault. This is useful if you want to link to ideas from one vault while working in a different one without the danger of mixing up the two.

## Preparation

To use this plugin, you must first create a list of all note titles in your airgapped vault.

1. Install the plugin in both vaults: Your airgapped vault and the one you want to link from.
2. In your airgapped vault: Search for \"Insert list of note titles\" using the command-palette, then run it. Copy the list of note titles to your clipboard.
3. In the current vault: Paste it into the \"Airgapped Titles List\" setting of this plugin.


## Usage

To link from your current to a note in the airgapped vault, simply type `{{` (two curly braces). 

This will trigger the search and a list of suggestions will appear. Select the note you want to link to and press enter. 

The link will be inserted into your note and will be marked as an airgapped link using an emoji. This emoji can be configured in the settings.
