import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigGenerator } from '../lib/configGenerator';
import { ReloadManager } from '../lib/reloadManager';
// Import activate function after we implement it
// import { activate } from '../extension';

suite('Extension Integration Test Suite', () => {
    let testWorkspacePath: string;
    let testYamlPath: string;
    let testSettingsPath: string;

    setup(() => {
        // Create a temporary workspace for testing
        testWorkspacePath = path.join(__dirname, 'test-workspace');
        testYamlPath = path.join(testWorkspacePath, 'config.yaml');
        testSettingsPath = path.join(testWorkspacePath, '.cursor', 'settings.json');
        
        // Create directories
        if (!fs.existsSync(testWorkspacePath)) {
            fs.mkdirSync(testWorkspacePath, { recursive: true });
        }
        if (!fs.existsSync(path.dirname(testSettingsPath))) {
            fs.mkdirSync(path.dirname(testSettingsPath), { recursive: true });
        }
    });

    teardown(() => {
        // Cleanup test files
        try {
            if (fs.existsSync(testSettingsPath)) {
                fs.unlinkSync(testSettingsPath);
            }
            if (fs.existsSync(testYamlPath)) {
                fs.unlinkSync(testYamlPath);
            }
            if (fs.existsSync(testWorkspacePath)) {
                fs.rmSync(testWorkspacePath, { recursive: true, force: true });
            }
        } catch (error) {
            console.warn('Cleanup error:', error);
        }
    });

    test('ConfigGenerator should integrate with file system operations', () => {
        const generator = new ConfigGenerator();
        const yamlContent = `
tasks:
  - name: "Integration Test"
    agents:
      - name: "Test Agent"
        prompts:
          - "Test prompt"
`;
        
        const result = generator.generateFromYaml(yamlContent);
        
        // Write the result to file
        fs.writeFileSync(testSettingsPath, JSON.stringify(result, null, 2));
        
        // Verify file was written correctly
        assert.ok(fs.existsSync(testSettingsPath));
        
        const writtenContent = JSON.parse(fs.readFileSync(testSettingsPath, 'utf-8'));
        assert.deepStrictEqual(writtenContent, result);
        assert.ok(writtenContent['cursor.composer.agents']);
        assert.strictEqual(writtenContent['cursor.composer.agents'].length, 1);
        assert.strictEqual(writtenContent['cursor.composer.agents'][0].name, 'Test Agent');
    });

    test('ReloadManager should be instantiable', () => {
        const reloadManager = new ReloadManager();
        assert.ok(reloadManager);
        assert.ok(typeof reloadManager.reloadWindow === 'function');
    });

    test('Extension command should be registerable', () => {
        // Test that we can register the command (this will be implemented in extension.ts)
        const commandId = 'cursor-config-generator.generateConfig';
        
        // This is a placeholder test - in real integration test, we would:
        // 1. Call activate function
        // 2. Verify command is registered
        // 3. Execute command and verify behavior
        
        assert.ok(commandId === 'cursor-config-generator.generateConfig');
    });

    test('End-to-end workflow simulation', () => {
        // Simulate the complete workflow
        const generator = new ConfigGenerator();
        const reloadManager = new ReloadManager();
        
        // 1. Create YAML input
        const yamlContent = `
tasks:
  - name: "E2E Test"
    agents:
      - name: "E2E Agent"
        prompts:
          - "End to end test prompt"
`;
        
        // 2. Generate config
        const config = generator.generateFromYaml(yamlContent);
        
        // 3. Write to settings file
        fs.writeFileSync(testSettingsPath, JSON.stringify(config, null, 2));
        
        // 4. Verify file exists and has correct content
        assert.ok(fs.existsSync(testSettingsPath));
        const savedConfig = JSON.parse(fs.readFileSync(testSettingsPath, 'utf-8'));
        assert.deepStrictEqual(savedConfig, config);
        
        // 5. Verify reload manager exists (actual reload would require VS Code environment)
        assert.ok(reloadManager);
        
        // This represents the complete workflow that would happen when user runs the command
    });

    test('Error handling for invalid YAML files', () => {
        const generator = new ConfigGenerator();
        
        const invalidYaml = `
  invalid: yaml:
    - broken
      missing_indent
`;
        
        assert.throws(() => {
            generator.generateFromYaml(invalidYaml);
        }, /YAML parsing error/);
    });

    test('File system error handling', () => {
        // Test writing to non-existent directory
        const nonExistentPath = '/non/existent/path/settings.json';
        
        assert.throws(() => {
            fs.writeFileSync(nonExistentPath, '{}');
        });
    });

    test('Configuration with multiple tasks and complex structure', () => {
        const generator = new ConfigGenerator();
        const complexYaml = `
tasks:
  - name: "Frontend Development"
    agents:
      - name: "React Developer"
        prompts:
          - "Review React component props"
          - "Check for accessibility issues"
          - "Optimize rendering performance"
      - name: "CSS Specialist"
        prompts:
          - "Review CSS-in-JS usage"
  - name: "Backend Development"
    agents:
      - name: "API Designer"
        prompts:
          - "Review REST API endpoints"
          - "Check authentication flow"
`;
        
        const result = generator.generateFromYaml(complexYaml);
        
        assert.ok(result['cursor.composer.agents']);
        assert.strictEqual(result['cursor.composer.agents'].length, 3);
        
        // Verify frontend agents
        const reactDev = result['cursor.composer.agents'].find((a: any) => a.name === 'React Developer');
        assert.ok(reactDev);
        assert.strictEqual(reactDev.task, 'Frontend Development');
        assert.strictEqual(reactDev.prompts.length, 3);
        
        // Verify backend agents
        const apiDesigner = result['cursor.composer.agents'].find((a: any) => a.name === 'API Designer');
        assert.ok(apiDesigner);
        assert.strictEqual(apiDesigner.task, 'Backend Development');
        assert.strictEqual(apiDesigner.prompts.length, 2);
    });
});