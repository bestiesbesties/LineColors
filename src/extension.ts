import * as vscode from "vscode";
import { Provider } from "./provider"
import { calculateShifting } from "./shifting"
import { updateStatusBarItem } from "./utils"

let statusBarItem: vscode.StatusBarItem

export function activate(context: vscode.ExtensionContext) {
  console.log("Initializing LineColors")
  const provider = new Provider(context)

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1)
  updateStatusBarItem(statusBarItem, provider._colorMapping[provider._activeColorIndex])

  context.subscriptions.push(
  vscode.commands.registerCommand("lineColors.reset", () => {
    console.log("Resetting LineColors globals");
    provider.reset()
    const activeEditor = vscode.window.activeTextEditor
    if (activeEditor) {
      provider.applyHighlights(activeEditor, activeEditor.document.uri.toString())
    }
    vscode.window.showInformationMessage("LineColors has been totally reset.");
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("lineColors.switch", () => {
      console.log("Switching active color")
      provider.switchActiveColor()
      console.log(provider._colorMapping[provider._activeColorIndex])
    // Note*: only the following background colors are supported:
		 //`new ThemeColor('statusBarItem.errorBackground')`
		 //`new ThemeColor('statusBarItem.warningBackground')`
    // More background colors may be supported in the future.
    statusBarItem = updateStatusBarItem(statusBarItem, provider._colorMapping[provider._activeColorIndex])
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("lineColors.drop", () => {
      console.log("Dropping active color");
      const activeEditor = vscode.window.activeTextEditor
      if (activeEditor) {
        provider.drop(activeEditor.selection, activeEditor.document.uri.toString())
        provider.applyHighlights(activeEditor, activeEditor.document.uri.toString())
      }
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
        provider.applyHighlights(activeTextEditor, activeTextEditor?.document.uri.toString())
      })
    }
    })
  )
  console.log("Initialized LineColors")
}
