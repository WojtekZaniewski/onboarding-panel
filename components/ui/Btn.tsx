import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type BtnVariant = "primary" | "ghost";

type CommonProps = {
  variant?: BtnVariant;
  small?: boolean;
  children: ReactNode;
  className?: string;
};

type LinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> & {
    href: string;
  };

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: undefined;
  };

function buildClass(variant: BtnVariant, small: boolean | undefined, extra?: string) {
  return [
    "btn",
    variant === "primary" ? "btn--primary" : "btn--ghost",
    small ? "btn--small" : "",
    extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function Btn(props: LinkProps | ButtonProps) {
  const { variant = "primary", small, className, children, ...rest } = props;
  const klass = buildClass(variant, small, className);

  if ("href" in props && props.href) {
    const { href, ...anchorRest } = rest as LinkProps;
    const isExternal = href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:");
    if (isExternal) {
      return (
        <a className={klass} href={href} {...anchorRest}>
          {children}
        </a>
      );
    }
    return (
      <Link className={klass} href={href} {...(anchorRest as object)}>
        {children}
      </Link>
    );
  }

  return (
    <button className={klass} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
