"use client";

import { useState } from "react";
import Logo from "./Logo";

type Props = {
  size?: number;
  showWordmark?: boolean;
  animated?: boolean;
};

/**
 * If /public/logo.png exists we display the user's PNG; otherwise we fall back
 * to the SVG vector logo. Either way it gets the float + entrance animation
 * when `animated` is on.
 */
export default function HeaderLogo({
  size = 96,
  showWordmark = true,
  animated = true,
}: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  const motion = animated ? "animate-logo-entrance" : "";
  const float = animated ? "animate-logo-float" : "";
  const glow = animated ? "animate-logo-glow" : "";

  if (imgFailed) {
    return (
      <div className={`${motion}`}>
        <div className={`${float} ${glow}`}>
          <Logo size={size} showWordmark={showWordmark} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${motion}`}>
      <div className={`${float} ${glow}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/elellaan.jpg"
          alt="Elellaan"
          width={size}
          height={size}
          style={{ width: size, height: size }}
          className="object-contain"
          onError={() => setImgFailed(true)}
        />
      </div>
    </div>
  );
}
