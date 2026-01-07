
[![Version](https://img.shields.io/visual-studio-marketplace/v/bestiesbesties.linecolors)](https://marketplace.visualstudio.com/items?itemName=bestiesbesties.linecolors)
[![Contribute](https://img.shields.io/badge/github-repo-blue?logo=github)](https://github.com/bestiesbesties/LineColors)

LineColors allows you to color the background of any specific line of code.

Usefull as **immediate recognition**, **cross referencing** or **grouping** for different lines of code. The possibilities of simply coloring lines of code could be endless.

This extension is only visual and does not change your files or code.

![demo.gif](https://raw.githubusercontent.com/bestiesbesties/LineColors/main/img/LineColors_demo.gif)

## Features
- Color any line in the texteditor to red, green or blue.
- Automatically shift colored lines with performed text insertions or deletions.
- Automatically save colored lines linked to tracked filenames in globalstate.
- Overview of colored lines in the overviewruler.
- See active color info in statusbar.

## Commands
|Command|Description|Keybind|
|-|-|-|
|lineColors.drop|Drop the selected color from the UI to the active selection in the texteditor.|ctrl + d|
|lineColors.switch|Iterate between dropable colors chronologically.|ctrl + shift + d|
|lineColors.reset|Reset the entire state of the extension, thus clearing coloring on all lines.|

## References
<small>

https://code.visualstudio.com/api/get-started/your-first-extension

https://github.com/microsoft/vscode-extension-samples/tree/main/webview-view-sample

https://stackoverflow.com/questions/76315401/ondidchangeactivetexteditor-not-working-for-custom-text-editor

https://code.visualstudio.com/api/working-with-extensions/publishing-extension

https://code.visualstudio.com/api/references/extension-manifest

https://code.visualstudio.com/api/references/vscode-api#TextDocumentChangeEvent

https://code.visualstudio.com/api/references/icons-in-labels#icon-listing

https://code.visualstudio.com/api/ux-guidelines/status-bar
</small>

