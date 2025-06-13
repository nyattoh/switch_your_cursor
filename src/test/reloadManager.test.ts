import * as assert from 'assert';
import * as vscode from 'vscode';
import { ReloadManager } from '../lib/reloadManager';

suite('ReloadManager Test Suite', () => {
    let reloadManager: ReloadManager;
    let originalExecuteCommand: any;
    let executeCommandCalls: string[];

    setup(() => {
        reloadManager = new ReloadManager();
        executeCommandCalls = [];
        
        // Mock vscode.commands.executeCommand
        originalExecuteCommand = vscode.commands.executeCommand;
        (vscode.commands as any).executeCommand = (command: string, ...args: any[]) => {
            executeCommandCalls.push(command);
            return Promise.resolve();
        };
    });

    teardown(() => {
        // Restore original function
        (vscode.commands as any).executeCommand = originalExecuteCommand;
    });

    test('should reload window immediately when no confirmation needed', async () => {
        await reloadManager.reloadWindow({ confirmBeforeReload: false });
        
        assert.strictEqual(executeCommandCalls.length, 1);
        assert.strictEqual(executeCommandCalls[0], 'workbench.action.reloadWindow');
    });

    test('should show confirmation dialog when confirmation required', async () => {
        let showInformationMessageCalled = false;
        let showInformationMessageOptions: any;
        
        const originalShowInformationMessage = vscode.window.showInformationMessage;
        (vscode.window as any).showInformationMessage = (message: string, options: any, ...items: any[]) => {
            showInformationMessageCalled = true;
            showInformationMessageOptions = { message, options, items };
            return Promise.resolve('Reload Now'); // Simulate user clicking 'Reload Now'
        };

        await reloadManager.reloadWindow({ confirmBeforeReload: true });
        
        assert.strictEqual(showInformationMessageCalled, true);
        assert.strictEqual(executeCommandCalls.length, 1);
        assert.strictEqual(executeCommandCalls[0], 'workbench.action.reloadWindow');
        
        // Restore
        (vscode.window as any).showInformationMessage = originalShowInformationMessage;
    });

    test('should not reload when user cancels confirmation dialog', async () => {
        const originalShowInformationMessage = vscode.window.showInformationMessage;
        (vscode.window as any).showInformationMessage = (message: string, options: any, ...items: any[]) => {
            return Promise.resolve('Cancel'); // Simulate user clicking 'Cancel'
        };

        await reloadManager.reloadWindow({ confirmBeforeReload: true });
        
        assert.strictEqual(executeCommandCalls.length, 0); // Should not reload
        
        // Restore
        (vscode.window as any).showInformationMessage = originalShowInformationMessage;
    });

    test('should not reload when user dismisses confirmation dialog', async () => {
        const originalShowInformationMessage = vscode.window.showInformationMessage;
        (vscode.window as any).showInformationMessage = (message: string, options: any, ...items: any[]) => {
            return Promise.resolve(undefined); // Simulate user dismissing dialog
        };

        await reloadManager.reloadWindow({ confirmBeforeReload: true });
        
        assert.strictEqual(executeCommandCalls.length, 0); // Should not reload
        
        // Restore
        (vscode.window as any).showInformationMessage = originalShowInformationMessage;
    });

    test('should handle executeCommand errors gracefully', async () => {
        // Mock executeCommand to throw an error
        (vscode.commands as any).executeCommand = (command: string) => {
            executeCommandCalls.push(command);
            return Promise.reject(new Error('Mock command execution error'));
        };

        // Should not throw, but handle error gracefully
        await assert.doesNotReject(async () => {
            await reloadManager.reloadWindow({ confirmBeforeReload: false });
        });
        
        assert.strictEqual(executeCommandCalls.length, 1);
        assert.strictEqual(executeCommandCalls[0], 'workbench.action.reloadWindow');
    });

    test('should use custom confirmation message when provided', async () => {
        let capturedMessage = '';
        
        const originalShowInformationMessage = vscode.window.showInformationMessage;
        (vscode.window as any).showInformationMessage = (message: string, options: any, ...items: any[]) => {
            capturedMessage = message;
            return Promise.resolve('Reload Now');
        };

        const customMessage = 'Custom reload confirmation message';
        await reloadManager.reloadWindow({ 
            confirmBeforeReload: true,
            confirmationMessage: customMessage
        });
        
        assert.strictEqual(capturedMessage, customMessage);
        
        // Restore
        (vscode.window as any).showInformationMessage = originalShowInformationMessage;
    });

    test('should use default confirmation message when not provided', async () => {
        let capturedMessage = '';
        
        const originalShowInformationMessage = vscode.window.showInformationMessage;
        (vscode.window as any).showInformationMessage = (message: string, options: any, ...items: any[]) => {
            capturedMessage = message;
            return Promise.resolve('Reload Now');
        };

        await reloadManager.reloadWindow({ confirmBeforeReload: true });
        
        assert.strictEqual(capturedMessage, 'Configuration updated. Reload window to apply changes?');
        
        // Restore
        (vscode.window as any).showInformationMessage = originalShowInformationMessage;
    });

    test('should handle multiple reload requests sequentially', async () => {
        await reloadManager.reloadWindow({ confirmBeforeReload: false });
        await reloadManager.reloadWindow({ confirmBeforeReload: false });
        await reloadManager.reloadWindow({ confirmBeforeReload: false });
        
        assert.strictEqual(executeCommandCalls.length, 3);
        executeCommandCalls.forEach(call => {
            assert.strictEqual(call, 'workbench.action.reloadWindow');
        });
    });
});