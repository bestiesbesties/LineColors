(function () {
    const vscode = acquireVsCodeApi()

    // const oldState = vscode.getState() || {colors: []}
    // let colors = oldState.colors

    let activeColor = "white"
    const newColorButton = document.querySelector(".newColorButton")
    newColorButton.addEventListener("click", () => {
        vscode.postMessage({type: "newColor", color : activeColor})
    })

    const buttons = document.querySelectorAll(".setColorRow button");
    buttons.forEach(element => {
        element.addEventListener("click", () => {
            // getComputedStyle to get CSS
            console.log(`color pressed ${element.style.backgroundColor}`);
            newColorButton.style.backgroundColor = getComputedStyle(element).backgroundColor;;
            activeColor = element.className.slice(5).toLowerCase()
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