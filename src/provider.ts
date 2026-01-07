import * as vscode from "vscode";
import { getColorMapping } from "./utils"
import { shiftDocumentMapping, ShiftStatus } from "./shifting";

export class Provider {
  public static readonly viewType = "lineColors.colorsView";
  // TODO reposition constructor so not nullable
  public _documentsMapping: Record<string, Record<string, number>> = {}; //TODO remove _ or make private again
  public _colorMapping : Record<string, string>[] //TODO switch to map & alike records to map
  public _decorationsMapping : vscode.TextEditorDecorationType[]
  public _activeColorIndex: number //TODO switch to map & alike records to map
  constructor(
    private readonly _extensionContext: vscode.ExtensionContext
  ) {
    console.log("Constructing provider")
    this._documentsMapping = this._extensionContext.globalState.get("lcdm", {})
    this._colorMapping = this._extensionContext.globalState.get("lcca", getColorMapping())
    this._decorationsMapping = []
    for (let i = 0; i <= 2; i++) {
      this._decorationsMapping.push(this.buildDecorationPreset(this._colorMapping[i].hex))
    }
    this._activeColorIndex = 0
    this.initialHighlights()
  }

  private initialHighlights(){
    const activeTextEditor = vscode.window.activeTextEditor
    const file = vscode.window.activeTextEditor?.document.uri.toString()
    if ((activeTextEditor) && (file)) {
      this.applyHighlights(activeTextEditor, file)
    }
  }

  public reset() {
    this._documentsMapping = {};
    this._extensionContext.globalState.update("lcdm", this._documentsMapping);
  }

  public shift(shiftStatus:ShiftStatus) {
    if (this._documentsMapping) {
      const current = this._documentsMapping[shiftStatus.fp] ?? {};
      this._documentsMapping[shiftStatus.fp] = shiftDocumentMapping(current, shiftStatus);
      console.log("x19 shifted inserted:", JSON.stringify(this._documentsMapping[shiftStatus.fp]));
      this._extensionContext.globalState.update("lcdm", this._documentsMapping);
    }
  }
    private buildDecorationPreset(color:string) {
      return vscode.window.createTextEditorDecorationType({
        isWholeLine: true, // TODO Document that a whole line is not forced and holds potential
        color : undefined, // TODO Document potential for foreground color support
        backgroundColor: color,
        overviewRulerColor : color,
        overviewRulerLane: vscode.OverviewRulerLane.Full
        });
    }

    public applyHighlights(textEditor: vscode.TextEditor, file: string){
      console.log("applyHighlights")
      const rangesHolder: vscode.Range[][] = [[],[],[]]
      Object.entries(this._documentsMapping[file] ?? {} ).forEach(([key, value]) => {
          console.log(`key: ${key} value: ${value}`)
          let rangeKeys: Array<number> = key.split(",").map(Number)
          console.log(`rangeKeys ${rangeKeys}`)
          console.log(`typeof rangeKeys ${typeof rangeKeys}`)
          const entryRange = new vscode.Range(
            new vscode.Position(rangeKeys[0], 0),
            new vscode.Position(rangeKeys[0], 0)
          )
          rangesHolder[value].push(entryRange)
      })
      for (let i = 0;i <=2; i++) {
        textEditor.setDecorations(this._decorationsMapping[i], rangesHolder[i]) // TODO Document DecorationOptions holds potential
      }
    }

  public switchActiveColor() {
    if (this._activeColorIndex  < 2){
      this._activeColorIndex += 1
    } else {
         this._activeColorIndex = 0
    }
  }

  private updateMapping(activefile:string, lines:Array<number>, colorIndex:number) {
    this._documentsMapping[activefile] ??= {}
    if (this._documentsMapping[activefile][`${lines[0]}`] == colorIndex) {
      delete this._documentsMapping[activefile][`${lines[0]}`]
    } else {
      this._documentsMapping[activefile][`${lines[0]}`] = colorIndex
    }
    this._extensionContext.globalState.update("lcdm", this._documentsMapping)
  }

  public drop(selection:vscode.Selection, fp:string){
    console.log("dropped", this._documentsMapping)
    console.log(`Dropped with this._activeColorIndex: ${this._activeColorIndex}`)
    const startLine = selection.start.line
    const endLine = selection.end.line

    for (let line = startLine; line <= endLine; line++) {
      console.log("line", line)
      this.lineInDocumentMapping(fp, line)
      this.updateMapping(fp, [line, line], this._activeColorIndex)
      }
    }

  private lineInDocumentMapping(file:string, line:Number) {
    console.log("lineInDocumentMapping")
    const documentMapping = this._documentsMapping[file]
    if (documentMapping) {
      for (const key of Object.keys(documentMapping)) {
        if (Number(key) == line) {
          console.log("already existing")
        }
      }
    }
  }

  public fileNameUpdate(fileRenameEvent:vscode.FileRenameEvent){
    if (fileRenameEvent.files.length > 0) {
      fileRenameEvent.files.forEach((file) => {
        const newUri = file.newUri.toString()
        const oldUri = file.oldUri.toString()
        this._documentsMapping[newUri] = this._documentsMapping[oldUri]
        delete this._documentsMapping[oldUri]
      })
      this._extensionContext.globalState.update("lcdm", this._documentsMapping)
    }
  }
}
