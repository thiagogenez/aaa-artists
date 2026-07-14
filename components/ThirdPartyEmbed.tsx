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
        className={`block w-full ${className}`}
        style={{ border: 0 }}
      />
    </ThirdPartyConsent>
  );
}
