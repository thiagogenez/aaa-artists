export const PRIMARY_NAV_LINKS = Object.freeze([
  { href: "/", label: "Home" },
  { href: "/artists", label: "Artists" },
  { href: "/about", label: "About" },
]);

export const FOOTER_NAV_LINKS = Object.freeze([
  ...PRIMARY_NAV_LINKS,
  { href: "/contact", label: "Book Artists" },
  { href: "/privacy", label: "Privacy" },
]);
