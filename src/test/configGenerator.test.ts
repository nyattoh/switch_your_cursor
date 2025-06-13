import * as assert from 'assert';
import { ConfigGenerator } from '../lib/configGenerator';
import * as yaml from 'js-yaml';

suite('ConfigGenerator Test Suite', () => {
    let generator: ConfigGenerator;

    setup(() => {
        generator = new ConfigGenerator();
    });

    test('should generate empty settings for empty YAML', () => {
        const yamlContent = '';
        const result = generator.generateFromYaml(yamlContent);
        
        assert.deepStrictEqual(result, {});
    });

    test('should expand single task with agents and prompts', () => {
        const yamlContent = `
tasks:
  - name: "Code Review"
    agents:
      - name: "Security Reviewer"
        prompts:
          - "Check for SQL injection vulnerabilities"
          - "Verify authentication checks"
      - name: "Performance Reviewer"
        prompts:
          - "Identify performance bottlenecks"
`;
        const result = generator.generateFromYaml(yamlContent);
        
        const expected = {
            "cursor.composer.agents": [
                {
                    "name": "Security Reviewer",
                    "task": "Code Review",
                    "prompts": [
                        "Check for SQL injection vulnerabilities",
                        "Verify authentication checks"
                    ]
                },
                {
                    "name": "Performance Reviewer",
                    "task": "Code Review",
                    "prompts": [
                        "Identify performance bottlenecks"
                    ]
                }
            ]
        };
        
        assert.deepStrictEqual(result, expected);
    });

    test('should handle multiple tasks', () => {
        const yamlContent = `
tasks:
  - name: "Code Review"
    agents:
      - name: "Security Reviewer"
        prompts:
          - "Check security"
  - name: "Testing"
    agents:
      - name: "Test Writer"
        prompts:
          - "Write unit tests"
`;
        const result = generator.generateFromYaml(yamlContent);
        
        const expected = {
            "cursor.composer.agents": [
                {
                    "name": "Security Reviewer",
                    "task": "Code Review",
                    "prompts": ["Check security"]
                },
                {
                    "name": "Test Writer",
                    "task": "Testing",
                    "prompts": ["Write unit tests"]
                }
            ]
        };
        
        assert.deepStrictEqual(result, expected);
    });

    test('should handle YAML with no tasks', () => {
        const yamlContent = `
other_key: value
`;
        const result = generator.generateFromYaml(yamlContent);
        
        assert.deepStrictEqual(result, {});
    });

    test('should handle invalid YAML gracefully', () => {
        const yamlContent = `
  invalid: yaml:
    - broken
`;
        
        assert.throws(() => {
            generator.generateFromYaml(yamlContent);
        }, /YAML parsing error/);
    });

    test('should handle agents without prompts', () => {
        const yamlContent = `
tasks:
  - name: "Code Review"
    agents:
      - name: "Basic Reviewer"
`;
        const result = generator.generateFromYaml(yamlContent);
        
        const expected = {
            "cursor.composer.agents": [
                {
                    "name": "Basic Reviewer",
                    "task": "Code Review",
                    "prompts": []
                }
            ]
        };
        
        assert.deepStrictEqual(result, expected);
    });

    test('should handle tasks without agents', () => {
        const yamlContent = `
tasks:
  - name: "Empty Task"
`;
        const result = generator.generateFromYaml(yamlContent);
        
        assert.deepStrictEqual(result, {});
    });

    test('should preserve prompt order', () => {
        const yamlContent = `
tasks:
  - name: "Ordered Task"
    agents:
      - name: "Ordered Agent"
        prompts:
          - "First prompt"
          - "Second prompt"
          - "Third prompt"
`;
        const result = generator.generateFromYaml(yamlContent);
        
        assert.deepStrictEqual(
            result["cursor.composer.agents"][0].prompts,
            ["First prompt", "Second prompt", "Third prompt"]
        );
    });

    test('should handle workspace vs user scope', () => {
        const yamlContent = `
tasks:
  - name: "Test Task"
    agents:
      - name: "Test Agent"
        prompts:
          - "Test prompt"
`;
        
        // Test workspace scope (default)
        const workspaceResult = generator.generateFromYaml(yamlContent);
        assert.ok(workspaceResult.hasOwnProperty("cursor.composer.agents"));
        
        // Test user scope
        const userResult = generator.generateFromYaml(yamlContent, { scope: 'user' });
        assert.ok(userResult.hasOwnProperty("cursor.composer.agents"));
    });

    suite('Mode-based Configuration', () => {
        const modeYaml = `
modes:
  - name: "development"
    description: "Development mode with coding agents"
    tasks: ["coding-flow"]
  - name: "writing"
    description: "Writing mode with content agents"
    tasks: ["content-flow"]
flows:
  - name: "coding-flow"
    description: "Coding workflow"
    tasks:
      - name: "code-review"
        agents:
          - name: "reviewer"
            role: "senior-dev"
            prompts: ["Review code quality"]
  - name: "content-flow"
    description: "Content creation workflow"
    tasks:
      - name: "content-creation"
        agents:
          - name: "writer"
            role: "content-creator"
            prompts: ["Create engaging content"]
default_mode: "development"
`;

        test('should extract available modes', () => {
            const modes = generator.getModes(modeYaml);
            assert.deepStrictEqual(modes, ['development', 'writing']);
        });

        test('should get mode descriptions', () => {
            const devDescription = generator.getModeDescription(modeYaml, 'development');
            const writingDescription = generator.getModeDescription(modeYaml, 'writing');
            
            assert.strictEqual(devDescription, 'Development mode with coding agents');
            assert.strictEqual(writingDescription, 'Writing mode with content agents');
        });

        test('should generate config for specific mode', () => {
            const result = generator.generateFromYaml(modeYaml, { mode: 'development' });
            
            assert.ok(result['cursor.composer.agents']);
            assert.strictEqual(result['cursor.mode'], 'development');
            assert.strictEqual(result['cursor.mode.description'], 'Development mode with coding agents');
            
            const agents = result['cursor.composer.agents'];
            assert.strictEqual(agents.length, 1);
            assert.strictEqual(agents[0].name, 'reviewer');
            assert.strictEqual(agents[0].role, 'senior-dev');
            assert.strictEqual(agents[0].task, 'code-review');
        });

        test('should use default mode when no mode specified', () => {
            const result = generator.generateFromYaml(modeYaml);
            assert.strictEqual(result['cursor.mode'], 'development');
        });

        test('should throw error for non-existent mode', () => {
            assert.throws(() => {
                generator.generateFromYaml(modeYaml, { mode: 'non-existent' });
            }, /Mode 'non-existent' not found/);
        });

        test('should cache parsed YAML content', () => {
            const yaml = `
modes:
  - name: "test"
    tasks: []
`;
            
            const result1 = generator.generateFromYaml(yaml);
            const result2 = generator.generateFromYaml(yaml);
            
            assert.deepStrictEqual(result1, result2);
        });
    });
});