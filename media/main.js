(function () {
    const vscode = acquireVsCodeApi()

    // const oldState = vscode.getState() || {colors: []}
    // let colors = oldState.colors

    document.querySelector(".newColorButton").addEventListener("click", () => {
        vscode.postMessage({type: "newColor"})
    })

    // TODO event switch to data
    window.addEventListener("message", event => {
        const message = event.data
        switch (message.type) {
            case "addColor": {
                addColor()
                break;
            }
        }
    })
}())