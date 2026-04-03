---
name: Test Generator
description: Generates comprehensive unit and integration tests
---
# Test Generator Skill for Cline

## Overview
Automatically generate comprehensive test suites for code including unit tests and integration tests.

## When to Use
- User needs tests for new code
- Increasing test coverage
- Adding missing test cases

## Test Generation Process

### 1. Analysis Phase
- Understand function/module purpose
- Identify all code paths
- Note dependencies
- Find edge cases

### 2. Test Coverage
Generate tests for:
- ✅ Happy path (expected behavior)
- ✅ Edge cases (boundaries, null, empty)
- ✅ Error handling (exceptions, invalid input)
- ✅ Integration points (if needed)

### 3. Framework Selection
Ask user for framework preference:
- **JavaScript**: Jest, Mocha, Vitest
- **Python**: pytest, unittest
- **Java**: JUnit
- **C#**: xUnit
- **Go**: testing package

### 4. Test Structure (AAA)
```
Arrange → Act → Assert
```

## Quality Standards

- [ ] 80%+ code coverage
- [ ] All public methods tested
- [ ] All branches covered
- [ ] Mocks for external dependencies
- [ ] Descriptive test names
- [ ] Independent tests

## Example Template

```javascript
describe('FeatureName', () => {
  // Happy path
  test('should do X when Y', () => {
    const input = ...;
    const result = fn(input);
    expect(result).toBe(...);
  });

  // Edge cases
  test('should handle null input', () => {
    expect(fn(null)).toBe(...);
  });

  // Errors
  test('should throw on invalid input', () => {
    expect(() => fn(bad)).toThrow();
  });
});
```
