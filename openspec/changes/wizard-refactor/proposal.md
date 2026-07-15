# Wizard Component Refactor - Proposal

## Intent
Refactor the monolithic WizardSelector component to follow Clean Code and SOLID principles, improving maintainability, testability, and reusability.

## Scope
- Extract data layer (questions, concrete types) to separate files
- Create custom hooks for business logic
- Split WizardSelector into smaller, focused components
- Add proper TypeScript types and validation
- Implement barrel exports for clean imports
- Apply component size limits (<300 lines per component)

## Approach
1. **Data Layer Separation**: Move static data to `/src/data/`
2. **Type Definitions**: Create shared interfaces in `/src/types/`
3. **Custom Hooks**: Extract state management to `/src/hooks/`
4. **Component Decomposition**: Split into WizardOption, WizardProgress, WizardQuestion, WizardResult
5. **Constants**: Extract magic values to `/src/constants/`
6. **Testing Infrastructure**: Prepare for future test implementation

## Affected Areas
- `src/components/chat/WizardSelector.tsx` (main component)
- `src/app/chat/page.tsx` (imports)
- New files: types, data, hooks, constants, sub-components

## Rollback Plan
- Keep original WizardSelector.tsx as WizardSelector.old.tsx
- All new files are additive, no existing functionality removed
- Can revert by restoring original file and updating imports

## Success Criteria
- All components under 300 lines
- Clear separation of concerns
- Type safety maintained
- No breaking changes to public API
- Ready for comprehensive testing
