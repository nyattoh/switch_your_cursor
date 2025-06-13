import * as yaml from 'js-yaml';

interface Task {
    name: string;
    agents?: Agent[];
    description?: string;
    category?: string;
}

interface Agent {
    name: string;
    prompts?: string[];
    description?: string;
    role?: string;
}

interface Mode {
    name: string;
    description?: string;
    package_path?: string;
    tasks?: string[];
    agents?: string[];
    flows?: string[];
}

interface Flow {
    name: string;
    description?: string;
    tasks: Task[];
}

interface CursorAgent {
    name: string;
    task: string;
    prompts: string[];
    description?: string;
    role?: string;
}

interface GeneratorOptions {
    scope?: 'workspace' | 'user';
    mode?: string;
}

interface CursorModeConfig {
    modes: Mode[];
    flows?: Flow[];
    default_mode?: string;
}

export class ConfigGenerator {
    private cachedConfig: CursorModeConfig | null = null;
    private cachedYamlContent: string | null = null;

    generateFromYaml(yamlContent: string, options: GeneratorOptions = {}): Record<string, any> {
        if (!yamlContent || yamlContent.trim() === '') {
            return {};
        }

        if (this.cachedYamlContent === yamlContent && this.cachedConfig) {
            return this.generateConfigForMode(this.cachedConfig, options.mode);
        }

        let parsedYaml: any;
        try {
            parsedYaml = yaml.load(yamlContent);
        } catch (error) {
            throw new Error(`YAML parsing error: ${error}`);
        }

        if (!parsedYaml || typeof parsedYaml !== 'object') {
            return {};
        }

        this.cachedConfig = parsedYaml as CursorModeConfig;
        this.cachedYamlContent = yamlContent;

        return this.generateConfigForMode(this.cachedConfig, options.mode);
    }

    private generateConfigForMode(config: CursorModeConfig, modeName?: string): Record<string, any> {
        const selectedMode = modeName || config.default_mode || config.modes?.[0]?.name;
        
        if (!selectedMode) {
            return this.generateLegacyConfig(config);
        }

        const mode = config.modes?.find(m => m.name === selectedMode);
        if (!mode) {
            throw new Error(`Mode '${selectedMode}' not found`);
        }

        const cursorAgents: CursorAgent[] = [];
        
        if (mode.tasks) {
            for (const taskName of mode.tasks) {
                const flow = config.flows?.find(f => f.name === taskName);
                if (flow) {
                    for (const task of flow.tasks) {
                        this.processTask(task, cursorAgents);
                    }
                }
            }
        }

        return {
            "cursor.composer.agents": cursorAgents,
            "cursor.mode": selectedMode,
            "cursor.mode.description": mode.description
        };
    }

    private generateLegacyConfig(config: any): Record<string, any> {
        if (!config.tasks || !Array.isArray(config.tasks)) {
            return {};
        }

        const cursorAgents: CursorAgent[] = [];
        
        for (const task of config.tasks) {
            this.processTask(task, cursorAgents);
        }

        return {
            "cursor.composer.agents": cursorAgents
        };
    }

    private processTask(task: Task, cursorAgents: CursorAgent[]): void {
        if (!task.name || !task.agents || !Array.isArray(task.agents)) {
            return;
        }

        for (const agent of task.agents) {
            if (!agent.name) {
                continue;
            }

            const cursorAgent: CursorAgent = {
                name: agent.name,
                task: task.name,
                prompts: agent.prompts || [],
                description: agent.description,
                role: agent.role
            };

            cursorAgents.push(cursorAgent);
        }
    }

    getModes(yamlContent: string): string[] {
        try {
            const parsedYaml = yaml.load(yamlContent) as CursorModeConfig;
            return parsedYaml.modes?.map(m => m.name) || [];
        } catch (error) {
            throw new Error(`YAML parsing error: ${error}`);
        }
    }

    getModeDescription(yamlContent: string, modeName: string): string | undefined {
        try {
            const parsedYaml = yaml.load(yamlContent) as CursorModeConfig;
            const mode = parsedYaml.modes?.find(m => m.name === modeName);
            return mode?.description;
        } catch (error) {
            return undefined;
        }
    }
}