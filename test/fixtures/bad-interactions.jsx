import React, { useState } from 'react';

// ❌ Test fixture for new a11y rules (aria, keyboard, interaction, landmarks)

export function InteractiveDashboard() {
  const [tooltip, setTooltip] = useState(false);

  return (
    <div>
      <h1>Dashboard</h1>

      {/* ❌ aria-valid: invalid ARIA role */}
      <div role="hamburger">Menu</div>

      {/* ❌ aria-valid: role="presentation" on interactive element */}
      <button role="presentation" onClick={() => {}}>Submit</button>

      {/* ❌ aria-valid: invalid aria-* attribute */}
      <div aria-expanded="true" aria-foo="bar">Dropdown</div>

      {/* ❌ aria-hidden-focus: focusable element with aria-hidden */}
      <button aria-hidden="true" onClick={() => {}}>Hidden Button</button>

      {/* ❌ aria-hidden-focus: link with aria-hidden */}
      <a href="/secret" aria-hidden="true">Secret Link</a>

      {/* ❌ keyboard-handlers: onClick without onKeyDown */}
      <div onClick={() => alert('clicked')} role="button" tabIndex={0}>
        Click Me
      </div>

      {/* ❌ hover-only: onMouseEnter without onFocus */}
      <div
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
      >
        Hover for tooltip
      </div>

      {/* ❌ hover-only: onMouseOver without focus equivalent */}
      <span onMouseOver={() => highlight()} className="highlight-target">
        Hover to highlight
      </span>

      {/* ❌ disabled-state: disabled without explanation */}
      <button disabled onClick={() => {}}>Submit</button>

      {/* ❌ disabled-state: disabled input without explanation */}
      <input type="text" disabled value="locked" />

      {/* ❌ tabindex-positive: positive tabindex */}
      <div tabIndex={5}>First focus</div>

      {/* ❌ tabindex-positive: another positive tabindex */}
      <input type="text" tabIndex={2} placeholder="Second focus" />

      {/* ✅ OK: disabled with title */}
      <button disabled title="Complete all fields first">Submit</button>

      {/* ✅ OK: hover with focus equivalent */}
      <div
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        onFocus={() => setTooltip(true)}
        onBlur={() => setTooltip(false)}
      >
        Accessible tooltip
      </div>

      {/* ✅ OK: tabindex=0 is fine */}
      <div tabIndex={0} role="button" onClick={() => {}} onKeyDown={() => {}}>
        OK Button
      </div>

      {/* ✅ OK: native button with onClick (no keyboard handler needed) */}
      <button onClick={() => doSomething()}>Native Button</button>
    </div>
  );
}
