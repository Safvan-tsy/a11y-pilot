import React from 'react';

// ❌ Multiple accessibility violations for testing

export function HeroSection() {
  return (
    <section>
      <h1>Welcome to Our Site</h1>

      {/* ❌ img-alt: missing alt attribute */}
      <img src="/hero-banner.jpg" width={1200} height={400} />

      {/* ❌ img-alt: another missing alt */}
      <img src="/logo.png" className="logo" />

      <h3>Featured Products</h3>
      {/* ❌ heading-order: jumped from h1 to h3 */}

      {/* ❌ no-div-button: div with onClick */}
      <div onClick={() => alert('clicked')} className="card">
        <img src="/product1.jpg" />
        <span>Cool Product</span>
      </div>

      {/* ❌ no-div-button: span with onClick */}
      <span onClick={() => navigate('/about')} className="link">
        Learn More
      </span>

      {/* ❌ button-content: empty button */}
      <button onClick={() => setOpen(true)}>
      </button>

      {/* ❌ anchor-content: empty link */}
      <a href="/profile">
      </a>

      {/* ❌ no-autofocus: autofocus on input */}
      <input type="text" autoFocus placeholder="Search..." />

      {/* ❌ form-label: input without label */}
      <input type="email" placeholder="Enter your email" />

      {/* ❌ form-label: select without label */}
      <select>
        <option>Option 1</option>
        <option>Option 2</option>
      </select>
    </section>
  );
}
