(function () {
    const vscode = acquireVsCodeApi()

    // const oldState = vscode.getState() || {colors: []}
    // let colors = oldState.colors

    // document.getElementById('colorPicker').addEventListener('input', (e) => {
    //     console.log("e.target.value", e.target.value)
    //     vscode.postMessage({ color: e.target.value });
    // });

    let activeColor = "white"
    // const newColorButton = document.querySelector(".newColorButton")
    // newColorButton.addEventListener("click", () => {
    //     vscode.postMessage({type: "newColor", color : activeColor})
    // })

    const buttons = document.querySelectorAll(".colorGrid button");
    buttons.forEach(element => {
        element.addEventListener("click", () => {
            // getComputedStyle to get CSS
            console.log(`color pressed ${element.style.backgroundColor}`);
            activeColor = element.className.slice(5).toLowerCase()
            vscode.postMessage({type: "newColor", color : activeColor})
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