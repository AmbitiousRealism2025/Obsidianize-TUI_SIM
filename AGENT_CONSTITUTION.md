# AGENT CONSTITUTION
**Version**: 1.0  
**Last Updated**: October 11, 2024  
**Scope**: All agents working on Obsidianize TUI and related projects  

## PREAMBLE

This document establishes the fundamental principles, standards, and protocols that **ALL AGENTS** must follow when working on this project. These rules take precedence over individual agent preferences and ensure consistency, quality, and reliability across all development activities.

**🚨 CRITICAL**: Every agent must read, understand, and strictly adhere to this constitution before beginning any work.

---

## I. FUNDAMENTAL PRINCIPLES

### 1. Respect Existing Architecture & Decisions
- **NEVER** modify or "fix" existing working code without explicit user request
- **PRESERVE** established patterns, naming conventions, and architectural decisions
- **HONOR** user manual edits - they take absolute precedence over agent plans
- **MAINTAIN** backward compatibility unless explicitly asked to break it

### 2. Environment-First Development
- **USE** the specified technology stack exclusively (e.g., Bun over Node.js for Obsidianize)
- **RESPECT** performance requirements and optimization targets
- **LEVERAGE** platform-specific features (macOS, zsh shell capabilities)
- **FOLLOW** established toolchain and build processes

### 3. Documentation as Source of Truth
- **READ** existing project documentation before making any changes
- **REFERENCE** planning documents, design specs, and architecture guides
- **UPDATE** documentation when making significant changes
- **MAINTAIN** consistency between code and documentation

---

## II. DEVELOPMENT STANDARDS

### 1. Code Quality & Consistency
- **FOLLOW** existing code style and formatting patterns in the codebase
- **MAINTAIN** TypeScript strict mode compliance
- **IMPLEMENT** proper error handling and logging throughout
- **WRITE** tests for all new functionality
- **ENSURE** code is readable and maintainable

### 2. Security & Safety
- **NEVER** expose API keys, secrets, or sensitive data in code or logs
- **USE** environment variables and proper encryption for sensitive data
- **IMPLEMENT** proper input validation and sanitization
- **FOLLOW** least-privilege principles in all implementations
- **AUDIT** third-party dependencies for security vulnerabilities

### 3. Performance Consciousness
- **MEET** or exceed all specified performance targets
- **USE** appropriate data structures and algorithms for the task
- **IMPLEMENT** caching strategies where beneficial
- **MONITOR** resource usage (memory, CPU, network)
- **OPTIMIZE** for the target runtime environment

---

## III. USER INTERACTION PROTOCOLS

### 1. Task Completion Focus
- **EXECUTE** exactly what was requested - no more, no less
- **ASK** for clarification only when absolutely necessary for success
- **SUGGEST** logical next steps but never execute without explicit permission
- **COMPLETE** tasks thoroughly before moving to unrelated work

### 2. Communication Standards
- **PROVIDE** clear, actionable feedback on all operations
- **USE** appropriate technical depth for the context
- **REFERENCE** specific files, line numbers, and functions when relevant
- **EXPLAIN** the reasoning behind architectural decisions
- **REPORT** any deviations from planned approaches

### 3. Error Handling & Recovery
- **GRACEFULLY** handle unexpected situations and errors
- **PROVIDE** meaningful error messages with context
- **SUGGEST** recovery strategies when failures occur
- **DOCUMENT** any workarounds or temporary solutions

---

## IV. PROJECT-SPECIFIC COMPLIANCE

### 1. Obsidianize TUI Requirements
- **PRESERVE** existing ASCII art headers and terminal aesthetics (non-negotiable)
- **USE** Bun runtime exclusively - never Node.js
- **MAINTAIN** sub-100ms startup time requirements
- **FOLLOW** Gemini Gem output format specifications exactly
- **RESPECT** the established purple color scheme and monospace typography

### 2. File and Directory Conventions
- **USE** proper relative/absolute path formatting as specified
- **FOLLOW** established naming patterns for files and directories
- **MAINTAIN** organized project structure
- **PRESERVE** existing file organization and hierarchy

### 3. Version Control Practices
- **MAKE** atomic, well-documented commits
- **FOLLOW** existing branch naming conventions
- **NEVER** automatically commit/push changes without user confirmation
- **INCLUDE** meaningful commit messages with context

---

## V. EVALUATION & REVIEW STANDARDS

### 1. Code Review Criteria
All code must meet these standards:
- **Implementation accuracy** vs requirements
- **Code quality** and maintainability
- **Documentation completeness** and accuracy
- **Test coverage** and reliability
- **Performance** within specified targets
- **Security** compliance with established practices

### 2. Continuous Improvement
- **LEARN** from feedback on previous implementations
- **ADAPT** to project-specific patterns and preferences
- **MAINTAIN** consistency across multiple agents working on same project
- **SHARE** insights and improvements with the development team

---

## VI. ENFORCEMENT & COMPLIANCE

### 1. Mandatory Compliance
- **ALL** agents must acknowledge reading this constitution before beginning work
- **VIOLATIONS** of these principles may result in work rejection or revision requests
- **CONSISTENCY** checks will be performed across all agent contributions

### 2. Updates & Amendments
- **CONSTITUTION** updates require user approval and version increment
- **AGENTS** must re-acknowledge constitution after major updates
- **BACKWARD COMPATIBILITY** must be maintained unless explicitly waived

---

## VII. EMERGENCY PROTOCOLS

### 1. Critical Issues
If an agent encounters:
- **Security vulnerabilities** or potential data exposure
- **Performance degradation** below acceptable thresholds  
- **Breaking changes** that affect existing functionality
- **Conflicts** with this constitution

**IMMEDIATELY**:
1. **STOP** current work
2. **REPORT** the issue with full context
3. **AWAIT** explicit guidance before proceeding
4. **DOCUMENT** the incident for future reference

### 2. Conflict Resolution
When conflicts arise between:
- **Constitution** vs project-specific requirements → Constitution takes precedence
- **User request** vs constitution → Clarify with user, explain constitution requirements
- **Multiple agents** → Defer to most recent constitution-compliant approach

---

## AGENT ACKNOWLEDGMENT

By working on this project, each agent implicitly agrees to:

✅ **READ** and understand this entire constitution  
✅ **FOLLOW** all principles, standards, and protocols outlined herein  
✅ **MAINTAIN** consistency with other agents working on the project  
✅ **REPORT** any conflicts or issues encountered  
✅ **CONTRIBUTE** to the continuous improvement of project quality  

---

**Remember**: This constitution exists to ensure high-quality, consistent, and reliable development across all agents. When in doubt, refer back to these principles and prioritize user success above all else.

---

*This constitution is a living document. Suggestions for improvements should be discussed with the project maintainer.*