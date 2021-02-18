import Link from "next/link";
import React from "react";
import { Mixpanel } from "../../../mixpanel/index";

interface Props {
  href: string;
  as?: string;
  children: React.ReactNode;
}

export default ({ href, as, children }: Props) => {
  const clicked = () =>
    Mixpanel.track("Click Link", { href: href, as: as ? as : "" });
  return (
    <div onClick={clicked}>
      <Link href={href} as={as}>
        {children}
      </Link>
    </div>
  );
};
