import React from 'react';

// ✅ This file has ZERO accessibility issues — used to verify no false positives

export function AccessibleComponent() {
  return (
    <main>
      <h1>Welcome</h1>
      <h2>About Us</h2>
      <h3>Our Team</h3>

      <img src="/team.jpg" alt="Our team photo at the annual retreat" />
      <img src="/divider.svg" alt="" /> {/* decorative */}

      <nav aria-label="Main navigation">
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact Us</a>
      </nav>

      <button onClick={() => setOpen(true)} aria-label="Open menu">
        <svg viewBox="0 0 24 24"><path d="M3 12h18" /></svg>
      </button>

      <button onClick={() => submit()}>
        Submit Form
      </button>

      <form>
        <label htmlFor="name">Full Name</label>
        <input id="name" type="text" placeholder="John Doe" aria-label="Full name" />

        <input type="email" aria-label="Email address" placeholder="email@example.com" />

        <select aria-label="Country">
          <option>United States</option>
          <option>Canada</option>
        </select>

        <input type="hidden" name="csrf" value="abc123" />
        <input type="submit" value="Submit" />
      </form>

      <a href="https://twitter.com" aria-label="Follow us on Twitter">
        <img src="/twitter.svg" alt="Twitter icon" />
      </a>
    </main>
  );
}
