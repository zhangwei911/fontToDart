// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import * as xml2js from 'xml2js';

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
                let fieldCode = '';
                let getCode = `
                        static IconData get(String iconName) {
                            switch(iconName) {
                                `;
                iconJson.glyphs.forEach((icon: any) => {
                    let iconName = icon.font_class.replace(RegExp("-", "g"), "_");
                    myIconsCode += `    static IconData ${iconName} = const IconData(0x${icon.unicode}, fontFamily: 'MyIcons');\n`;
                    fieldCode += `    static String ${iconName}Field = '${iconName}';\n`;
                    getCode += `
        case '${iconName}':
            return MyIcons.${iconName};
            break;
                                    `;
                });
                myIconsCode += fieldCode;
                myIconsCode += getCode;
                myIconsCode += `
                            }
                        }
                    }`;
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
    fontSvgToDart(context);
    addSingleSvgToDart(context);
}

function fontSvgToDart(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand(
        "fonttodartts.svgToDart",
        async () => {
            let jsUris = await vscode.window.showOpenDialog({
                canSelectMany: false,
                filters: { 'Js': ["js"] },
            });
            if (jsUris != undefined) {
                let doc = await vscode.workspace.openTextDocument(jsUris[0]);
                let text = doc.getText();
                let svgXmlStr = text.substring(text.indexOf('<svg>'), text.indexOf('</svg>') + 6);

                let parseString: any = xml2js.parseString;
                parseString(svgXmlStr, async function (err: Error, result: any) {
                    if (err) {
                        console.log(err);
                    }
                    console.log(result);
                    let svgCode = "import 'package:flutter/cupertino.dart';\nimport 'package:flutter_svg/svg.dart';\n\nenum IconNames{";
                    let symbolIndex = 0;
                    let symbolLen = result.svg.symbol.length;
                    result.svg.symbol.forEach((element: any) => {
                        svgCode += `${element.$.id
                            .replace(RegExp("-", "g"), "_")
                            .replace("icon_", "")}`;
                        if (symbolIndex < symbolLen - 1) {
                            svgCode += ',';
                        }
                        symbolIndex++;
                    });
                    svgCode += '}';
                    svgCode += `\n\nclass IconFont extends StatelessWidget {
  final IconNames name;
  final String color;
  final List<String> colors;
  final double size;

  IconFont(this.name, { this.size = 14, this.color, this.colors });

  static String getColor(int arrayIndex, String color, List<String> colors, String defaultColor) {
    if (color != null && color.isNotEmpty) {
      return color;
    }

    if (colors != null && colors.isNotEmpty && colors.length > arrayIndex) {
      return colors.elementAt(arrayIndex);
    }

    return defaultColor;
  }

  @override
  Widget build(BuildContext context) {
    String svgXml;

    switch (this.name) {`;
                    symbolIndex = 0;
                    let fastCode = '';
                    let getCode = `
                        static IconFont get(String iconName,{String color ,List<String> colors, double size}) {
                            switch(iconName) {
                                `;
                    let fieldCode = "";
                    result.svg.symbol.forEach((element: any) => {
                        let paths = element.path;
                        let pathCode = '';
                        let iconName = element.$.id.replace(RegExp("-", "g"), "_")
                            .replace(
                                "icon_",
                                ""
                            );
                        fastCode += `IconFont.${iconName}({this.color, this.colors, this.size}):name = IconNames.${iconName},super();\n`;
                        fieldCode += `    static String ${iconName}Field = '${iconName}';\n`;
                        getCode += `
        case '${iconName}':
            return IconFont.${iconName}(color:color, colors:colors, size:size);
            break;
                            `;
                        for (let i = 0; i < paths.length; i++) {
                            let path = paths[i];
                            let d = path.$.d;
                            let color = path.$.fill;
                            pathCode += `<path
              d="${d}"
              fill="''' + getColor(${i}, color, colors, '${color == undefined ? '#000000' : color}') + '''"
            />`;
                        }
                        svgCode += `\ncase IconNames.${iconName}:\n svgXml = '''<svg viewBox="${element.$.viewBox}" xmlns="http://www.w3.org/2000/svg">
                        ${pathCode}
                        </svg>''';\nbreak;\n`;
                        symbolIndex++;
                    });
                    getCode += `
                }
            }`;
                    svgCode += `    }

    if (svgXml == null) {
      return new Container(width: 0, height: 0);
    }

    return SvgPicture.string(svgXml, width: this.size, height: this.size);
  }
  ${fastCode}

  ${fieldCode}

  ${getCode}
}`;
                    console.log(svgCode);
                    let mySvgIconsUris = await vscode.workspace.findFiles(
                        "**/my_svg_icons.dart"
                    );
                    console.log(mySvgIconsUris);
                    var mySvgIconsUri: vscode.Uri;
                    if (mySvgIconsUris.length == 0) {
                        mySvgIconsUri = vscode.Uri.file(
                            vscode.workspace.rootPath +
                            "/lib/utils/my_svg_icons.dart"
                        );
                    } else {
                        mySvgIconsUri = mySvgIconsUris[0];
                    }
                    vscode.workspace.fs.writeFile(
                        mySvgIconsUri,
                        stringToUint8Array(svgCode)
                    );
                    console.log(`写入${mySvgIconsUri.toString()}成功!`);
                    vscode.window.showInformationMessage(
                        `写入${mySvgIconsUri.toString()}成功!`
                    );
                });
            }
        }
    );
    context.subscriptions.push(disposable);
}

function addSingleSvgToDart(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand(
        "fonttodartts.singleSvgToDart",
        async () => {
            let svgUris = await vscode.window.showOpenDialog({
                canSelectMany: false,
                filters: { 'SVG': ["svg"] },
            });
            if (svgUris != undefined) {
                let mySvgIconsUris = await vscode.workspace.findFiles(
                    "**/my_svg_icons_single.dart"
                );
                var mySvgIconsUri: vscode.Uri;
                var content_1 = '';
                var content0 = '';
                var content1 = '';
                var content2 = '';
                var content3 = '';
                var content4 = '';
                var content5 = '';
                var content6 = '';
                var content7 = '';
                var content8 = '';

                content_1 = `
                ///start-1
import 'package:flutter/cupertino.dart';
import 'package:flutter_svg/svg.dart';

enum IconNamesSingle {
    ///end-1
    `;
                content0 = `///start0
                    `;
                content1 = `
    ///start1
}

class IconFontSingle extends StatelessWidget {
  final IconNamesSingle name;
  final String color;
  final List<String> colors;
  final double size;

  IconFontSingle(this.name, {this.size = 14, this.color, this.colors});

  static String getColor(int arrayIndex, String color, List<String> colors, String defaultColor) {
    if (color != null && color.isNotEmpty) {
      return color;
    }

    if (colors != null && colors.isNotEmpty && colors.length > arrayIndex) {
      return colors.elementAt(arrayIndex);
    }

    return defaultColor;
  }

  @override
  Widget build(BuildContext context) {
    String svgXml;

    switch (this.name) {
      ///end1
                `;
                content2 = `///start2
                    `;
                content3 = `

        ///start3
    }

    if (svgXml == null) {
      return new Container(width: 0, height: 0);
    }

    return SvgPicture.string(svgXml, width: this.size, height: this.size);
  }
///end3
                    `;
                content4 = `///start4
                    `;
                content5 = `///start5
                    `;
                content6 = `

  ///start6

  static IconFontSingle get(String iconName, {String color, List<String> colors, double size}) {
    switch (iconName) {
      ///end6
                    `;
                content7 = `///start7
                    `;
                content8 = `

        ///start8
    }
  }
}
///end8
                    `;
                if (mySvgIconsUris.length == 0) {
                    mySvgIconsUri = vscode.Uri.file(
                        vscode.workspace.rootPath +
                        "/lib/utils/my_svg_icons_single.dart"
                    );
                } else {
                    mySvgIconsUri = mySvgIconsUris[0];
                    let svgCodeFile = await vscode.workspace.openTextDocument(mySvgIconsUri);
                    let svgCode = svgCodeFile.getText();
                    content0 = svgCode.substring(svgCode.indexOf('///start0'), svgCode.indexOf('///end0'));
                    content2 = svgCode.substring(svgCode.indexOf('///start2'), svgCode.indexOf('///end2'));
                    content4 = svgCode.substring(svgCode.indexOf('///start4'), svgCode.indexOf('///end4'));
                    content5 = svgCode.substring(svgCode.indexOf('///start5'), svgCode.indexOf('///end5'));
                    content7 = svgCode.substring(svgCode.indexOf('///start7'), svgCode.indexOf('///end7'));
                }
                let svgNames = [];
                for (var i = 0; i < svgUris.length; i++) {
                    let svgUri = svgUris[i];
                    let doc = await vscode.workspace.openTextDocument(svgUri);
                    let text = doc.getText();
                    let colors = text.match(RegExp('#[a-zA-Z0-9]{3,6}', 'g')) ?? [];
                    console.log(colors);
                    for (var i = 0; i < colors.length; i++) {
                        text = text.replace(colors[i], `'''+getColor(${i}, color, colors, "${colors[i] == undefined ? "#000000" : colors[i]}")+'''`)
                    }
                    let svgName = await vscode.window.showInputBox({
                        placeHolder: `svg name (${svgUri.path})`,
                    });
                    if (svgName === undefined) {
                        return;
                    }
                    svgNames.push(svgName);
                    text = `case IconNamesSingle.${svgName}:
        svgXml = '''`
                        + text +
                        `
      ''';
        break;`;
                    content2 += text;
                    content4 += `
                    IconFontSingle.${svgName}({this.color, this.colors, this.size})
      : name = IconNamesSingle.${svgName},
        super();
        `;
                    content5 += `
  static const String ${svgName}Field = '${svgName}';
                    `;
                    content7 += `
      case ${svgName}Field:
        return IconFontSingle.${svgName}(color: color, colors: colors, size: size);
        break;
                    `;
                }
                let svgNameStr = svgNames.join(',');
                if (!content0.endsWith(',') && content0.replace('///start0', '').replace(RegExp(' ', 'g'),'').replace('\n','').length > 0) {
                    content0 += ','
                }
                vscode.workspace.fs.writeFile(
                    mySvgIconsUri,
                    stringToUint8Array(content_1 + content0 + svgNameStr + '\n///end0' + content1 + '\n///end1' + content2 + '\n///end2' + content3 + content4 + '///end4\n' + content5 + '///end5' + content6 + content7 + '///end7' + content8)
                );
            }
        });
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
export function deactivate() { }
