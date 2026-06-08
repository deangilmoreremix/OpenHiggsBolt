---
name: condition-based-waiting
description: Replace arbitrary timeouts with condition polling for async operations
---

When code waits for async operations, replace `setTimeout` or fixed delays with condition polling:

```
// Bad — arbitrary wait
await new Promise(r => setTimeout(r, 5000));

// Good — condition polling
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);
  const poll = setInterval(() => {
    if (conditionMet()) {
      clearInterval(poll);
      clearTimeout(timeout);
      resolve();
    }
  }, 100);
});
```

Best practices:
- Always have a timeout to prevent infinite loops
- Poll frequently enough to be responsive, not so fast as to overwhelm
- Check deterministic conditions (state flags, DOM elements, API responses)
- Consider exponential backoff for retried operations