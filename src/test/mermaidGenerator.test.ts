import * as assert from 'assert';
import { MermaidGenerator } from '../lib/mermaidGenerator';

suite('MermaidGenerator Test Suite', () => {
    let generator: MermaidGenerator;

    setup(() => {
        generator = new MermaidGenerator();
    });

    test('should generate empty diagram for null config', () => {
        const result = generator.generateDiagramFromConfig(null);
        
        assert.ok(result.includes('Empty Configuration'));
        assert.ok(result.includes('No Configuration Found'));
    });

    test('should generate empty diagram for empty config', () => {
        const result = generator.generateDiagramFromConfig({});
        
        assert.ok(result.includes('Empty Configuration'));
        assert.ok(result.includes('No Configuration Found'));
    });

    test('should generate agent diagram for legacy format', () => {
        const config = {
            'cursor.composer.agents': [
                {
                    name: 'Code Reviewer',
                    task: 'Review',
                    prompts: ['Check code quality'],
                    role: 'senior-dev'
                },
                {
                    name: 'Tester',
                    task: 'Testing',
                    prompts: ['Write tests']
                }
            ]
        };

        const result = generator.generateDiagramFromConfig(config);
        
        assert.ok(result.includes('flowchart TD'));
        assert.ok(result.includes('Code Reviewer'));
        assert.ok(result.includes('senior-dev'));
        assert.ok(result.includes('Tester'));
        assert.ok(result.includes('Review'));
        assert.ok(result.includes('Testing'));
    });

    test('should generate flow diagram for mode-based config', () => {
        const config = {
            flows: [
                {
                    name: 'Development Flow',
                    description: 'Main development workflow',
                    tasks: [
                        {
                            name: 'Code Review',
                            agents: [
                                {
                                    name: 'Senior Reviewer',
                                    role: 'tech-lead'
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const result = generator.generateDiagramFromConfig(config, 'development');
        
        assert.ok(result.includes('title: Cursor Mode: development'));
        assert.ok(result.includes('Development Flow'));
        assert.ok(result.includes('Main development workflow'));
        assert.ok(result.includes('Code Review'));
        assert.ok(result.includes('Senior Reviewer'));
        assert.ok(result.includes('tech-lead'));
    });

    test('should handle special characters in labels', () => {
        const config = {
            'cursor.composer.agents': [
                {
                    name: 'Agent [Special] (Characters)',
                    task: 'Task "With" {Quotes}',
                    prompts: ['Test prompt']
                }
            ]
        };

        const result = generator.generateDiagramFromConfig(config);
        
        // Should escape special characters
        assert.ok(result.includes('Agent \\[Special\\] \\(Characters\\)'));
        assert.ok(result.includes('Task \\"With\\" \\{Quotes\\}'));
    });

    test('should generate diagram with proper flow structure', () => {
        const config = {
            flows: [
                {
                    name: 'Simple Flow',
                    tasks: [
                        {
                            name: 'Task 1',
                            agents: [
                                { name: 'Agent 1' }
                            ]
                        },
                        {
                            name: 'Task 2',
                            agents: [
                                { name: 'Agent 2' }
                            ]
                        }
                    ]
                }
            ]
        };

        const result = generator.generateDiagramFromConfig(config, 'test');
        
        assert.ok(result.includes('Start([Start: test])'));
        assert.ok(result.includes('End([Configuration Applied])'));
        assert.ok(result.includes('Simple Flow'));
        assert.ok(result.includes('Task 1'));
        assert.ok(result.includes('Task 2'));
        assert.ok(result.includes('Agent 1'));
        assert.ok(result.includes('Agent 2'));
    });

    test('should handle agents without roles', () => {
        const config = {
            'cursor.composer.agents': [
                {
                    name: 'Simple Agent',
                    task: 'Simple Task',
                    prompts: []
                }
            ]
        };

        const result = generator.generateDiagramFromConfig(config);
        
        assert.ok(result.includes('Simple Agent'));
        assert.ok(result.includes('Simple Task'));
        // Should not include role information
        assert.ok(!result.includes('\\n('));
    });

    test('should handle flows with descriptions', () => {
        const config = {
            flows: [
                {
                    name: 'Documented Flow',
                    description: 'This flow has documentation',
                    tasks: []
                }
            ]
        };

        const result = generator.generateDiagramFromConfig(config);
        
        assert.ok(result.includes('Documented Flow'));
        assert.ok(result.includes('This flow has documentation'));
        assert.ok(result.includes('-.->'));
    });

    test('should group agents by task in legacy format', () => {
        const config = {
            'cursor.composer.agents': [
                {
                    name: 'Agent 1',
                    task: 'Shared Task',
                    prompts: []
                },
                {
                    name: 'Agent 2',
                    task: 'Shared Task',
                    prompts: []
                },
                {
                    name: 'Agent 3',
                    task: 'Different Task',
                    prompts: []
                }
            ]
        };

        const result = generator.generateDiagramFromConfig(config);
        
        // Should have both tasks
        assert.ok(result.includes('Shared Task'));
        assert.ok(result.includes('Different Task'));
        
        // All agents should be present
        assert.ok(result.includes('Agent 1'));
        assert.ok(result.includes('Agent 2'));
        assert.ok(result.includes('Agent 3'));
    });

    test('should handle empty flows array', () => {
        const config = {
            flows: []
        };

        const result = generator.generateDiagramFromConfig(config);
        
        assert.ok(result.includes('Start'));
        assert.ok(result.includes('End'));
    });

    test('should include mode in title when provided', () => {
        const config = {
            'cursor.composer.agents': [
                {
                    name: 'Test Agent',
                    task: 'Test Task',
                    prompts: []
                }
            ]
        };

        const result = generator.generateDiagramFromConfig(config, 'custom-mode');
        
        assert.ok(result.includes('title: Cursor Mode: custom-mode'));
    });

    test('should default to configuration title when no mode provided', () => {
        const config = {
            'cursor.composer.agents': [
                {
                    name: 'Test Agent',
                    task: 'Test Task',
                    prompts: []
                }
            ]
        };

        const result = generator.generateDiagramFromConfig(config);
        
        assert.ok(result.includes('title: Cursor Configuration'));
    });
});