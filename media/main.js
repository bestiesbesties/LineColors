(function () {
    const vscode = acquireVsCodeApi()

    // const oldState = vscode.getState() || {colors: []}
    // let colors = oldState.colors

    // document.getElementById('colorPicker').addEventListener('input', (e) => {
    //     console.log("e.target.value", e.target.value)
    //     vscode.postMessage({ color: e.target.value });
    // });

    // const newColorButton = document.querySelector(".newColorButton")
    // newColorButton.addEventListener("click", () => {
    //     vscode.postMessage({type: "newColor", color : activeColor})
    // })

    const buttons = document.querySelectorAll(".colorGrid button");
    buttons.forEach(element => {
        element.addEventListener("click", () => {
            // getComputedStyle to get CSS
            console.log(`color pressed ${element.style.backgroundColor}`);
            const activation = element.className.slice(5).toLowerCase()
            if (activation == "remove") {
                vscode.postMessage({type: "removeColor" })
            } else {
                vscode.postMessage({type: "addColor", color : activation})
            }
        });
    });
    
    // TODO event switch to data
    // window.addEventListener("message", event => {
    //     const message = event.data
    //     switch (message.type) {
    //         case "addColor": {
    //             addColor()
    //             break;
    //         }
    //     }
    // })
}())