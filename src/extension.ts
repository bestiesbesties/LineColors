import * as vscode from "vscode";
import { ColorsViewProvider } from "./ColorsViewProvider"
import { calculateShifting } from "./shifting"

export function activate(context: vscode.ExtensionContext) {
  const provider = new ColorsViewProvider(context)
  console.log("Initialized LineColors")
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ColorsViewProvider.viewType, provider)
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("lineColors.drop", () => {
      console.log("Dropping active color");
      provider.drop()
     }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((textDocumentChangeEvent) => {
      console.log("Recieved text change");
      const activeEditor = vscode.window.activeTextEditor
      if (activeEditor?.document === textDocumentChangeEvent.document) {
        const shiftStatus = calculateShifting(textDocumentChangeEvent)
        provider.shift(shiftStatus)
        provider.applyHighlights(activeEditor, shiftStatus.fp)
      }
    })
  )

  context.subscriptions.push(
  vscode.window.onDidChangeVisibleTextEditors((activeTextEditors) => {
    console.log("Recieved visibility change")
    if (activeTextEditors) {
      activeTextEditors.forEach(activeTextEditor => {
        provider.applyHighlights(activeTextEditor, activeTextEditor?.document.uri.fsPath)
      })
    }
    })
  )
}
