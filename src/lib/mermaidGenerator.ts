export interface MermaidFlow {
    name: string;
    description?: string;
    tasks: MermaidTask[];
}

export interface MermaidTask {
    name: string;
    agents?: MermaidAgent[];
    dependencies?: string[];
}

export interface MermaidAgent {
    name: string;
    role?: string;
}

export class MermaidGenerator {
    generateDiagramFromConfig(config: any, mode?: string): string {
        if (!config) {
            return this.generateEmptyDiagram();
        }

        const title = mode ? `Cursor Mode: ${mode}` : 'Cursor Configuration';
        let diagram = `---\ntitle: ${title}\n---\nflowchart TD\n`;

        // If it's a mode-based config
        if (config.flows && Array.isArray(config.flows)) {
            diagram += this.generateFlowDiagram(config.flows, mode);
        } else if (config['cursor.composer.agents']) {
            // Legacy format
            diagram += this.generateAgentDiagram(config['cursor.composer.agents']);
        } else {
            return this.generateEmptyDiagram();
        }

        return diagram;
    }

    private generateFlowDiagram(flows: MermaidFlow[], mode?: string): string {
        let diagram = '';
        let nodeId = 0;

        // Create start node
        diagram += `    Start([Start: ${mode || 'Default Mode'}])\n`;
        let previousNode = 'Start';

        for (const flow of flows) {
            const flowNodeId = `F${nodeId++}`;
            diagram += `    ${flowNodeId}[${this.escapeLabel(flow.name)}]\n`;
            
            if (flow.description) {
                diagram += `    ${flowNodeId}_desc>"${this.escapeLabel(flow.description)}"]\n`;
                diagram += `    ${flowNodeId} -.-> ${flowNodeId}_desc\n`;
            }

            diagram += `    ${previousNode} --> ${flowNodeId}\n`;

            if (flow.tasks && flow.tasks.length > 0) {
                let previousTaskNode = flowNodeId;
                
                for (const task of flow.tasks) {
                    const taskNodeId = `T${nodeId++}`;
                    diagram += `    ${taskNodeId}[${this.escapeLabel(task.name)}]\n`;
                    diagram += `    ${previousTaskNode} --> ${taskNodeId}\n`;

                    if (task.agents && task.agents.length > 0) {
                        for (const agent of task.agents) {
                            const agentNodeId = `A${nodeId++}`;
                            const agentLabel = agent.role ? 
                                `${agent.name}\\n(${agent.role})` : 
                                agent.name;
                            diagram += `    ${agentNodeId}([${this.escapeLabel(agentLabel)}])\n`;
                            diagram += `    ${taskNodeId} --> ${agentNodeId}\n`;
                        }
                    }

                    previousTaskNode = taskNodeId;
                }
            }

            previousNode = flowNodeId;
        }

        // Create end node
        diagram += `    End([Configuration Applied])\n`;
        diagram += `    ${previousNode} --> End\n`;

        return diagram;
    }

    private generateAgentDiagram(agents: any[]): string {
        let diagram = '';
        let nodeId = 0;

        diagram += `    Start([Start])\n`;

        const taskGroups = this.groupAgentsByTask(agents);
        let previousNode = 'Start';

        for (const [taskName, taskAgents] of taskGroups) {
            const taskNodeId = `T${nodeId++}`;
            diagram += `    ${taskNodeId}[${this.escapeLabel(taskName)}]\n`;
            diagram += `    ${previousNode} --> ${taskNodeId}\n`;

            for (const agent of taskAgents) {
                const agentNodeId = `A${nodeId++}`;
                const agentLabel = agent.role ? 
                    `${agent.name}\\n(${agent.role})` : 
                    agent.name;
                diagram += `    ${agentNodeId}([${this.escapeLabel(agentLabel)}])\n`;
                diagram += `    ${taskNodeId} --> ${agentNodeId}\n`;
            }

            previousNode = taskNodeId;
        }

        diagram += `    End([Complete])\n`;
        diagram += `    ${previousNode} --> End\n`;

        return diagram;
    }

    private groupAgentsByTask(agents: any[]): Map<string, any[]> {
        const groups = new Map<string, any[]>();
        
        for (const agent of agents) {
            const taskName = agent.task || 'Default Task';
            if (!groups.has(taskName)) {
                groups.set(taskName, []);
            }
            groups.get(taskName)!.push(agent);
        }

        return groups;
    }

    private generateEmptyDiagram(): string {
        return `---\ntitle: Empty Configuration\n---\nflowchart TD\n    Start([No Configuration Found])\n    Start --> End([Please check your YAML file])\n`;
    }

    private escapeLabel(label: string): string {
        // Escape special characters for Mermaid
        return label
            .replace(/"/g, '\\"')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}');
    }
}