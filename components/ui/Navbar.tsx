import Link from "next/link";

export type NavLink = { href: string; label: string };

export function Navbar({
  links,
  activeHref,
  userName,
  userInitials,
}: {
  links: NavLink[];
  activeHref?: string;
  userName?: string;
  userInitials?: string;
}) {
  return (
    <nav className="navbar">
      <Link href="/panel" className="navbar__brand">
        <span className="navbar__brand-mark">BR</span>
        <span className="navbar__brand-text">BeautyRise</span>
      </Link>
      <div className="navbar__links">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={
              "navbar__link" + (activeHref === l.href ? " navbar__link--active" : "")
            }
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="navbar__user">
        {userName && <span className="navbar__user-name">{userName}</span>}
        <button className="navbar__user-avatar" aria-label="Konto">
          {userInitials ?? "?"}
        </button>
      </div>
    </nav>
  );
}
