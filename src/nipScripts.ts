import { EventEmitter, TreeItem, TreeItemCollapsibleState, FileSystemWatcher } from 'vscode';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PathLike } from 'fs';


export class ScriptNodeProvider implements vscode.TreeDataProvider<Script> {
	private readonly _onDidChangeTreeData: EventEmitter<Script | undefined> = new EventEmitter<Script | undefined>();
	public readonly onDidChangeTreeData: vscode.Event<Script | undefined> = this._onDidChangeTreeData.event;
	private readonly fileWatcher: FileSystemWatcher;
	private nipJsonPath: string;

	constructor(private readonly workspaceRoot: string) {
		this.nipJsonPath = path.join(this.workspaceRoot, 'nip.json');

		this.fileWatcher = vscode.workspace.createFileSystemWatcher(this.nipJsonPath);
		this.fileWatcher.onDidChange(() => this.refresh());
	}

	refresh() {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Script): TreeItem {
		return element;
	}

	getChildren(element?: Script): Thenable<Script[]> {
		return new Promise(resolve => {
			if (this.pathExists(this.nipJsonPath)) {
				resolve(this.getScriptsInPackageJson(this.nipJsonPath));
			} else {
				vscode.window.showInformationMessage('Workspace has no nip.json');
				resolve([]);
			}
		});
	}

	/**
	 * Given the path to nip.json, return a list of all scripts
	 */
	private getScriptsInPackageJson(nipJsonPath: string): Script[] {
		if (this.pathExists(nipJsonPath)) {
			const packageJson = JSON.parse(fs.readFileSync(nipJsonPath, 'utf-8'));

			const toScript = (scriptName: string): Script => {
				const cmdObject = {
					title: 'Run Script',
					command: 'nipScripts.executeCommand',
					arguments: [scriptName]
				};
				return new Script(scriptName, TreeItemCollapsibleState.None, cmdObject);
			}

			const deps = packageJson.scripts
				? Object.keys(packageJson.scripts).map(toScript)
				: [];
			return deps;
		} else {
			return [];
		}
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}
}

class Script extends TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	iconPath = {
		light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'file_type_python.svg'),
		dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'file_type_python.svg')
	};

	contextValue = 'script';
}
