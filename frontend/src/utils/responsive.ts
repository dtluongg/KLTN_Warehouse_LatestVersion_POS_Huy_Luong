import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export const BREAKPOINTS = {
    mobile: 0,
    tablet: 768,
    desktop: 1200,
} as const;

export type BreakpointName = "mobile" | "tablet" | "desktop";

export const getBreakpoint = (width: number): BreakpointName => {
    if (width >= BREAKPOINTS.desktop) return "desktop";
    if (width >= BREAKPOINTS.tablet) return "tablet";
    return "mobile";
};

export const getGridColumns = (width: number): number => {
    if (width >= BREAKPOINTS.desktop) return 4;
    if (width >= BREAKPOINTS.tablet) return 3;
    return 2;
};

export const useResponsive = () => {
    const { width, height } = useWindowDimensions();

    return useMemo(() => {
        const breakpoint = getBreakpoint(width);

        return {
            width,
            height,
            breakpoint,
            isMobile: breakpoint === "mobile",
            isTablet: breakpoint === "tablet",
            isDesktop: breakpoint === "desktop",
            columns: getGridColumns(width),
        };
    }, [width, height]);
};
