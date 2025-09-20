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

  // context.subscriptions.push(
  //   vscode.window.onDidChangeActiveTextEditor(activeTextEditor => {
  //     if (activeTextEditor) {
  //       console.log("triggered from context")
  //       provider.applyHighlights(activeTextEditor, activeTextEditor?.document.uri.fsPath)
  //     }
  //   })
  // )

  context.subscriptions.push(
  vscode.window.onDidChangeVisibleTextEditors(activeTextEditors => {
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
  private _mapping: Record<string, Record<string, string>> = {};
  constructor(
    // Root of the extension for files etc
    private readonly _extensionUri: vscode.Uri,
  ) { 
    console.log("inside class")
    this._initializeMappingURI(vscode.workspace.workspaceFolders?.[0] ?? null)
    this._readMapping(this._mappingURI)
  }

  // TODO use other data type here
    private decorationPreset = vscode.window.createTextEditorDecorationType({
      isWholeLine: true, // TODO Document that a whole line is not forced and holds more potential
      backgroundColor: 'rgba(255, 0, 0, 0.72)',
    });

    // const highlights: Record<string, number[]> = {}
    // TODO check if these functions habe to leave 1 indent level
    // TODO apply smart stacking/merging on insert here
    private applyNewHighlight(textEditor: vscode.TextEditor | undefined){
        console.log("call forwarded")
      // const lines = highlights[file]
      //   if (!lines) return;
      if (!textEditor) {
        console.log("no texteditor")
        return;
      }
      const file = textEditor.document.uri.fsPath // TODO gives absolutepath i.p.v. relative to workspaceFolder
      const activeLine = textEditor.selection.active.line
      this._writeMapping(file, [activeLine, activeLine])
      this.applyHighlights(textEditor, file)
    }
    
    public applyHighlights(textEditor: vscode.TextEditor, file: string){
      console.log("setting decorations")
      const ranges: Array<vscode.Range> = []
      Object.keys(this._mapping[file] ?? {} ).forEach(key => {
          console.log(`key: ${key}`)
          let rangeKeys: Array<number> = key.split(",").map(Number)
          console.log(`rangeKeys ${rangeKeys}`)
          console.log(`typeof rangeKeys ${typeof rangeKeys}`)
          ranges.push(
          new vscode.Range(
            new vscode.Position(rangeKeys[0], 0),
            new vscode.Position(rangeKeys[1], 1)
          )
        )
      })
      
      console.log("ranges: ", ranges)
      console.log("pushing to decorations")
      // Expects you to hold your own state/ manage own data structure for range -> effects
      textEditor.setDecorations(this.decorationPreset, ranges) // TODO document DecorationOptions hold some potential
    }

  private _writeMapping(activefile:string, lines:Array<number>){
    if ((this._mappingURI) && (this._mapping)) {
        console.log("pushing...")
        console.log()

        // this in a seperate function
        this._mapping[activefile] ??= {}
        this._mapping[activefile][`${lines[0]}, ${lines[1]}`] = "#F54927"  
        
        console.log("pushing to local")
        fs.writeFileSync(this._mappingURI.fsPath, JSON.stringify(this._mapping, null, 4))
        console.log("pushing to file")
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

        // TODO check if these functions habe to leave 1 indent level
        vscode.workspace.onDidChangeTextDocument(doc => {

          console.log("mayor trigger")
          // from all the text editors search for the 1 holding the document
          // const textEditor = vscode.window.visibleTextEditors.find(textEditor => textEditor.document === doc)
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
        webviewView.webview.onDidReceiveMessage(data => {
          if (data.type =="newColor") {
              // logic for if some call is recieved when listened for
              console.log(`call recieved:  ${data.type} ${data.value}`)
              this.applyNewHighlight(vscode.window.activeTextEditor)
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
      <ul class="myList">
      </ul>
        <button class="newColorButton">Color activeline</button>
        <script src="${scriptUri}"></script>
    </body>
    </html>
    `
    return html;
  }
};