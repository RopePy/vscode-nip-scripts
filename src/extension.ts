import * as vscode from 'vscode';
import { Terminal, MessageItem, DocumentSelector } from 'vscode';
import { ScriptNodeProvider } from './nipScripts'

export function activate(context: vscode.ExtensionContext) {
	const rootPath = vscode.workspace.rootPath || ".";

	const terminalMap = new Map<string, Terminal>();
	const nipScriptsProvider = new ScriptNodeProvider(rootPath);

	vscode.window.registerTreeDataProvider('nipScripts', nipScriptsProvider);
    vscode.window.onDidCloseTerminal(term => terminalMap.delete(term.name));
    
	// The most simple completion item provider which 
	// registers for text files (`'plaintext'`), and
	// return the 'Hello World' and 
    //   a snippet-based completion item.
    let docSelector: DocumentSelector = [{ language: 'json', pattern: '**/nip.json' }]
	vscode.languages.registerCompletionItemProvider(docSelector, {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
			return [
                createKeyValueSnippetItem('"scripts"', '"scripts": {\n\t"${1|start,test,build,publish|}": "${2}"\n}')
			];
		}
    });

    function createKeyValueSnippetItem(hint: string, snippet: string): vscode.CompletionItem {
        let item = new vscode.CompletionItem(hint, vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString(snippet);
		return item;
    }

	vscode.commands.registerCommand('nipScripts.executeCommand', task => {
		const packageManager = vscode.workspace.getConfiguration('nip').get('packageManager') || 'nip';
		const command = `${packageManager} run ${task}`;

		const config = vscode.workspace.getConfiguration('nip-scripts')
		if (config['showStartNotification']) {

			const hideMessages: MessageItem = { title: "Hide messages" };
			vscode.window.showInformationMessage(command, hideMessages)
				.then(result => {
					if (result === hideMessages) {
						config.update('showStartNotification', false, false);
						vscode.window.showInformationMessage([
							"To turn these messages back on, set the workspace option",
							"\"nip-scripts.showStartNotification\" to True"
						].join(' '))
					}
				})
		}

		let terminal: Terminal;
		if (terminalMap.has(task)) {
			terminal = terminalMap.get(task);
		} else {
			terminal = vscode.window.createTerminal(task);
			terminalMap.set(task, terminal);
		}

		terminal.show();
		terminal.sendText(command);
	});
}
