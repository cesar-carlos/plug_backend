# TypeScript Best Practices & Coding Standards (2025)

## 1. Core Principles & Strictness

### Enable Strict Mode
Always have `strict: true` in your `tsconfig.json`. This enables a wide range of type checking rules that catch errors early.
- **`noImplicitAny`**: Prevents variables from implicitly inferring `any`.
- **`strictNullChecks`**: Makes strict distinction between `null`/`undefined` and other types.
- **`strictFunctionTypes`**: Enforces stricter checking for function parameter bivariance.

### Avoid `any`, Prefer `unknown`
- **Never use `any`**: It silently disables type checking and propagates lack of safety.
- **Use `unknown`**: If a value is truly dynamic, use `unknown`. It forces you to perform type checks (narrowing) before using the value.

```typescript
// ❌ Bad
function process(data: any) {
  data.format(); // No error, but might crash
}

// ✅ Good
function process(data: unknown) {
  if (data instanceof String) {
    data.trim(); // Safe
  }
}
```

### Explict Return Types
Always define return types for functions, especially exported ones. This prevents accidental return type changes and improves compiler performance.

```typescript
// ❌ Bad
export const getUser = (id: string) => db.users.find(id);

// ✅ Good
export const getUser = (id: string): Promise<User | null> => {
  return db.users.find(id);
};
```

## 2. Type System Utilization

### Interfaces vs Types
- **Use `interface`** for defining public API shapes and object structures (better error messages, extendable).
- **Use `type`** for unions, intersections, primitives, and complex utility types.

```typescript
// Object shape
interface User {
  id: string;
  name: string;
}

// Union
type Status = 'pending' | 'active' | 'archived';
```

### Immutability
Use `readonly` by default for array and object properties to prevent mutation side-effects.

```typescript
interface State {
  readonly id: string;
  readonly tags: readonly string[];
}
```

### Utility Types
Leverage built-in utilities to avoid duplication.
- `Pick<T, K>` / `Omit<T, K>`
- `Partial<T>` / `Required<T>`
- `Readonly<T>`
- `ReturnType<T>`

## 3. Modern Patterns (2024+)

### The `satisfies` Operator
Use `satisfies` to validate a value matches a type *without* widening the type (preserving literal inference).

```typescript
// ✅ Good
const config = {
  host: 'localhost',
  port: 8080,
} satisfies Config;
// 'config.host' is typed as literal 'localhost', not string
```

### Template Literal Types
Use template literals for string patterns instead of generic strings.

```typescript
type EventName = `on${Capitalize<string>}`;
const handle: EventName = "onClick"; // ✅
const bad: EventName = "click";      // ❌ Error
```

### Discriminated Unions
Use discriminated unions for handling different states or polymorphic data. This is the gold standard for state management (e.g., Redux, API states).

```typescript
type State = 
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };

function render(state: State) {
  if (state.status === 'success') {
    // strict safe access to state.data
    console.log(state.data);
  }
}
```

## 4. Code Organization & Style

### Naming Conventions
- **Types/Interfaces**: PascalCase (e.g., `UserResponse`). Do not prefix with `I` (e.g., `IUser` is outdated).
- **Variables/Functions**: camelCase.
- **Booleans**: Prefix with `is`, `has`, `should` (e.g., `isValid`, `hasAccess`).

### Module Imports
- Prefer named exports over default exports for better refactoring support and tree-shaking.
- Use explicit type imports to clarify intent and help bundlers.

```typescript
import type { User } from './types';
import { getUser } from './api';
```

### Async/Await & Error Handling
- Always use `async`/`await` over raw `.then()`.
- Use custom Error classes or result types for predictable failure modes.

```typescript
try {
  const data = await fetchData();
} catch (error: unknown) {
  if (error instanceof ApiError) {
    // handle specific error
  }
}
```
