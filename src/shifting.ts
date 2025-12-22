import * as vscode from "vscode";

export enum ShiftEnterPosition {
  hasEnterAtStart,
  hasEnterInBetween,
  hasEnterAtEnd
}

export type ShiftStatus = {
    delta:number,
    fp:string,
    fromLine:number,
    shiftEnterPosition:ShiftEnterPosition
}

export function calculateShifting(textDocumentChangeEvent:vscode.TextDocumentChangeEvent): ShiftStatus {
    const change = textDocumentChangeEvent.contentChanges[0] // TODO Iterate over list
        const inserted = (change.text.match(/\n/g) ?? []).length;
        const removed = change.range.end.line - change.range.start.line;
        const delta = inserted - removed;

        const line = textDocumentChangeEvent.document.lineAt(change.range.start.line);
        const currentInsertPos = change.range.start.character;
        let shiftEnterPosition
        if (currentInsertPos === 0) {
            shiftEnterPosition = ShiftEnterPosition.hasEnterAtStart
        } else if (currentInsertPos === line.text.length) {
            shiftEnterPosition = ShiftEnterPosition.hasEnterAtEnd
        } else {
            shiftEnterPosition = ShiftEnterPosition.hasEnterInBetween
        }

        const shiftStatus:ShiftStatus = {
            delta : delta,
            fp : textDocumentChangeEvent.document.uri.fsPath,
            fromLine : change.range.end.line,
            shiftEnterPosition : shiftEnterPosition
        }
        console.log("shiftStatus:", shiftStatus); //TODO remove
        return shiftStatus
    }


export function shiftDocumentMapping(current:Record<string, number>, shiftStatus:ShiftStatus): Record<string, number> {
    const shifted: Record<string, any> = {};
      const after: number[] = []
      for (const key of Object.keys(current)) {
        console.log("x19 Number(key):", Number(key));
        console.log("x19 fromLine:", shiftStatus.fromLine);

        if (Number(key) > shiftStatus.fromLine) {
          shifted[String(Number(key) + shiftStatus.delta)] = current[key];
        } else if (Number(key) == shiftStatus.fromLine) {
          if (shiftStatus.delta < 0) {
            console.log("x19 nDeletion:", shiftStatus.delta);
            shifted[String(Number(key) + shiftStatus.delta)] = current[key];
            after.push(Number(key) + shiftStatus.delta + 1)
            // shifted[key] = current[key];
          } else if (shiftStatus.delta > 0) {
            console.log("x19 nInsertion:", shiftStatus.delta);

            if (shiftStatus.shiftEnterPosition === ShiftEnterPosition.hasEnterAtStart) {
               shifted[String(Number(key) + shiftStatus.delta)] = current[key];
              after.push(Number(key) + shiftStatus.delta)

            } else if (shiftStatus.shiftEnterPosition === ShiftEnterPosition.hasEnterAtEnd) {
              console.log("x33 key:", key); // TODO + what is this key because it might need + 1 for empty color
              shifted[key] = current[key];
              shifted[String(Number(key) + 1)] = current[key];


            } else if (shiftStatus.shiftEnterPosition === ShiftEnterPosition.hasEnterInBetween) {
              if (shiftStatus.delta > 0) {
                for (let i = 1; i <= shiftStatus.delta; i++) {
                  shifted[String(Number(key) + i)] = current[key];
                }
              } else {
                for (let i = 1; i >= shiftStatus.delta; i--) {
                  shifted[String(Number(key) + i)] = current[key];
                }
              }
            }

          } else if (shiftStatus.delta == 0) {
            shifted[key] = current[key];
          }

        } else if (Number(key) < shiftStatus.fromLine) {
          shifted[key] = current[key];
        }
      }
      return shifted
}
