# Delta for Data/Wizard

## ADDED Requirements

### Requirement: Data Layer Separation

All wizard-related data MUST be separated from component code into dedicated data files.

#### Scenario: Questions data externalization

- GIVEN wizard questions
- WHEN the application starts
- THEN questions MUST be loaded from `/src/data/wizardQuestions.ts`
- AND the data structure MUST match the WizardQuestion interface

#### Scenario: Concrete types data externalization

- GIVEN concrete type definitions
- WHEN displaying results
- THEN concrete types MUST be loaded from `/src/data/concreteTypes.ts`
- AND each type MUST contain title, description, icon, color, and rationale

### Requirement: Data Type Safety

All wizard data MUST be typed with proper TypeScript interfaces.

#### Scenario: Interface compliance

- GIVEN wizard data files
- WHEN compiled
- THEN all data MUST comply with defined interfaces
- AND TypeScript MUST validate structure correctness

#### Scenario: Runtime validation

- GIVEN external data sources
- WHEN processed by the application
- THEN data MUST be validated at runtime
- AND invalid data MUST be rejected with appropriate error handling

### Requirement: Data Immutability

Wizard data MUST be treated as immutable throughout the application.

#### Scenario: Data integrity

- GIVEN wizard questions and results
- WHEN accessed by components
- THEN the original data MUST not be modified
- AND any transformations MUST create new objects

#### Scenario: Reference stability

- GIVEN wizard data references
- WHEN used across components
- THEN the references MUST remain stable
- AND components SHOULD not create unnecessary copies

## MODIFIED Requirements

### Requirement: Data Import Strategy

The data import strategy MUST use barrel exports for clean imports.

(Previously: Data was embedded directly in components)

#### Scenario: Barrel export usage

- GIVEN wizard components
- WHEN importing data
- THEN they MUST use barrel exports from index files
- AND import paths MUST be clean and consistent

#### Scenario: Import path resolution

- GIVEN TypeScript path aliases
- WHEN importing data modules
- THEN the aliases MUST resolve correctly
- AND all imports MUST compile without errors

### Requirement: Data Structure Organization

Wizard data MUST be organized by domain and purpose.

(Previously: All data was mixed within component code)

#### Scenario: Domain separation

- GIVEN wizard data files
- WHEN organized
- THEN questions MUST be in separate files from concrete types
- AND constants MUST be in dedicated files

#### Scenario: Logical grouping

- GIVEN related data elements
- WHEN structured
- THEN related items MUST be grouped together
- AND the grouping MUST reflect usage patterns

## REMOVED Requirements

### Requirement: Inline Data Definitions

Inline data definitions within component files are removed.

(Reason: To separate concerns and improve data maintainability)

#### Scenario: Data extraction

- GIVEN component files with inline data
- WHEN refactoring
- THEN all data MUST be extracted to dedicated files
- AND components MUST import data instead of defining it

### Requirement: Mixed Data and Logic

Mixing of data definitions with component logic is removed.

(Reason: To improve separation of concerns and testability)

#### Scenario: Logic separation

- GIVEN component code
- WHEN refactoring
- THEN business logic MUST be separated from data definitions
- AND data MUST be independently testable
