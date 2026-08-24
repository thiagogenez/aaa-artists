"use client";

import ThirdPartyConsent from "@/components/ThirdPartyConsent";

type ThirdPartyEmbedProps = {
  provider: string;
  src: string;
  title: string;
  allow: string;
  className: string;
  allowFullScreen?: boolean;
};

/** A consented third-party player.
 *
 *  The loading skeleton is not here — it lives in ThirdPartyConsent, which is the
 *  gate Spotify's own player passes through as well. */
export default function ThirdPartyEmbed({
  provider,
  src,
  title,
  allow,
  className,
  allowFullScreen,
}: ThirdPartyEmbedProps) {
  return (
    <ThirdPartyConsent provider={provider} className={className}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        referrerPolicy="no-referrer"
        allow={allow}
        allowFullScreen={allowFullScreen}
        className={`block h-full w-full ${className}`}
        style={{ border: 0 }}
      />
    </ThirdPartyConsent>
  );
}
