import * as vscode from "vscode";

export function updateStatusBarItem(statusBarItem:vscode.StatusBarItem, color:Record<string, string>) {
    statusBarItem.text = `$(list-selection) ${color.name} (${color.hex})`
    statusBarItem.tooltip = "test"
    statusBarItem.show()
}

export function getColorMapping(): Record<string, string>[]  {
    return [
            {
            "name" : "Red",
            "hex" : "#FF000070"
            },
            {
            "name" : "Green",
            "hex" : "#00FF0070"
            },
            {
            "name" : "Blue",
            "hex" : "#0000FF70"
            }
          ]
  }
