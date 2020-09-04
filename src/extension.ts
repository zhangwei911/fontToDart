// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log(
        'Congratulations, your extension "fonttodartts" is now active!'
    );

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand(
        "fonttodartts.fontToDart",
        async () => {
            // The code you place here will be executed every time your command is executed
            let jsonUris = await vscode.window.showOpenDialog({
                canSelectMany: false,
                filters: { Json: ["json"] },
            });
            if (jsonUris != undefined) {
                // 👍 only works with files on disk
                let doc = await vscode.workspace.openTextDocument(jsonUris[0]);
                let iconJson = JSON.parse(doc.getText());
                let myIconsCode =
                    "import 'package:flutter/cupertino.dart';\n\nclass MyIcons {\n";
                iconJson.glyphs.forEach((icon: any) => {
                    myIconsCode += `    static IconData ${icon.name.replace(
                        "-",
                        "_"
                    )} = getIcons(0x${icon.unicode});\n`;
                });
                myIconsCode +=
                    "\n    static IconData getIcons(int unicode, {String fontFamily = 'MyIcons'}) => IconData(unicode, fontFamily: fontFamily);\n}";
                console.log(myIconsCode);
                let myIconsUris = await vscode.workspace.findFiles(
                    "**/my_icons.dart"
                );
                console.log(myIconsUris);
                var myIconsUri: vscode.Uri;
                if (myIconsUris.length == 0) {
                    myIconsUri = vscode.Uri.file(
                        vscode.workspace.rootPath +
                            "/lib/utils/my_icons.dart"
                    );
                } else {
                    myIconsUri = myIconsUris[0];
                }
                vscode.workspace.fs.writeFile(
                    myIconsUri,
                    stringToUint8Array(myIconsCode)
                );
                console.log(`写入${myIconsUri.toString()}成功!`);
                // await vscode.window.showTextDocument(doc, { preview: true });
                // Display a message box to the user
                // vscode.window.showInformationMessage("Hello World from fontToDartTS!");
                vscode.window.showInformationMessage(
                    `写入${myIconsUri.toString()}成功!`
                );
                // vscode.window.showInformationMessage(doc.getText());
            }
        }
    );

    console.log("注册fonttodartts.helloWorld成功");
    0;
    context.subscriptions.push(disposable);
}

export function stringToUint8Array(str: String) {
    var arr = [];
    for (var i = 0, j = str.length; i < j; ++i) {
        arr.push(str.charCodeAt(i));
    }

    var tmpUint8Array = new Uint8Array(arr);
    return tmpUint8Array;
}

// this method is called when your extension is deactivated
export function deactivate() {}
