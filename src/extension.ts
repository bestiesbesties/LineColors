import * as vscode from "vscode";
import ColorsViewProvider from "./ColorsViewProvider"

export function activate(context: vscode.ExtensionContext) {
  const provider = new ColorsViewProvider(context.extensionUri, context) // TODO provide only context
  console.log("Initialized LineColors")
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ColorsViewProvider.viewType, provider)
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("lineColors.addColor", () => { provider.addColor() } )
  )
 // TODO IMPLEMENT ONCE MULTI SELECTION
  // context.subscriptions.push(
  //   vscode.window.onDidChangeTextEditorSelection(() => {
  //     console.log("texteditor_selection")
  //   })
  // )

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((textDocumentChangeEvent) => {
      const activeEditor = vscode.window.activeTextEditor
      if (!activeEditor) {
        return;
      }

      if(textDocumentChangeEvent.document == activeEditor.document) {
 
        console.log("text changed in active editor")
        // TODO ------> nuanced via range and length etc...
        textDocumentChangeEvent.contentChanges.forEach((change, idx) => {
          console.log(`x14 --- Change ${idx} ---`);
          console.log("x14 text len:", change.text.length);
          console.log("x14 Inserted text:", change.text);
          console.log("x14 Inserted text: JSON", JSON.stringify(change.text));
          const exitString = JSON.stringify(change.text)
          console.log("x14 Range:", change.range);
          console.log("x19 Range.start.line:", change.range.start.line); //TODO <----
          console.log("x19 Range.end.line:", change.range.end.line); //TODO <----
          console.log("x14 Range.isSingleLine", change.range.isSingleLine);
          console.log("x14 RangeLength:", change.rangeLength);

          const inserted = (change.text.match(/\n/g) ?? []).length;
          const removed = change.range.end.line - change.range.start.line;
          const lineDelta = inserted - removed;

            const lineNumber = change.range.start.line;
            const line = textDocumentChangeEvent.document.lineAt(lineNumber);
            const oldLineText = textDocumentChangeEvent.document.getText(change.range); 
            // TODO + get previous line char range
            const currentInsertPos = change.range.start.character;
            let hasEnterAtStart = false
            let hasEnterInBetween = false
            let hasEnterAtEnd = false

            console.log("x20 currentInsertPos:", currentInsertPos);
            if (currentInsertPos === 0) {
                hasEnterAtStart = true
            } else if (currentInsertPos === line.text.length) { // TODO + this is probably always end of line including the new data so the split will be invalid
                console.log("x20 oldLineText.length:", oldLineText.length);
                console.log("x20 change.range.end.character:", change.range.end.character);
                console.log("x20 line.text.length:", line.text.length);
                hasEnterAtEnd = true
            } else {
                hasEnterInBetween = true
            }

          provider.shift(
            lineDelta, 
            textDocumentChangeEvent.document.uri.fsPath, 
            change.range.end.line,
            activeEditor,
            hasEnterAtStart,
            hasEnterInBetween,
            hasEnterAtEnd
          )
        });
      }
    })
  )

  // TODO research if this can be obsolete if initialization of extension includes pushing decorations 
  // context.subscriptions.push(
  //   vscode.window.onDidChangeActiveTextEditor(activeTextEditor => {
  //     if (activeTextEditor) {
  //       console.log("triggered from context")
  //       provider.applyHighlights(activeTextEditor, activeTextEditor?.document.uri.fsPath)
  //     }
  //   })
  // )

  context.subscriptions.push(
  vscode.window.onDidChangeVisibleTextEditors((activeTextEditors) => {
    if (activeTextEditors) {
      activeTextEditors.forEach(activeTextEditor => {
        console.log("triggered from context2")
        provider.applyHighlights(activeTextEditor, activeTextEditor?.document.uri.fsPath)
      })
    }
    })
  )
}

