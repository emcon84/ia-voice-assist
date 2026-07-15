# Delta for UI/Chat Components

## ADDED Requirements

### Requirement: Component Size Limits

All chat components SHALL not exceed 300 lines of code to maintain readability and testability.

#### Scenario: Main component size validation

- GIVEN the refactored ChatPage component
- WHEN counting lines of code
- THEN the count MUST be less than or equal to 300
- AND it SHOULD be under 200 lines for optimal maintainability

#### Scenario: Sub-component size validation

- GIVEN extracted chat components
- WHEN counting lines of code
- THEN each component MUST be under 300 lines
- AND each SHOULD have focused responsibility

### Requirement: Single Responsibility Principle

Each chat component MUST have a single, well-defined responsibility.

#### Scenario: ChatHeader responsibility

- GIVEN the ChatHeader component
- WHEN rendered
- THEN it MUST only handle header display and navigation
- AND it MUST NOT manage chat state or messages

#### Scenario: ChatMessages responsibility

- GIVEN the ChatMessages component
- WHEN rendered
- THEN it MUST only handle message display and scrolling
- AND it MUST NOT manage input or API calls

#### Scenario: ChatInput responsibility

- GIVEN the ChatInput component
- WHEN rendered
- THEN it MUST only handle input field and message sending
- AND it MUST NOT manage message history or state

### Requirement: Component Composition

Chat components MUST be composable and work together seamlessly.

#### Scenario: Component integration

- GIVEN all chat components
- WHEN composed in ChatPage
- THEN they MUST work together without conflicts
- AND state MUST be shared properly through hooks

#### Scenario: Props interface consistency

- GIVEN chat component interfaces
- WHEN defining props
- THEN they MUST follow consistent patterns
- AND TypeScript MUST validate all prop types

## MODIFIED Requirements

### Requirement: State Management Strategy

Chat state management MUST be extracted to custom hooks.

(Previously: State management was embedded in the main component)

#### Scenario: useChat hook functionality

- GIVEN the useChat hook
- WHEN used by ChatPage
- THEN it MUST provide all chat state and actions
- AND it MUST handle message sending and receiving

#### Scenario: useNavigation hook functionality

- GIVEN the useNavigation hook
- WHEN used by ChatPage
- THEN it MUST manage view transitions
- AND it MUST handle navigation state

### Requirement: API Communication

API calls MUST be extracted to a service layer.

(Previously: API calls were embedded in component methods)

#### Scenario: Service layer usage

- GIVEN the chatApi service
- WHEN called by hooks
- THEN it MUST handle all API communication
- AND it MUST provide proper error handling

#### Scenario: Error handling consistency

- GIVEN API service errors
- WHEN propagated to components
- THEN they MUST be handled consistently
- AND user feedback MUST be appropriate

## REMOVED Requirements

### Requirement: Monolithic Chat Component

The single large ChatPage component structure is removed.

(Reason: To improve maintainability and follow single responsibility principle)

#### Scenario: Component decomposition

- GIVEN the original ChatPage component
- WHEN refactoring
- THEN it MUST be split into smaller components
- AND each component MUST have focused responsibility

### Requirement: Embedded Component Definitions

Embedded component definitions within ChatPage are removed.

(Reason: To improve reusability and testability)

#### Scenario: Component extraction

- GIVEN embedded components
- WHEN refactoring
- THEN they MUST be extracted to separate files
- AND they MUST be importable independently
