import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const provider = new ColorsViewProvider(context.extensionUri)
  console.log("Initialized LineColors")
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ColorsViewProvider.viewType, provider)
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("lineColors.addColor", () => { provider.addColor() } )
  )
  
}

class ColorsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "lineColors.colorsView";
  // TODO reposition constructor so not nullable
  private _view?: vscode.WebviewView;

  constructor(
    // Root of the extension for files etc
    private readonly _extensionUri: vscode.Uri,
  ) {}

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

        // TODO use other data type here
        const decorationPreset = vscode.window.createTextEditorDecorationType({
          isWholeLine: true,
          backgroundColor: 'rgba(0, 187, 255, 0.72)',
        });

        // const highlights: Record<string, number[]> = {}

        function applyHighlight(textEditor: vscode.TextEditor | undefined){
          // const file = textEditor.document.uri.fsPath
          // const lines = highlights[file]
          //   if (!lines) return;

          if (!textEditor) {
            console.log("no texteditor")
            return;
          };

            const activeLine = textEditor.selection.active.line
            const activeRange = new vscode.Range(
              new vscode.Position(activeLine, 0),
              new vscode.Position(activeLine,1)
            )
          console.log("setting decorations")
          textEditor.setDecorations(decorationPreset, [activeRange])
        }

        // TODO check if these functions habe to leave 1 indent level
        
        vscode.workspace.onDidOpenTextDocument(doc => {
          // from all the text editors search for the 1 holding the document
          const textEditor = vscode.window.visibleTextEditors.find(textEditor => textEditor.document === doc)
          // TODO multiple editors possibly holding the document`
          if (textEditor) {
            console.log()
          }
        })

        // recieving some sort of data on call
        webviewView.webview.onDidReceiveMessage(data => {
          if (data.type =="newColor") {
              // logic for if some call is recieved when listened for
              console.log(`call recieved:  ${data.type} ${data.value}`)
              applyHighlight(vscode.window.activeTextEditor)
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