(function () {
    const vscode = acuireVsCodeApi()

    const oldState = vscode.getstate() || {colors: []}

    let colors = oldState.colors

    // TODO implement
    updateColorList(colors)

    document.querySelector(".myButton").addEventListener("click", () => {
        addColor()
    })

    // TODO event switch to data
    window.addEventListener('message', event => {
        const message = event.data
        switch (message.type) {
            case "addColor": {
                addColor()
                break;
            }
        }
    })

    function updateColorList(colors){
        vscode.setState({colors: colors})
    }

    function addColor() {
        console.log("adding new color")
        colors.push({ value: "020202"})
        updateColorList()
    }
}())