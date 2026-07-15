# Delta for UI/Wizard Components

## ADDED Requirements

### Requirement: Component Size Limits

All wizard components SHALL not exceed 300 lines of code to maintain readability and testability.

#### Scenario: Component size validation

- GIVEN a wizard component file
- WHEN counting lines of code
- THEN the count MUST be less than or equal to 300
- AND the component SHOULD be under 200 lines for optimal maintainability

### Requirement: Single Responsibility Principle

Each wizard component MUST have a single, well-defined responsibility.

#### Scenario: Wizard option component responsibility

- GIVEN the WizardOption component
- WHEN rendered
- THEN it MUST only handle option display and selection
- AND it MUST NOT manage wizard state or progression

#### Scenario: Wizard progress component responsibility

- GIVEN the WizardProgress component
- WHEN rendered
- THEN it MUST only display progress information
- AND it MUST NOT handle user interactions or state changes

### Requirement: Type Safety

All wizard components MUST use proper TypeScript types for props and state.

#### Scenario: Component prop validation

- GIVEN a wizard component
- WHEN receiving props
- THEN all props MUST be typed with interfaces
- AND TypeScript MUST compile without errors

#### Scenario: Runtime type validation

- GIVEN external data (questions, options)
- WHEN processed by components
- THEN the data MUST be validated at runtime
- AND invalid data MUST be rejected or handled gracefully

### Requirement: Component Composition

Wizard components MUST be composable and reusable across different contexts.

#### Scenario: Option component reusability

- GIVEN the WizardOption component
- WHEN used in different wizard steps
- THEN it MUST render correctly with different data
- AND it MUST maintain consistent behavior

#### Scenario: Progress component flexibility

- GIVEN the WizardProgress component
- WHEN configured with different total steps
- THEN it MUST display accurate progress
- AND it MUST adapt to different step counts

## MODIFIED Requirements

### Requirement: Wizard State Management

The wizard state management MUST be extracted to a custom hook.

(Previously: State management was embedded in the main component)

#### Scenario: Hook-based state management

- GIVEN the useWizard hook
- WHEN called by WizardSelector
- THEN it MUST provide all necessary state and actions
- AND it MUST handle step progression and answer storage

#### Scenario: State persistence

- GIVEN user answers in the wizard
- WHEN navigating between steps
- THEN the hook MUST preserve all answers
- AND it MUST maintain current step state

### Requirement: Data Separation

Static wizard data MUST be separated from component code.

(Previously: Questions and results were embedded in the component)

#### Scenario: External data loading

- GIVEN the wizard components
- WHEN initializing
- THEN they MUST load questions from data files
- AND they MUST load concrete types from separate data files

#### Scenario: Data consistency

- GIVEN wizard data files
- WHEN referenced by components
- THEN the data structure MUST match expected interfaces
- AND all required fields MUST be present

## REMOVED Requirements

### Requirement: Monolithic Component Structure

The single large WizardSelector component structure is removed.

(Reason: To improve maintainability and follow single responsibility principle)

#### Scenario: Component decomposition

- GIVEN the original WizardSelector component
- WHEN refactoring
- THEN it MUST be split into smaller components
- AND each component MUST have focused responsibility

### Requirement: Inline Data Definitions

Inline question and result definitions within components are removed.

(Reason: To separate data from presentation logic)

#### Scenario: Data externalization

- GIVEN component code with inline data
- WHEN refactoring
- THEN all data MUST be moved to external files
- AND components MUST import data from appropriate modules
