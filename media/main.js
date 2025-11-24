(function () {
    const vscode = acquireVsCodeApi()

    const buttons = document.querySelectorAll(".colorGrid button");
    buttons.forEach(element => {
        element.addEventListener("click", () => {
            console.log(`activation ${Number(element.className.slice(5))}`)
            vscode.postMessage({type: "setHighlighActivation", colorIndex :  Number(element.className.slice(5))});
            }
        );
    });
    
}())