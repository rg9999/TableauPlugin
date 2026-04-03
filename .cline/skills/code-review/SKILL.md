---
name: Code Review
description: Performs comprehensive code reviews with best practices
---
# Code Review Skill for Cline

## Overview
Comprehensive code review capability for analyzing code quality, security, and best practices.

## When to Use
- User requests code review
- Before merging code changes
- During development for quality checks

## Review Checklist

### Code Quality
- [ ] Clear and readable code
- [ ] Proper naming conventions
- [ ] Well-organized structure
- [ ] No obvious bugs

### Best Practices
- [ ] Follows language conventions
- [ ] Proper error handling
- [ ] Performance optimized
- [ ] No code duplication

### Security
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Proper input validation
- [ ] Secure authentication/authorization

### Testing & Docs
- [ ] Adequate test coverage
- [ ] Edge cases handled
- [ ] Well-documented code
- [ ] Clear comments

## Response Template

```markdown
## 🔍 Code Review Results

### ✅ Strengths
[List what's done well]

### ⚠️ Issues
**[Severity]** [Issue]
- File: [path:line]
- Fix: [solution]

### 💡 Recommendations
[Suggestions for improvement]

### 📈 Score
[Overall quality rating]
```
