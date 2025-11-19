import * as vscode from "vscode";
import * as fs from "fs";

export default class ColorsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "lineColors.colorsView";
  // TODO reposition constructor so not nullable
  private _view?: vscode.WebviewView;
  private _mappingURI?: vscode.Uri
  public _mapping: Record<string, Record<string, string>> = {}; //TODO remove _ or make private again
  private r: vscode.TextEditorDecorationType;
  private g: vscode.TextEditorDecorationType;
  private b: vscode.TextEditorDecorationType;
  constructor(
    // Root of the extension for files etc
    private readonly _extensionUri: vscode.Uri,
    private readonly _extensionContext: vscode.ExtensionContext 
  ) { 
    console.log("inside class")
    this.r = this.buildDecorationPreset("red");
    this.g = this.buildDecorationPreset("green");
    this.b = this.buildDecorationPreset("blue");
    this._loadMapping()
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
      fs.writeFileSync(this._mappingURI.fsPath, JSON.stringify(this._mapping, null, 4));
      this.applyHighlights(textEditor, fp)

      // const afterRanges: vscode.Range[] = []
      // after.forEach(elem => {
      //     const entryRange = new vscode.Range(
      //       new vscode.Position(elem, 0),
      //       new vscode.Position(elem, 0)
      //     )
      //     afterRanges.push(entryRange)
      // })
    //   console.log("x19 afterpush");
    //   if (after.length > 0) {
    //     this.r.dispose()
    //     this.r = this.buildDecorationPreset("red")
    //   }
    }
  }
    // TODO use other data type here
    // private decorationPreset = vscode.window.createTextEditorDecorationType({
    //   isWholeLine: true, // TODO Document that a whole line is not forced and holds more potential
    //   backgroundColor: 'rgba(255, 0, 0, 0.72)',
    // });
    // TODO search/use reliant overiding for decorations
    //TODO Document potential transparancy stacking
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

    // const highlights: Record<string, number[]> = {}
    // TODO check if these functions habe to leave 1 indent level
    // TODO apply smart stacking/merging on insert here
    private applyNewHighlight(textEditor: vscode.TextEditor | undefined, color:string){
        console.log("call forwarded")
      // const lines = highlights[file]
      //   if (!lines) return;
      if (!textEditor) {
        console.log("no texteditor")
        return;
      }
      console.log("x40 1")
      const file = textEditor.document.uri.fsPath // TODO gives absolutepath i.p.v. relative to workspaceFolder
      const activeLine = textEditor.selection.active.line
      console.log("x40 2")
      this._writeMapping(file, [activeLine, activeLine], color)
      console.log("x40 3")
      this.applyHighlights(textEditor, file)
      console.log("x40 4")
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

  private _writeMapping(activefile:string, lines:Array<number>, color:string){
    if (this._mapping) {
        console.log("pushing to local")
        // this in a seperate function
        this._mapping[activefile] ??= {}
        // this._mapping[activefile][`${lines[0]}, ${lines[1]}`] = color 
        this._mapping[activefile][`${lines[0]}`] = color 
        
        console.log("pushed to local")
        // fs.writeFileSync(this._mappingURI.fsPath, JSON.stringify(this._mapping, null, 4))
        this._extensionContext.globalState.update("lcm", this._mapping)
        console.log("pushed to local")
    }
  }

    private _loadMapping() {
      this._mapping = this._extensionContext.globalState.get("lcm", {})
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
        
        webviewView.webview.html = this._getHTML(webviewView.webview)

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

        // recieving some sort of data on call
        webviewView.webview.onDidReceiveMessage((data) => {
          if ((data.type =="newColor") && (data.color)) {

              console.log(`data.type: ${data.type}`)
              console.log(`value: ${data.color}`)
              // logic for if some call is recieved when listened for
              console.log(`call recieved:  ${data.type} ${data.value}`)
              this.applyNewHighlight(vscode.window.activeTextEditor, data.color)
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

  private _getHTML(webview: vscode.Webview) {
    //fs is File System
    // URI is a filosophy of Uniform Resource Identifier
    // vscode.Uri.joinPath is fspath in a uniform way
    // constant of a convertion of an actual filepath (the webview is sandboxed)
    const scriptUri =  webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "main.js"))
    const stylingUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "main.css"))

    // HTML string with injection of resources such as scripts or styling
    const html:string = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <link href="${stylingUri}" rel="stylesheet">
        <title>LineColors</title>
      </head>
    <body>
    
    <div class="inner">
      <div class="overlay">

        <div class="colorGrid">
          <button class="colorRed"></button>
          <button class="colorGreen"></button>
          <button class="colorBlue"></button>
          <button class="colorSelected"></button>
          <div class="middleBlack"></div>
        </div>

        <div class="menu">
          <p> EXP </p>
          <p> IMP </p>
          <p> TOG </p>
          <p> RES </p>
          <p> SETT </p>
        </div>
        
      </div>
     </div>
      <script src="${scriptUri}"></script>  
    </body>
    </html>
    `
    return html;
  }
};