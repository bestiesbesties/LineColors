import * as vscode from "vscode";
export function getHTML(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const scriptUri =  webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "main.js"))
    const stylingUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "main.css"))

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
          <button class="color0"></button>
          <button class="color1"></button>
          <button class="color2"></button>
          <button class="colorRemove"></button>
          <div class="middleBlack"></div>
        </div>
      </div>
     </div>
      <script src="${scriptUri}"></script>  
    </body>
    </html>
    `
    return html;
  }