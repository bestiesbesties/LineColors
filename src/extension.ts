import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

  // const provider = new ColorsViewProvider
}

class ColorsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "LineColors.colorsView";
  private _view: vscode.WebviewView;

  constructor(
    // Root of the extension for files etc
    private readonly _extensionUri: vscode.Uri,
  ) {}

  // abstract method of WebView building & managing the webview
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
     token: vscode.CancellationToken
    ) {
      
        this._view = webviewView;

        webviewView.webview.options = {
          enableScripts : true,
          localResourceRoots : [this._extensionUri]
        };
        
        // webviewView.webview.html

  };

};