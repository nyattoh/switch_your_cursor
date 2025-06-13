import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigGenerator } from './lib/configGenerator';
import { ReloadManager } from './lib/reloadManager';
import { MermaidGenerator } from './lib/mermaidGenerator';

export function activate(context: vscode.ExtensionContext) {
    console.log('Cursor Config Generator extension is now active!');

    // Register the main command
    const generateConfigDisposable = vscode.commands.registerCommand('cursor-config-generator.generateConfig', async () => {
        try {
            await generateCursorConfig();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate config: ${error}`);
            console.error('Config generation error:', error);
        }
    });

    // Register the mode switching command
    const switchModeDisposable = vscode.commands.registerCommand('cursor-config-generator.switchMode', async () => {
        try {
            await switchCursorMode();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to switch mode: ${error}`);
            console.error('Mode switch error:', error);
        }
    });

    // Set up file watcher for auto-reload
    const yamlWatcher = vscode.workspace.createFileSystemWatcher('**/*.{yaml,yml}');
    yamlWatcher.onDidChange(async (uri: vscode.Uri) => {
        try {
            await handleYamlFileChange(uri);
        } catch (error) {
            console.error('Auto-reload error:', error);
        }
    });

    context.subscriptions.push(generateConfigDisposable, switchModeDisposable, yamlWatcher);
}

export function deactivate() {
    console.log('Cursor Config Generator extension is now deactivated!');
}

async function generateCursorConfig(): Promise<void> {
    // Get the current workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found. Please open a folder first.');
        return;
    }

    const workspacePath = workspaceFolder.uri.fsPath;
    
    // Look for YAML configuration files
    const yamlFiles = await findYamlFiles(workspacePath);
    
    if (yamlFiles.length === 0) {
        vscode.window.showErrorMessage('No YAML configuration files found in the workspace.');
        return;
    }

    // If multiple YAML files, let user choose
    let selectedFile: string;
    if (yamlFiles.length === 1) {
        selectedFile = yamlFiles[0];
    } else {
        const relativePaths = yamlFiles.map(f => path.relative(workspacePath, f));
        const selected = await vscode.window.showQuickPick(relativePaths, {
            placeHolder: 'Select a YAML configuration file'
        });
        
        if (!selected) {
            return; // User cancelled
        }
        
        selectedFile = path.join(workspacePath, selected);
    }

    // Read the YAML file
    let yamlContent: string;
    try {
        yamlContent = fs.readFileSync(selectedFile, 'utf-8');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to read YAML file: ${error}`);
        return;
    }

    // Generate the configuration
    const generator = new ConfigGenerator();
    let config: Record<string, any>;
    
    try {
        config = generator.generateFromYaml(yamlContent);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to parse YAML: ${error}`);
        return;
    }

    if (Object.keys(config).length === 0) {
        vscode.window.showWarningMessage('No configuration generated. Check your YAML file structure.');
        return;
    }

    // Determine where to save the settings
    const settingsScope = await vscode.window.showQuickPick(
        ['Workspace', 'User'],
        { placeHolder: 'Save settings to workspace or user scope?' }
    );
    
    if (!settingsScope) {
        return; // User cancelled
    }

    // Write the configuration
    try {
        await writeConfigToFile(config, workspacePath, settingsScope.toLowerCase() as 'workspace' | 'user');
        
        const message = `Configuration generated successfully to ${settingsScope.toLowerCase()} settings!`;
        vscode.window.showInformationMessage(message);
        
        // Ask if user wants to reload window
        const reloadManager = new ReloadManager();
        await reloadManager.reloadWindow({
            confirmBeforeReload: true,
            confirmationMessage: 'Configuration updated. Reload window to apply changes?'
        });
        
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to write configuration: ${error}`);
    }
}

async function findYamlFiles(workspacePath: string): Promise<string[]> {
    const yamlFiles: string[] = [];
    
    // Common YAML file patterns
    const patterns = ['*.yaml', '*.yml'];
    
    for (const pattern of patterns) {
        const files = await vscode.workspace.findFiles(
            new vscode.RelativePattern(workspacePath, pattern),
            '**/node_modules/**'
        );
        
        yamlFiles.push(...files.map(f => f.fsPath));
    }
    
    return yamlFiles;
}

async function writeConfigToFile(
    config: Record<string, any>,
    workspacePath: string,
    scope: 'workspace' | 'user'
): Promise<void> {
    let settingsPath: string;
    
    if (scope === 'workspace') {
        // Write to .cursor/settings.json in workspace
        const cursorDir = path.join(workspacePath, '.cursor');
        if (!fs.existsSync(cursorDir)) {
            fs.mkdirSync(cursorDir, { recursive: true });
        }
        settingsPath = path.join(cursorDir, 'settings.json');
    } else {
        // Write to user settings (this is a simplified approach)
        // In a real implementation, you'd use VS Code's settings API
        const userSettingsDir = path.join(workspacePath, '.vscode');
        if (!fs.existsSync(userSettingsDir)) {
            fs.mkdirSync(userSettingsDir, { recursive: true });
        }
        settingsPath = path.join(userSettingsDir, 'settings.json');
    }
    
    // Read existing settings if they exist
    let existingSettings: Record<string, any> = {};
    if (fs.existsSync(settingsPath)) {
        try {
            const existingContent = fs.readFileSync(settingsPath, 'utf-8');
            existingSettings = JSON.parse(existingContent);
        } catch (error) {
            console.warn('Failed to parse existing settings, creating new file:', error);
        }
    }
    
    // Merge with new configuration
    const mergedSettings = { ...existingSettings, ...config };
    
    // Write the updated settings
    fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2));
}

async function switchCursorMode(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found. Please open a folder first.');
        return;
    }

    const workspacePath = workspaceFolder.uri.fsPath;
    
    // Look for cursor_modes.yaml first, then fallback to any YAML files
    const modeConfigPath = path.join(workspacePath, 'cursor_modes.yaml');
    let selectedFile: string;
    let yamlContent: string;

    if (fs.existsSync(modeConfigPath)) {
        selectedFile = modeConfigPath;
    } else {
        const yamlFiles = await findYamlFiles(workspacePath);
        if (yamlFiles.length === 0) {
            vscode.window.showErrorMessage('No YAML configuration files found. Please create a cursor_modes.yaml file.');
            return;
        }
        
        if (yamlFiles.length === 1) {
            selectedFile = yamlFiles[0];
        } else {
            const relativePaths = yamlFiles.map(f => path.relative(workspacePath, f));
            const selected = await vscode.window.showQuickPick(relativePaths, {
                placeHolder: 'Select a YAML configuration file'
            });
            
            if (!selected) {
                return;
            }
            
            selectedFile = path.join(workspacePath, selected);
        }
    }

    try {
        yamlContent = fs.readFileSync(selectedFile, 'utf-8');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to read YAML file: ${error}`);
        return;
    }

    const generator = new ConfigGenerator();
    let availableModes: string[];
    
    try {
        availableModes = generator.getModes(yamlContent);
        if (availableModes.length === 0) {
            vscode.window.showErrorMessage('No modes found in the configuration file.');
            return;
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to parse modes from YAML: ${error}`);
        return;
    }

    // Create mode selection items with descriptions
    const modeItems = availableModes.map(mode => ({
        label: mode,
        description: generator.getModeDescription(yamlContent, mode) || 'No description available'
    }));

    const selectedMode = await vscode.window.showQuickPick(modeItems, {
        placeHolder: 'Select a Cursor mode to switch to'
    });

    if (!selectedMode) {
        return;
    }

    // Generate configuration for the selected mode
    let config: Record<string, any>;
    try {
        config = generator.generateFromYaml(yamlContent, { mode: selectedMode.label });
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to generate configuration for mode '${selectedMode.label}': ${error}`);
        return;
    }

    if (Object.keys(config).length === 0) {
        vscode.window.showWarningMessage(`No configuration generated for mode '${selectedMode.label}'. Check your YAML file structure.`);
        return;
    }

    // Write the configuration (always to workspace for mode switching)
    try {
        await writeConfigToFile(config, workspacePath, 'workspace');
        
        const message = `Switched to mode '${selectedMode.label}' successfully!`;
        vscode.window.showInformationMessage(message);
        
        // Generate Mermaid diagram
        await generateMermaidDiagram(yamlContent, selectedMode.label, workspacePath);
        
        // Auto-reload window
        const reloadManager = new ReloadManager();
        await reloadManager.reloadWindow({
            confirmBeforeReload: false  // Auto-reload for mode switching
        });
        
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to write configuration: ${error}`);
    }
}

async function handleYamlFileChange(uri: vscode.Uri): Promise<void> {
    const fileName = path.basename(uri.fsPath);
    
    // Only auto-reload for cursor_modes.yaml or explicitly named config files
    if (!fileName.includes('cursor') && !fileName.includes('mode') && !fileName.includes('config')) {
        return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        return;
    }

    try {
        const yamlContent = fs.readFileSync(uri.fsPath, 'utf-8');
        const generator = new ConfigGenerator();
        
        // Try to determine current mode from existing settings
        const workspacePath = workspaceFolder.uri.fsPath;
        const settingsPath = path.join(workspacePath, '.cursor', 'settings.json');
        let currentMode: string | undefined;
        
        if (fs.existsSync(settingsPath)) {
            try {
                const existingSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
                currentMode = existingSettings['cursor.mode'];
            } catch (error) {
                console.warn('Failed to read current mode from settings:', error);
            }
        }
        
        const config = generator.generateFromYaml(yamlContent, { mode: currentMode });
        
        if (Object.keys(config).length > 0) {
            await writeConfigToFile(config, workspacePath, 'workspace');
            
            vscode.window.showInformationMessage(
                `Configuration auto-updated from ${fileName}`,
                'Reload Window'
            ).then(selection => {
                if (selection === 'Reload Window') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
        }
    } catch (error) {
        console.error('Auto-reload failed:', error);
        vscode.window.showWarningMessage(`Failed to auto-reload configuration from ${fileName}: ${error}`);
    }
}

async function generateMermaidDiagram(yamlContent: string, mode: string, workspacePath: string): Promise<void> {
    try {
        const generator = new ConfigGenerator();
        const config = generator.generateFromYaml(yamlContent, { mode });
        
        const mermaidGenerator = new MermaidGenerator();
        const diagram = mermaidGenerator.generateDiagramFromConfig(config, mode);
        
        const diagramPath = path.join(workspacePath, 'cursor-mode-diagram.mmd');
        fs.writeFileSync(diagramPath, diagram);
        
        // Try to open the diagram for preview if Mermaid extension is available
        try {
            const uri = vscode.Uri.file(diagramPath);
            await vscode.window.showTextDocument(uri, { preview: true });
            
            // Try to trigger Mermaid preview if available
            await vscode.commands.executeCommand('mermaid.preview', uri);
        } catch (previewError) {
            console.log('Mermaid preview not available, diagram saved to cursor-mode-diagram.mmd');
        }
        
    } catch (error) {
        console.error('Failed to generate Mermaid diagram:', error);
    }
}