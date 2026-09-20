# LeadLoop Compliance & Risk Protection

## Privacy

- **Today: signups are localStorage-only.** Email gates store name/email in the
  visitor's own browser (`localStorage`); nothing is sent to any server. This
  must stay clearly communicated — never claim a signup "subscribed" the user
  to anything or that data reached a mailing list.
- **Before real email capture ships:** publish a privacy policy page
  (what is collected, why, how long it is kept, how to delete it), add explicit
  consent at the point of capture, set retention limits, and sign a DPA with
  the email provider.
- Cookie/analytics consent must land at the same time as any analytics script.

## Content honesty

- Never invent testimonials, placement statistics, salaries, pricing, scarcity,
  demand, guarantees, or specific real committee experiences.
- **Anything published in Aashith's name** — email, social post, public message,
  testimonial-style statement, or committee anecdote — requires his
  exact-content approval first.
- The Committee Debrief Log page (F8) stays marked **draft** until Aashith
  approves its exact copy.
- Coaching claims on the site must match what was explicitly approved (works at
  Google; 50+ hiring/promotion committees including senior and senior-staff
  decisions; agentic enterprise AI work on Google Chat). Never imply Google,
  Meta, Netflix, or any employer endorses LeadLoop.

## Brand

- First-name-only vs full-name branding is still undecided; do not hard-code
  new full-name surfaces until Aashith decides. Current site uses "Aashith
  Kamath".

## Accessibility commitments

- Every page: keyboard-operable controls, visible focus states, usable layout
  at 390px width, alt text on images, labels on inputs.
- CI checks what is automatable (labels, alt text, focus CSS presence); manual
  persona validation covers the rest.

## Payments & app (future)

- Booking/payments plan is Cal.com free plan + Stripe: PCI is handled by
  Stripe; tax forms and payouts are Aashith's. No card data ever touches our
  pages.
- When the Android app ships, complete the Play **data-safety** form honestly
  (the site collects nothing server-side today; the wrapper inherits that).

## Risk register

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Email gates imply server-side subscription that doesn't exist | Medium | Medium | Disclose localStorage-only status; privacy policy + real capture before any "subscribe" claim | Aashith |
| Invented testimonial/statistic published | Low | High | Content-honesty rule in test strategy; exact-content approval gate for anything in Aashith's name | Aashith |
| F8 committee page leaks confidential Google info or invents anecdotes | Low | High | Draft-only until Aashith approves exact copy; generic educational patterns only | Aashith |
| Implied Google/Meta/Netflix endorsement | Low | High | Never use employer logos or "endorsed by" language; review all brand copy | Aashith |
| Third-party script introduced without review | Low | Medium | CI external-script allowlist (currently empty) fails the build on any addition | CI + reviewer |
| Secret/keystore password committed | Low | High | CI secret scan; passwords never stored in repo/files/memory | CI |
| Accessibility regression (unusable at 390px, keyboard traps) | Medium | Medium | Per-feature persona validation includes mobile + keyboard checks | Feature pipeline |
| Play data-safety misdeclaration | Low | Medium | Declare accurately at ship time; no server-side collection today | Aashith |
| Search Console / indexing issues after pushes | Medium | Low | Post-deploy smoke + sitemap validity checks in CI; manual URL Inspection when needed | Aashith |
