import * as vscode from "vscode";
import { getHTML } from "./utils"

export default class ColorsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "lineColors.colorsView";
  // TODO reposition constructor so not nullable
  private _view?: vscode.WebviewView;
  public _documentMapping: Record<string, Record<string, number>> = {}; //TODO remove _ or make private again
  public _colorMapping : string[]
  public _decorationsMapping : vscode.TextEditorDecorationType[]
  public _activeColorIndex: number
  private _extensionUri: vscode.Uri
  constructor(
    private readonly _extensionContext: vscode.ExtensionContext 
  ) { 
    console.log("Initializing ColorsViewProvider")
    this._extensionUri  = this._extensionContext.extensionUri;
    this._documentMapping = this._extensionContext.globalState.get("lcdm", {})// TODO documentSmapping
    this._colorMapping = this._extensionContext.globalState.get("lccm", ['rgba(255, 0, 0, 0.5)', 'rgba(0, 255, 0, 0.5)', 'rgba(0, 0, 255, 0.5)'])
    this._decorationsMapping = []
    for (let i = 0; i <= 2; i++) {
      this._decorationsMapping.push(this.buildDecorationPreset(this._colorMapping[i]))
    }
    this._activeColorIndex = 0
    this.initialHighlights()
  }

  private initialHighlights(){
    const activeTextEditor = vscode.window.activeTextEditor
    const file = vscode.window.activeTextEditor?.document.fileName
    if ((activeTextEditor) && (file)) {
      this.applyHighlights(activeTextEditor, file)
    }
  }

  public shift(n:number, fp:string, fromLine:number, textEditor:vscode.TextEditor, hasEnterAtStart:boolean, hasEnterInBetween:boolean, hasEnterAtEnd:boolean) {
    if (this._documentMapping) {

      const current = this._documentMapping[fp] ?? {};
      const shifted: Record<string, any> = {};
      const after: number[] = []
      for (const key of Object.keys(current)) {
        console.log("x19 Number(key):", Number(key));
        console.log("x19 fromLine:", fromLine);

        if (Number(key) > fromLine) {
          shifted[String(Number(key) + n)] = current[key];
        } else if (Number(key) == fromLine) {
          if (n < 0) {
            console.log("x19 nDeletion:", n);
            shifted[String(Number(key) + n)] = current[key];
            after.push(Number(key) + n + 1)
            // shifted[key] = current[key];
          } else if (n > 0) {
            console.log("x19 nInsertion:", n);
          
            if (hasEnterAtStart) {
               shifted[String(Number(key) + n)] = current[key];
              after.push(Number(key) + n)
              
            } else if (hasEnterAtEnd) {
              console.log("x33 key:", key); // TODO + what is this key because it might need + 1 for empty color
              shifted[key] = current[key];
              shifted[String(Number(key) + 1)] = current[key];
              

            } else if (hasEnterInBetween) {
              if (n > 0) {
                for (let i = 1; i <= n; i++) {
                  shifted[String(Number(key) + i)] = current[key];
                }
              } else {
                for (let i = 1; i >= n; i--) {
                  shifted[String(Number(key) + i)] = current[key];
                }
              }
            }

          } else if (n == 0) {
            shifted[key] = current[key];
          }
          
        } else if (Number(key) < fromLine) {
          shifted[key] = current[key];
        }
      }
      this._documentMapping[fp] = shifted;
      console.log("x19 shifted inserted:", JSON.stringify(this._documentMapping[fp]));
      this._extensionContext.globalState.update("lcdm", this._documentMapping);
      this.applyHighlights(textEditor, fp)
    }
  }
    private buildDecorationPreset(color:string) {
      return vscode.window.createTextEditorDecorationType({
        isWholeLine: true, // TODO Document that a whole line is not forced and holds more potential
        backgroundColor: color
        });
    } 

    public applyHighlights(textEditor: vscode.TextEditor, file: string){
      console.log("applyHighlights")
      const rangesHolder: vscode.Range[][] = [[],[],[]]
      Object.entries(this._documentMapping[file] ?? {} ).forEach(([key, value]) => {
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
        textEditor.setDecorations(this._decorationsMapping[i], rangesHolder[i]) // TODO document DecorationOptions holds some potential
      }
    }
    
  // abstract method of WebView building & managing the webview
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
     _token: vscode.CancellationToken
    ) {
        console.log("resolveWebviewView")
        this._view = webviewView;
        webviewView.webview.options = {
          enableScripts : true,
          localResourceRoots : [this._extensionUri]
        };
        webviewView.webview.html = getHTML(webviewView.webview, this._extensionUri)

        // TODO check if these functions have to leave 1 indent level
        vscode.workspace.onDidChangeTextDocument((doc) => {
          // from all the text editors search for the 1 holding the document
          // const textEditor = vscode.window.visibleTextEditors.find((textEditor) => textEditor.document === doc)
          const textEditor = vscode.window.activeTextEditor
          // TODO multiple editors possibly holding the document`
          if (textEditor) {
            console.log(`pushing to applyHighlights -> ${textEditor?.document.uri.fsPath}`)
            this.applyHighlights(textEditor, textEditor?.document.uri.fsPath)
          } else {
            console.log("Muliple editors holding document")
          }
          console.log(`typeof textEditor ${typeof  textEditor}`)
        })

        webviewView.webview.onDidReceiveMessage((data) => {
          console.log(`call recieved:  ${data.type} ${data.colorIndex}`)
          if ((data.type =="setHighlighActivation") && (data.colorIndex >= 0)) {
           this._activeColorIndex = data.colorIndex
          }
        });
  }

  private updateMapping(activefile:string, lines:Array<number>, colorIndex:number) {
    this._documentMapping[activefile] ??= {}
    if (this._documentMapping[activefile][`${lines[0]}`] == colorIndex) {
      delete this._documentMapping[activefile][`${lines[0]}`]
    } else {
      this._documentMapping[activefile][`${lines[0]}`] = colorIndex
    }
    this._extensionContext.globalState.update("lcdm", this._documentMapping)
  }

  public drop(){
    console.log(`Dropped with this._activeColorIndex: ${this._activeColorIndex}`)
    const textEditor = vscode.window.activeTextEditor
    if (!textEditor) {
      console.log("Error: no active texteditor")
      return;
    }
    const selection = textEditor.selection
    const startLine = selection.start.line
    const endLine = selection.end.line
    const activeFilepath = textEditor.document.uri.fsPath

    for (let line = startLine; line <= endLine; line++) {
      console.log("line", line)
      this.lineInDocumentMapping(activeFilepath, line)
      this.updateMapping(activeFilepath, [line, line], this._activeColorIndex)
    }
    this.applyHighlights(textEditor, textEditor.document.fileName)
    }

    private lineInDocumentMapping(file:string, line:Number) {
      console.log("lineInDocumentMapping")
      const documentMapping = this._documentMapping[file]
      if (documentMapping) {
        for (const key of Object.keys(documentMapping)) {
          if (Number(key) == line) {
            console.log("already existing")
          }
      }
    }
  }
}