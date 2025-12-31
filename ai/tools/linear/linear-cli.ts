#!/usr/bin/env node

import { LinearClient } from "@linear/sdk";
import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { execSync } from "child_process";

// Initialize Linear client only if API key is available
let linear: LinearClient | undefined;

// Only require API key for commands that need it, not for help or completions
const needsAuth = process.argv.length > 2 && 
  !['--help', '-h', '--version', '-v', 'completion', 'help'].includes(process.argv[2]);

if (needsAuth) {
  if (!process.env.LINEAR_API_KEY) {
    console.error(chalk.red("Error: Missing LINEAR_API_KEY environment variable"));
    console.error(chalk.yellow("Please set it with: export LINEAR_API_KEY=your_api_key"));
    process.exit(1);
  }
  
  linear = new LinearClient({
    apiKey: process.env.LINEAR_API_KEY,
  });
}

// Git branch utility functions
function getGitBranch(): string {
  try {
    return execSync("git branch --show-current").toString().trim();
  } catch (error) {
    return "";
  }
}

function extractIssueId(branchName: string): string | null {
  // Match patterns like ENG-123, eng-123, etc.
  const match = branchName.match(/[A-Za-z]+-\d+/);
  return match ? match[0].toUpperCase() : null;
}

async function getIssueIdInteractively(defaultId: string | null = null): Promise<string> {
  const { issueId } = await inquirer.prompt({
    type: "input",
    name: "issueId",
    message: "Enter Linear issue ID (e.g. ENG-123):",
    default: defaultId,
    validate: (input) => {
      return /^[A-Za-z]+-\d+$/i.test(input) ? true : "Please enter a valid issue ID (e.g. ENG-123)";
    },
  });
  
  return issueId.toUpperCase();
}

async function resolveIssueId(providedId?: string): Promise<string> {
  // If ID is provided as argument, use it
  if (providedId && /^[A-Za-z]+-\d+$/i.test(providedId)) {
    return providedId.toUpperCase();
  }
  
  // Try to extract from git branch
  const gitBranch = getGitBranch();
  const idFromBranch = gitBranch ? extractIssueId(gitBranch) : null;
  
  // If found in branch, use it
  if (idFromBranch) {
    return idFromBranch;
  }
  
  // Otherwise, prompt user
  return getIssueIdInteractively(providedId || null);
}

// Command implementations
async function listIssues() {
  try {
    if (!linear) {
      throw new Error("Linear client not initialized. Check your API key.");
    }
    
    const user = await linear.viewer;
    const issues = await user.assignedIssues({ first: 50 });
    
    console.log(chalk.bold("\nYour assigned issues:"));
    
    if (!issues.nodes.length) {
      console.log(chalk.yellow("No issues assigned to you."));
      return;
    }
    
    // Filter out completed and canceled issues
    const activeIssues = [];
    
    for (const issue of issues.nodes) {
      const state = await issue.state;
      // Skip issues that are completed, canceled, or done
      if (state && (state.name.toLowerCase().includes("done") || 
                    state.name.toLowerCase().includes("completed") || 
                    state.name.toLowerCase().includes("canceled") ||
                    state.name.toLowerCase().includes("cancelled"))) {
        continue;
      }
      activeIssues.push(issue);
    }
    
    if (activeIssues.length === 0) {
      console.log(chalk.yellow("No active issues assigned to you."));
      return;
    }
    
    activeIssues.forEach((issue) => {
      console.log(`[${chalk.cyan(issue.identifier)}] ${issue.title}`);
    });
    
    // Show pagination info if there are more issues
    if (issues.pageInfo.hasNextPage) {
      console.log(chalk.dim("\nShowing first 50 active issues. There may be more issues available."));
    }
  } catch (error) {
    console.error(chalk.red("Error fetching issues:"), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

async function getIssue(issueId?: string) {
  try {
    if (!linear) {
      throw new Error("Linear client not initialized. Check your API key.");
    }
    
    const resolvedId = await resolveIssueId(issueId);
    const issue = await linear.issue(resolvedId);
    
    if (!issue) {
      console.error(chalk.red(`Issue ${resolvedId} not found.`));
      process.exit(1);
    }
    
    const comments = await issue.comments();
    const assignee = await issue.assignee;
    const state = await issue.state;
    
    // Format issue details with branch name in header
    console.log(chalk.bold(`\n[${issue.identifier}] ${issue.title}`));
    if (issue.branchName) {
      console.log(chalk.dim(`Branch: ${issue.branchName}`));
    }
    console.log(chalk.dim(`Status: ${state?.name || "Unknown"}`));
    
    if (assignee) {
      console.log(chalk.dim(`Assignee: ${assignee.name}`));
    }
    
    if (issue.description) {
      console.log(chalk.bold("\nDescription:"));
      console.log(issue.description);
    }
    
    // Format comments
    if (comments.nodes.length > 0) {
      console.log(chalk.bold("\nComments:"));
      
      // Reverse the comments array to show oldest first
      const reversedComments = [...comments.nodes].reverse();
      
      for (const comment of reversedComments) {
        const commentUser = await comment.user;
        const commentDate = new Date(comment.createdAt);
        const dateStr = commentDate.toISOString().split("T")[0];
        const timeStr = commentDate.toTimeString().split(" ")[0]; // HH:MM:SS format
        
        console.log(chalk.dim(`[${dateStr} ${timeStr}] ${commentUser?.name || "Unknown"}:`));
        console.log(comment.body);
        console.log(); // Empty line between comments
      }
    } else {
      console.log(chalk.dim("\nNo comments on this issue."));
    }
    
    console.log(chalk.dim(`\nView in Linear: ${issue.url}`));
  } catch (error) {
    console.error(chalk.red("Error fetching issue:"), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

async function addComment(message: string, options: { issueId?: string }) {
  try {
    if (!linear) {
      throw new Error("Linear client not initialized. Check your API key.");
    }
    
    // Ensure we have a message
    if (!message || message.trim() === '') {
      console.error(chalk.red("Error: Message required"));
      process.exit(1);
    }
    
    // Try to get issue ID from options or git branch, with interactive fallback
    // Use the same resolveIssueId function that getIssue uses for consistency
    const issueId = await resolveIssueId(options.issueId);
    
    // Create comment
    const result = await linear.commentCreate({
      issueId,
      body: message,
    });
    
    if (result.success) {
      console.log(chalk.green(`Comment added to issue ${issueId}!`));
    } else {
      console.error(chalk.red("Failed to add comment."));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red("Error adding comment:"), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Set up CLI commands
const program = new Command();

program
  .name("linear")
  .description("Command line interface for Linear")
  .version("1.0.0")
  .enablePositionalOptions()
  .showHelpAfterError();

program
  .command("list-issues")
  .description("List your assigned issues")
  .action(listIssues);

program
  .command("get-issue [id]")
  .description("Show issue details and comments (ID optional if in git branch)")
  .action(getIssue);

program
  .command("add-comment <message>")
  .description("Add a comment to an issue (auto-detects issue ID from git branch)")
  .option("-i, --issue-id <id>", "Specify the Linear issue ID manually")
  .action(addComment);

program
  .command("create-issue")
  .description("Create a new issue in Linear. Keep the Issue description concise, precise and accurate. Always include objectives and acceptance criteria as bullet points. Do not add any implementation plan or phases.")
  .requiredOption("-t, --title <title>", "Issue title")
  .requiredOption("--team <teamKey>", "Team key (e.g., HAY)")
  .option("-d, --description <description>", "Issue description (markdown)")
  .option("-a, --assignee <username>", "Assignee username")
  .option("-p, --priority <priority>", "Priority (0=none, 1=urgent, 2=high, 3=medium, 4=low)", "0")
  .option("-l, --labels <labels>", "Comma-separated label names (e.g., 'research,backend')")
  .action(async (options: { title: string; team: string; description?: string; assignee?: string; priority?: string; labels?: string }) => {
    try {
      if (!linear) {
        throw new Error("Linear client not initialized. Check your API key.");
      }

      // Find team by key
      const teams = await linear.teams();
      const team = teams.nodes.find(t => t.key === options.team);
      if (!team) {
        console.error(chalk.red(`Team '${options.team}' not found. Available teams:`));
        teams.nodes.forEach(t => console.log(`  ${t.key}: ${t.name}`));
        process.exit(1);
      }

      // Find assignee if provided
      let assigneeId: string | undefined;
      if (options.assignee) {
        const users = await linear.users();
        const user = users.nodes.find(u =>
          u.name.toLowerCase().includes(options.assignee!.toLowerCase()) ||
          u.email?.toLowerCase().includes(options.assignee!.toLowerCase())
        );
        if (user) {
          assigneeId = user.id;
        } else {
          console.error(chalk.yellow(`Warning: User '${options.assignee}' not found. Creating issue without assignee.`));
        }
      }

      // Find labels if provided
      let labelIds: string[] | undefined;
      if (options.labels) {
        const requestedLabels = options.labels.split(',').map(l => l.trim().toLowerCase());
        const allLabels = await linear.issueLabels();
        labelIds = [];

        for (const reqLabel of requestedLabels) {
          const found = allLabels.nodes.find(l => l.name.toLowerCase() === reqLabel);
          if (found) {
            labelIds.push(found.id);
          } else {
            // Create the label if it doesn't exist
            const result = await linear.issueLabelCreate({
              name: reqLabel.charAt(0).toUpperCase() + reqLabel.slice(1),
              teamId: team.id,
            });
            const newLabel = await result.issueLabel;
            if (newLabel) {
              labelIds.push(newLabel.id);
              console.log(chalk.dim(`Created label: ${newLabel.name}`));
            }
          }
        }
      }

      // Create the issue
      const issuePayload: {
        title: string;
        teamId: string;
        description?: string;
        assigneeId?: string;
        priority?: number;
        labelIds?: string[];
      } = {
        title: options.title,
        teamId: team.id,
      };

      if (options.description) {
        issuePayload.description = options.description;
      }
      if (assigneeId) {
        issuePayload.assigneeId = assigneeId;
      }
      if (options.priority) {
        issuePayload.priority = parseInt(options.priority, 10);
      }
      if (labelIds && labelIds.length > 0) {
        issuePayload.labelIds = labelIds;
      }

      const result = await linear.issueCreate(issuePayload);
      const issue = await result.issue;

      if (issue) {
        console.log(chalk.green(`\nIssue created successfully!`));
        console.log(`${chalk.cyan(issue.identifier)}: ${issue.title}`);
        console.log(chalk.dim(`URL: ${issue.url}`));
      } else {
        console.error(chalk.red("Failed to create issue."));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red("Error creating issue:"), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command("update-issue <issueId>")
  .description("Update an existing issue (add labels, change assignee, priority, project)")
  .option("-l, --labels <labels>", "Comma-separated label names to add")
  .option("-a, --assignee <username>", "Assignee username")
  .option("-p, --priority <priority>", "Priority (1=urgent, 2=high, 3=medium, 4=low)")
  .option("--project <name>", "Project name to add issue to")
  .action(async (issueId: string, options: { labels?: string; assignee?: string; priority?: string; project?: string }) => {
    try {
      if (!linear) {
        throw new Error("Linear client not initialized. Check your API key.");
      }

      const resolvedId = await resolveIssueId(issueId);
      const issue = await linear.issue(resolvedId);
      if (!issue) {
        console.error(chalk.red(`Issue ${resolvedId} not found.`));
        process.exit(1);
      }

      const updatePayload: { labelIds?: string[]; assigneeId?: string; priority?: number; projectId?: string } = {};

      // Handle labels
      if (options.labels) {
        const requestedLabels = options.labels.split(',').map(l => l.trim().toLowerCase());
        const allLabels = await linear.issueLabels();
        const team = await issue.team;
        const labelIds: string[] = [];

        // Get existing label IDs
        const existingLabels = await issue.labels();
        existingLabels.nodes.forEach(l => labelIds.push(l.id));

        for (const reqLabel of requestedLabels) {
          const found = allLabels.nodes.find(l => l.name.toLowerCase() === reqLabel);
          if (found) {
            if (!labelIds.includes(found.id)) {
              labelIds.push(found.id);
            }
          } else {
            // Create the label if it doesn't exist
            const result = await linear.issueLabelCreate({
              name: reqLabel.charAt(0).toUpperCase() + reqLabel.slice(1),
              teamId: team!.id,
            });
            const newLabel = await result.issueLabel;
            if (newLabel) {
              labelIds.push(newLabel.id);
              console.log(chalk.dim(`Created label: ${newLabel.name}`));
            }
          }
        }
        updatePayload.labelIds = labelIds;
      }

      // Handle assignee
      if (options.assignee) {
        const users = await linear.users();
        const user = users.nodes.find(u =>
          u.name.toLowerCase().includes(options.assignee!.toLowerCase()) ||
          u.email?.toLowerCase().includes(options.assignee!.toLowerCase())
        );
        if (user) {
          updatePayload.assigneeId = user.id;
        } else {
          console.error(chalk.yellow(`Warning: User '${options.assignee}' not found.`));
        }
      }

      // Handle priority
      if (options.priority) {
        updatePayload.priority = parseInt(options.priority, 10);
      }

      // Handle project
      if (options.project) {
        // Use raw GraphQL to find project since SDK has schema issues
        const graphqlClient = linear as any;
        try {
          const result = await graphqlClient.client.rawRequest(`
            query {
              projects(first: 50) {
                nodes {
                  id
                  name
                }
              }
            }
          `);
          const projects = result.data.projects.nodes;
          const project = projects.find((p: any) =>
            p.name.toLowerCase().includes(options.project!.toLowerCase())
          );
          if (project) {
            updatePayload.projectId = project.id;
          } else {
            console.error(chalk.yellow(`Warning: Project '${options.project}' not found. Available projects:`));
            projects.forEach((p: any) => console.log(`  - ${p.name}`));
          }
        } catch (e) {
          console.error(chalk.yellow(`Warning: Could not fetch projects.`));
        }
      }

      if (Object.keys(updatePayload).length > 0) {
        await linear.issueUpdate(issue.id, updatePayload);
        console.log(chalk.green(`Updated ${resolvedId}`));
      } else {
        console.log(chalk.yellow("No updates specified."));
      }
    } catch (error) {
      console.error(chalk.red("Error updating issue:"), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Add completion generation
program
  .command("completion")
  .description("Generate shell completion script")
  .option("--bash", "Generate Bash completion script")
  .option("--zsh", "Generate Zsh completion script")
  .option("--fish", "Generate Fish completion script")
  .action((options) => {
    const commands = ["list-issues", "get-issue", "add-comment", "completion", "help"];
    
    if (options.bash) {
      // Basic bash completion
      console.log(`#!/usr/bin/env bash
# Bash completion for linear CLI

_linear_completions() {
  local cur prev commands
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  commands="${commands.join(' ')}"

  if [ \$COMP_CWORD -eq 1 ]; then
    COMPREPLY=( \$(compgen -W "\$commands" -- \$cur) )
  elif [ "\$prev" = "add-comment" ] && [ \$COMP_CWORD -eq 2 ]; then
    COMPREPLY=( \$(compgen -W "--issue-id -i" -- \$cur) )
  fi

  return 0
}

complete -F _linear_completions linear`);
    } else if (options.zsh) {
      // Basic zsh completion
      console.log(`#compdef linear

_linear() {
  local -a commands
  commands=(
    'list-issues:List your assigned issues'
    'get-issue:Show issue details and comments'
    'add-comment:Add a comment to an issue'
    'completion:Generate shell completion script'
    'help:Display help for command'
  )

  if (( CURRENT == 2 )); then
    _describe 'command' commands
  elif (( CURRENT == 3 )); then
    case \$words[2] in
      add-comment)
        _arguments \\
          '-i[Specify the Linear issue ID manually]' \\
          '--issue-id[Specify the Linear issue ID manually]'
        ;;
    esac
  fi
}

_linear`);
    } else if (options.fish) {
      // Basic fish completion
      console.log(`# Fish completion for linear CLI

complete -c linear -f

# Commands
complete -c linear -n "__fish_use_subcommand" -a "list-issues" -d "List your assigned issues"
complete -c linear -n "__fish_use_subcommand" -a "get-issue" -d "Show issue details and comments"
complete -c linear -n "__fish_use_subcommand" -a "add-comment" -d "Add a comment to an issue"
complete -c linear -n "__fish_use_subcommand" -a "completion" -d "Generate shell completion script"
complete -c linear -n "__fish_use_subcommand" -a "help" -d "Display help for command"

# Options for add-comment
complete -c linear -n "__fish_seen_subcommand_from add-comment" -s i -l issue-id -d "Specify the Linear issue ID manually"

# Options for completion
complete -c linear -n "__fish_seen_subcommand_from completion" -l bash -d "Generate Bash completion script"
complete -c linear -n "__fish_seen_subcommand_from completion" -l zsh -d "Generate Zsh completion script"
complete -c linear -n "__fish_seen_subcommand_from completion" -l fish -d "Generate Fish completion script"`);
    } else {
      console.error(chalk.red("Please specify a shell: --bash, --zsh, or --fish"));
      process.exit(1);
    }
  });

// Parse and execute
program.parse(process.argv);

// Show help if no command is provided
if (process.argv.length <= 2) {
  program.help();
}