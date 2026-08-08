Minimal pill-shaped button, no border, subtle hover darken. Used for every primary CTA (Book now, Send request, Confirm booking).

```jsx
<Button variant="primary" size="md" icon={<ArrowIcon/>}>Book now</Button>
<Button variant="outline">Save for later</Button>
```

Variants: `primary` (pink fill `#FF2E8A`), `secondary` (orange fill `#FF6A00`), `outline` (white, thin subtle border), `ghost` (no border, for tertiary actions). Sizes: `sm` `md` `lg`. Matches `tokens/colors.css` + `Button.jsx`.
