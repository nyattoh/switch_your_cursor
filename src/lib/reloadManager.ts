import * as vscode from 'vscode';

interface ReloadOptions {
    confirmBeforeReload?: boolean;
    confirmationMessage?: string;
}

export class ReloadManager {
    async reloadWindow(options: ReloadOptions = {}): Promise<void> {
        const { 
            confirmBeforeReload = true, 
            confirmationMessage = 'Configuration updated. Reload window to apply changes?' 
        } = options;

        if (confirmBeforeReload) {
            const choice = await vscode.window.showInformationMessage(
                confirmationMessage,
                { modal: false },
                'Reload Now',
                'Cancel'
            );

            if (choice !== 'Reload Now') {
                return; // User cancelled or dismissed
            }
        }

        try {
            await vscode.commands.executeCommand('workbench.action.reloadWindow');
        } catch (error) {
            // Handle error gracefully - log but don't throw
            console.error('Failed to reload window:', error);
        }
    }
}