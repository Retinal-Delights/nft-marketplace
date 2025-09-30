import { extendTheme, ThemeConfig } from "@chakra-ui/react";

export const chakraThemeConfig: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

export const chakraTheme = extendTheme({
  config: chakraThemeConfig,
  
  // Typography
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
  
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  fontSizes: {
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px - Small
    md: "1rem",       // 16px - Body
    lg: "1.125rem",   // 18px
    xl: "1.25rem",    // 20px
    "2xl": "1.5rem",  // 24px - Heading 2
    "3xl": "2rem",    // 32px - Heading 1
    "4xl": "3rem",    // 48px - Display
  },
  
  lineHeights: {
    base: 1.6,        // Body text
    tall: 1.4,        // Headings
  },
  
  // Color System
  colors: {
    brand: {
      primary: "#0F0F0F",      // near-black background
      secondary: "#1A1A1A",    // panels, cards
      accent: "#E63946",       // actions like Buy/Bid
      highlight: "#457B9D",    // links, selected states
    },
    text: {
      primary: "#FFFFFF",      // high contrast
      secondary: "#B0B0B0",    // secondary text
      muted: "#6E6E6E",        // muted/disabled
    },
    feedback: {
      success: "#06D6A0",
      warning: "#FFD166", 
      error: "#EF476F",
    },
    gray: {
      50: "#F7F7F7",
      100: "#E1E1E1",
      200: "#CFCFCF",
      300: "#B0B0B0",  // secondary text
      400: "#9E9E9E",
      500: "#6E6E6E",  // muted/disabled
      600: "#4F4F4F",
      700: "#3D3D3D",
      800: "#2C2C2C",  // input borders
      900: "#1A1A1A",  // secondary background
      950: "#0F0F0F",  // primary background
    },
  },
  
  // Spacing Scale (multiples of 4px)
  space: {
    xs: "0.25rem",    // 4px
    sm: "0.5rem",     // 8px
    md: "0.75rem",    // 12px
    lg: "1rem",       // 16px
    xl: "1.5rem",     // 24px
    "2xl": "2rem",    // 32px
    "3xl": "3rem",    // 48px
  },
  
  // Radius Scale
  radii: {
    none: "0",
    sm: "0.125rem",   // 2px - buttons, inputs
    md: "0.25rem",    // 4px - cards
    lg: "0.375rem",   // 6px - modals
    xl: "0.5rem",     // 8px
  },
  
  // Shadows
  shadows: {
    card: "0px 1px 3px rgba(0,0,0,0.2)",
    modal: "0px 2px 8px rgba(0,0,0,0.4)",
  },
  
  // Component Styles
  components: {
    Button: {
      baseStyle: {
        fontWeight: "medium",
        borderRadius: "sm",
        transition: "all 150ms ease-in-out",
        _hover: {
          transform: "scale(1.02)",
        },
      },
      variants: {
        primary: {
          bg: "brand.accent",
          color: "white",
          _hover: {
            bg: "brand.accent",
            filter: "brightness(1.05)",
          },
          _active: {
            bg: "brand.accent",
            filter: "brightness(0.95)",
          },
        },
        secondary: {
          bg: "transparent",
          color: "white",
          border: "1px solid",
          borderColor: "gray.800",
          _hover: {
            borderColor: "brand.highlight",
            bg: "gray.900",
          },
        },
      },
      defaultProps: {
        variant: "primary",
      },
    },
    
    Card: {
      baseStyle: {
        container: {
          bg: "brand.secondary",
          borderRadius: "md",
          border: "1px solid",
          borderColor: "gray.800",
          transition: "all 150ms ease-in-out",
          _hover: {
            transform: "scale(1.02)",
            shadow: "card",
          },
        },
      },
    },
    
    Input: {
      baseStyle: {
        field: {
          border: "1px solid",
          borderColor: "gray.800",
          borderRadius: "sm",
          bg: "brand.secondary",
          color: "text.primary",
          _focus: {
            borderColor: "brand.accent",
            boxShadow: "0 0 0 1px var(--chakra-colors-brand-accent)",
          },
          _placeholder: {
            color: "text.muted",
          },
        },
      },
    },
    
    Link: {
      baseStyle: {
        color: "brand.highlight",
        textDecoration: "underline",
        _hover: {
          textDecoration: "none",
        },
      },
    },
    
    Heading: {
      baseStyle: {
        fontWeight: "semibold",
        lineHeight: "tall",
        color: "text.primary",
      },
    },
    
    Text: {
      baseStyle: {
        color: "text.primary",
        lineHeight: "base",
      },
    },
  },
  
  // Global Styles
  styles: {
    global: {
      body: {
        bg: "brand.primary",
        color: "text.primary",
        fontFamily: "Inter, sans-serif",
      },
    },
  },
});
