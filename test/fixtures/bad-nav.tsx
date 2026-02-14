import React from 'react';

// ❌ Navigation without semantic <nav> + various issues

export function Header() {
  return (
    <header>
      <div className="nav-links">
        {/* ❌ semantic-nav: links not in <nav> */}
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/products">Products</a>
        <a href="/contact">Contact</a>
      </div>

      {/* ❌ button-content: icon button without label */}
      <button className="menu-toggle">
        <svg viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
      </button>

      {/* ❌ form-label: search input without label */}
      <input type="search" placeholder="Search..." />

      {/* ❌ no-div-button: clickable div */}
      <div
        onClick={() => toggleTheme()}
        className="theme-toggle"
      >
        🌙
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer>
      <h2>Quick Links</h2>

      {/* ❌ heading-order: skips from h2 to h4 */}
      <h4>Social Media</h4>

      {/* ❌ anchor-content: icon links without labels */}
      <a href="https://twitter.com">
        <img src="/twitter-icon.svg" />
      </a>
      <a href="https://github.com">
        <img src="/github-icon.svg" />
      </a>
    </footer>
  );
}
