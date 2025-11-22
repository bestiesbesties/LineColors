import * as vscode from "vscode";
import * as fs from "fs";
import { getHTML } from "./utils"

export default class ColorsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "lineColors.colorsView";
  // TODO reposition constructor so not nullable
  private _view?: vscode.WebviewView;
  private _mappingURI?: vscode.Uri
  public _mapping: Record<string, Record<string, string>> = {}; //TODO remove _ or make private again
  private r: vscode.TextEditorDecorationType;
  private g: vscode.TextEditorDecorationType;
  private b: vscode.TextEditorDecorationType;
  private _extensionUri: vscode.Uri
  constructor(
    // Root of the extension for files etc
    private readonly _extensionContext: vscode.ExtensionContext 
  ) { 
    console.log("inside class")
    this.r = this.buildDecorationPreset("red");
    this.g = this.buildDecorationPreset("green");
    this.b = this.buildDecorationPreset("blue");
    this._extensionUri  = this._extensionContext.extensionUri;
    this._mapping = this._extensionContext.globalState.get("lcm", {})
  }

  public shift(n:number, fp:string, fromLine:number, textEditor:vscode.TextEditor, hasEnterAtStart:boolean, hasEnterInBetween:boolean, hasEnterAtEnd:boolean) {
    if ((this._mappingURI) && (this._mapping)) {

      const current = this._mapping[fp] ?? {};
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
               console.log("x19 exitStart:", hasEnterAtStart);
               shifted[String(Number(key) + n)] = current[key];
              after.push(Number(key) + n)
              
            } else if (hasEnterAtEnd) {
              console.log("x19 exitEnd:", hasEnterAtEnd);
              console.log("x33 key:", key); // TODO + what is this key because it might need + 1 for empty color
              console.log("x34 current[key]:", current[key]); 
              shifted[key] = current[key];
              console.log("x34 shifted:", shifted); 
              shifted[String(Number(key) + 1)] = current[key];
              console.log("x34 shifted +1:", shifted); 
              

            } else if (hasEnterInBetween) {
              console.log("x19 exitBetween:", hasEnterInBetween);
              if (n > 0) {
                for (let i = 1; i <= n; i++) {
                  console.log("x19 positive:");
                  shifted[String(Number(key) + i)] = current[key];
                }
              } else {
                for (let i = 1; i >= n; i--) {
                  console.log("x19 negative:");
                  shifted[String(Number(key) + i)] = current[key];
                }
              }
            }

          } else if (n == 0) {
            console.log("x19 nEqual:", n);
            shifted[key] = current[key];
          }
          
        } else if (Number(key) < fromLine) {
          shifted[key] = current[key];
        }
      }

      this._mapping[fp] = shifted;
      console.log("x19 shifted inserted:", JSON.stringify(this._mapping[fp]));
      console.log("x19 after:", after);
      this._extensionContext.globalState.update("lcm", this._mapping);
      this.applyHighlights(textEditor, fp)
    }
  }
    private buildDecorationPreset(colorName:string) {
      let backgroundColor:string = ""
      if (colorName == "red") {
        backgroundColor = 'rgba(255, 0, 0, 1)'
      } else if (colorName == "green") {
        backgroundColor = 'rgba(0, 255, 0, 1)'
      } else if (colorName == "blue") {
        backgroundColor = 'rgba(0, 0, 255, 1)'
      } else {
        backgroundColor = 'rgba(0, 0, 0, 1)'
      }
    return vscode.window.createTextEditorDecorationType({
      isWholeLine: true, // TODO Document that a whole line is not forced and holds more potential
      backgroundColor: backgroundColor
      });
    } 
    private updateHighlight(textEditor: vscode.TextEditor | undefined, color:string | null){
        console.log("call forwarded")
      if (!textEditor) {
        console.log("Error: no texteditor")
        return;
      }
      const file = textEditor.document.uri.fsPath // TODO gives absolutepath i.p.v. relative to workspaceFolder
      const activeLine = textEditor.selection.active.line
      if (color) {

      }
      this.updateMapping(file, [activeLine, activeLine], color)
      this.applyHighlights(textEditor, file)
    }

    public applyHighlights(textEditor: vscode.TextEditor, file: string){
      console.log("setting decorations")
      const rangesRed: Array<vscode.Range> = []
      const rangesGreen: Array<vscode.Range> = []
      const rangesBlue: Array<vscode.Range> = []

      Object.entries(this._mapping[file] ?? {} ).forEach(([key, value]) => {
          console.log(`key: ${key}`)
          console.log(`value: ${value}`)
          let rangeKeys: Array<number> = key.split(",").map(Number)
          console.log(`rangeKeys ${rangeKeys}`)
          console.log(`typeof rangeKeys ${typeof rangeKeys}`)

          const entryRange = new vscode.Range(
            new vscode.Position(rangeKeys[0], 0),
            new vscode.Position(rangeKeys[0], 0)
          )
          
          if (value == "red") {
            rangesRed.push(entryRange)
          } else if (value == "green") {
            rangesGreen.push(entryRange)
          } else if (value == "blue") {
            rangesBlue.push(entryRange)
          } else {
            rangesRed.push(entryRange)
          }
      })
      
      console.log("rangesRed: ", rangesRed)
      console.log("rangesGreen: ", rangesGreen)
      console.log("rangesBlue: ", rangesBlue)
      console.log("pushing to decorations")
      // Expects you to hold your own state/ manage own data structure for range -> effects

      
      textEditor.setDecorations(this.r, rangesRed) // TODO document DecorationOptions hold some potential
      textEditor.setDecorations(this.g, rangesGreen)
      textEditor.setDecorations(this.b, rangesBlue)
    }


  // abstract method of WebView building & managing the webview
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
     _token: vscode.CancellationToken
    ) {
      
        this._view = webviewView;

        webviewView.webview.options = {
          enableScripts : true,
          localResourceRoots : [this._extensionUri]
        };
        
        webviewView.webview.html = getHTML(webviewView.webview, this._extensionUri)

        // TODO check if these functions have to leave 1 indent level
        vscode.workspace.onDidChangeTextDocument((doc) => {

          console.log("mayor trigger")
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
          console.log(`call recieved:  ${data.type} ${data.value}`)
          if ((data.type =="addColor") && (data.color)) {
            this.updateHighlight(vscode.window.activeTextEditor, data.color)
          } else if ((data.type =="removeColor")) {
            this.updateHighlight(vscode.window.activeTextEditor, null)
          } else {
            console.log("data", data)
          }
        });
  }

  public addColor() {
    if (this._view) {
      // If the view is collapsed this will expand it
      this._view.show?.(true)
      this._view.webview.postMessage({type: "addColor"})
    }
  }

  private updateMapping(activefile:string, lines:Array<number>, color:string | null) {
    this._mapping[activefile] ??= {}
    if (color) {
        this._mapping[activefile][`${lines[0]}`] = color 
    } else {
        delete this._mapping[activefile][`${lines[0]}`]
    }
    this._extensionContext.globalState.update("lcm", this._mapping)
}
};