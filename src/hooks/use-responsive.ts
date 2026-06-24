"use client";

import { useEffect, useState } from "react";

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  laptop: 1280,
  desktop: 1536,
} as const;

export function useResponsive() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = width < BREAKPOINTS.mobile;
  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
  const isLaptop = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.laptop;
  const isDesktop = width >= BREAKPOINTS.laptop;
  const isLargeDesktop = width >= BREAKPOINTS.desktop;
  const isWebLayout = width >= BREAKPOINTS.tablet;

  return {
    width,
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,
    isLargeDesktop,
    isWebLayout,
    responsivePadding: isDesktop ? 32 : isTablet ? 24 : 16,
    responsiveHorizontalPadding: isDesktop ? 40 : isTablet ? 24 : 16,
    responsiveTitle: isDesktop ? 28 : isTablet ? 24 : 20,
    responsiveSubtitle: isDesktop ? 18 : isTablet ? 16 : 14,
    responsiveBody: isDesktop ? 16 : isTablet ? 14 : 14,
    responsiveSpacing: isDesktop ? 32 : isTablet ? 24 : 16,
    responsiveSmallSpacing: isDesktop ? 16 : isTablet ? 12 : 8,
    maxContentWidth: isLargeDesktop ? 1600 : isDesktop ? 1400 : isTablet ? 960 : Infinity,
    gridColumns: isLargeDesktop ? 4 : isDesktop ? 4 : isTablet ? 3 : 2,
  };
}
