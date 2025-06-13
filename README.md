# Cursor Mode Manager

A VS Code extension for Cursor that provides YAML-driven mode switching and agent configuration management.

## Features

- **Mode Switching**: Quick switch between different development modes (development, writing, video production)
- **YAML Configuration**: Define your modes and workflows in simple YAML files
- **Auto-reload**: Automatically reload configurations when YAML files are saved
- **Mermaid Diagrams**: Generate visual diagrams of your configuration workflows
- **Agent Management**: Configure AI agents with specific prompts and roles

## Installation

1. Download the latest `cursor-mode-manager.vsix` file
2. In Cursor/VS Code, open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
3. Type "Extensions: Install from VSIX..."
4. Select the downloaded VSIX file

## Usage

### Creating a Configuration File

Create a `cursor_modes.yaml` file in your workspace root:

```yaml
modes:
  - name: "development"
    description: "Development mode with coding agents"
    tasks: ["coding-flow"]
  - name: "writing"
    description: "Writing mode with content creation agents"
    tasks: ["content-flow"]

flows:
  - name: "coding-flow"
    description: "Main coding workflow"
    tasks:
      - name: "code-development"
        agents:
          - name: "senior-developer"
            role: "tech-lead"
            prompts:
              - "Write clean, maintainable code"
              - "Follow best practices"

default_mode: "development"
```

### Switching Modes

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "Switch Cursor Mode"
3. Select your desired mode from the list
4. The extension will automatically reload the window with new settings

### Commands

- `Switch Cursor Mode`: Switch between different configured modes
- `Generate Cursor Config from YAML`: Generate configuration from any YAML file

## Configuration Format

### Modes
Define different working modes with descriptions and associated tasks:

```yaml
modes:
  - name: "mode-name"
    description: "Mode description"
    tasks: ["task-flow-name"]
```

### Flows
Define workflows that contain tasks and agents:

```yaml
flows:
  - name: "flow-name"
    description: "Flow description"
    tasks:
      - name: "task-name"
        agents:
          - name: "agent-name"
            role: "agent-role"
            prompts: ["prompt1", "prompt2"]
```

### Default Mode
Set a default mode that will be used when no specific mode is selected:

```yaml
default_mode: "development"
```

## Auto-reload

The extension automatically watches for changes to YAML files containing "cursor", "mode", or "config" in their filename. When these files are saved, the configuration is automatically regenerated and applied.

## Mermaid Diagrams

When switching modes, the extension generates a Mermaid diagram showing the workflow structure and saves it as `cursor-mode-diagram.mmd` in your workspace.

## Development

### Building from Source

```bash
npm install
npm run compile
npm run test
npx @vscode/vsce package
```

### Testing

```bash
npm test
```

## License

MIT - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Support

For issues and feature requests, please use the GitHub issue tracker.