import * as vscode from "vscode";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext) {
  const provider = new ColorsViewProvider(context.extensionUri)
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
          console.log("x14 Range:", change.range);
          console.log("x19 Range.start.line:", change.range.start.line); //TODO <----
          console.log("x19 Range.end.line:", change.range.end.line); //TODO <----
          console.log("x14 Range.isSingleLine", change.range.isSingleLine);
          console.log("x14 RangeLength:", change.rangeLength);

          const inserted = (change.text.match(/\n/g) ?? []).length;
          const removed = change.range.end.line - change.range.start.line;
          const lineDelta = inserted - removed;

          provider.shift(
            lineDelta, 
            textDocumentChangeEvent.document.uri.fsPath, 
            change.range.end.line,
            activeEditor)
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

class ColorsViewProvider implements vscode.WebviewViewProvider {
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
  ) { 
    console.log("inside class")
    this.r = this.buildDecorationPreset("red");
    this.g = this.buildDecorationPreset("green");
    this.b = this.buildDecorationPreset("blue");
    this._initializeMappingURI(vscode.workspace.workspaceFolders?.[0] ?? null)
    this._readMapping(this._mappingURI)
  }

  public shift(n:number, fp:string, fromLine:number, textEditor:vscode.TextEditor) {
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
            after.push(Number(key) + n - 1)
            // shifted[key] = current[key];
          } else if (n > 0) {
            console.log("x19 nInsertion:", n);
            after.push(Number(key) + n)
            shifted[key] = current[key];
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
      console.log("x19 afterpush");
      if (after.length > 0) {
        this.r.dispose()
        this.r = this.buildDecorationPreset("red")
      }
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
      const file = textEditor.document.uri.fsPath // TODO gives absolutepath i.p.v. relative to workspaceFolder
      const activeLine = textEditor.selection.active.line
      this._writeMapping(file, [activeLine, activeLine], color)
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

  private _writeMapping(activefile:string, lines:Array<number>, color:string){
    if ((this._mappingURI) && (this._mapping)) {
        console.log("pushing to local")
        // this in a seperate function
        this._mapping[activefile] ??= {}
        // this._mapping[activefile][`${lines[0]}, ${lines[1]}`] = color 
        this._mapping[activefile][`${lines[0]}`] = color 
        
        console.log("pushing to file")
        fs.writeFileSync(this._mappingURI.fsPath, JSON.stringify(this._mapping, null, 4))
    }
  }

    private _readMapping(mappingURI: vscode.Uri | undefined){
    console.log(` mappingURI: ${mappingURI}`)
      if (mappingURI) {
        const content = fs.readFileSync(mappingURI.fsPath, "utf-8")
        console.log(` content: ${content}`)
        console.log(` content: ${typeof content}`)

        const mapping = JSON.parse(content)
        this._mapping = mapping
        console.log(" mapping:", mapping)
        console.log(" this._mapping:", this._mapping)
      }
    }

    private _initializeMappingURI(activeFolder:vscode.WorkspaceFolder | null){
    console.log("inside function")
    // TODO there can be 0 or 1 or more workspaceFolders (multi-root workspace)
    const testdata = {}
    // TODO use {}
    const data = JSON.stringify(testdata, null, 4)

    console.log(` data: ${data}`)
    console.log(` activeFolder: ${activeFolder?.uri}`)
    console.log(` activeFolder: ${activeFolder?.name}`)

    if (activeFolder) {
      const mappingURI = vscode.Uri.joinPath(activeFolder.uri, "lcm.json")
      const lcmPath = mappingURI.fsPath
      if (!fs.existsSync(lcmPath)) {
            fs.writeFileSync(lcmPath, data)
            // TODO try except if creating didnt work
            console.log(`Created LCM file at ${lcmPath} is: ${fs.existsSync(lcmPath)}`)
            this._mappingURI = mappingURI
      }
      else {
        console.log(`Loading LCM file from ${lcmPath}`)
        this._mappingURI = mappingURI
        return true
      }

      return true
    }
    else {
      console.log("No workspace")
      return false
    }
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

        <button class="newColorButton">Color activeline</button>
      <div class="setColorRow">
          <button class="colorRed"></button>
          <button class="colorGreen"></button>
          <button class="colorBlue"></button>
      </div>
      <script src="${scriptUri}"></script>  
    </body>
    </html>
    `
    return html;
  }
};