// Global Vitest setup for React 19 act() compatibility
if (typeof globalThis !== 'undefined') {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
}

// Testing Library's default waitFor timeout is 1000ms. Several components debounce
// user input (e.g. AppsStudio's 300ms search debounce) and the whole-suite run
// executes many files in parallel workers, so on a loaded machine the debounce
// timer plus React's commit cycle can exceed that budget and tests fail for
// timing reasons alone. Raising the async-utility budget removes that flake
// class without weakening any assertion: waitFor still has to observe the real
// end state.
import { configure } from '@testing-library/react'

configure({ asyncUtilTimeout: 5000 })
