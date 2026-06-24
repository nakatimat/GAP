"use client";

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1E3A8A",
      light: "#3B82F6",
      dark: "#172D6E",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#8B5CF6",
      light: "#A78BFA",
      dark: "#6D28D9",
      contrastText: "#FFFFFF",
    },
    background: { default: "#F1F5F9", paper: "#FFFFFF" },
    text: { primary: "#374151", secondary: "#6B7280" },
    divider: "#E8EDF2",
    success: { main: "#10B981", light: "#34D399", dark: "#047857" },
    error: { main: "#EF4444", light: "#F87171", dark: "#B91C1C" },
    warning: { main: "#F59E0B", light: "#FBBF24", dark: "#B45309" },
    info: { main: "#0EA5E9", light: "#38BDF8", dark: "#0369A1" },
  },
  typography: {
    fontFamily: [
      "Inter",
      "Geist",
      "Roboto",
      "Helvetica",
      "Arial",
      "sans-serif",
    ].join(","),
    h1: { fontSize: "2rem",      fontWeight: 400, letterSpacing: "-0.02em" },
    h2: { fontSize: "1.75rem",   fontWeight: 400, letterSpacing: "-0.01em" },
    h3: { fontSize: "1.5rem",    fontWeight: 400, letterSpacing: "-0.01em" },
    h4: { fontSize: "1.25rem",   fontWeight: 400 },
    h5: { fontSize: "1.125rem",  fontWeight: 400 },
    h6: { fontSize: "1rem",      fontWeight: 400 },
    subtitle1: { fontSize: "0.9375rem", fontWeight: 400 },
    subtitle2: { fontSize: "0.875rem",  fontWeight: 400 },
    body1:     { fontSize: "0.875rem",  fontWeight: 400 },
    body2:     { fontSize: "0.8125rem", fontWeight: 400 },
    button:    { fontSize: "0.8125rem", textTransform: "none" as const, fontWeight: 400 },
    caption:   { fontSize: "0.6875rem" },
    overline:  { fontSize: "0.6875rem" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          fontWeight: 600,
          padding: "8px 20px",
          transition: "all 0.2s ease-in-out",
          "&.MuiButton-containedPrimary": {
            boxShadow: "0 4px 14px 0 rgba(30, 58, 138, 0.35)",
            "&:hover": {
              boxShadow: "0 6px 20px rgba(30, 58, 138, 0.22)",
            },
          },
          "&.MuiButton-outlined": {
            borderWidth: "1.5px",
            "&:hover": {
              borderWidth: "1.5px",
              backgroundColor: "rgba(30, 58, 138, 0.04)",
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(0, 0, 0, 0.06)",
        },
        rounded: { borderRadius: 16 },
        elevation1: {
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "0px 2px 12px rgba(15, 23, 42, 0.04)",
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.06)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "#FFFFFF",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#CBD5E1",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#94A3B8",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: "2px",
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: () => ({
        body: {
          backgroundColor: "#F1F5F9",
          color: "#0F172A",
        },
        "::-webkit-scrollbar": { width: "8px", height: "8px" },
        "::-webkit-scrollbar-track": { backgroundColor: "transparent" },
        "::-webkit-scrollbar-thumb": {
          backgroundColor: "#CBD5E1",
          borderRadius: 8,
        },
        "::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "#94A3B8",
        },
      }),
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          border: "1px solid rgba(0,0,0,0.06)",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#1E293B",
          color: "#FFFFFF",
          fontSize: "0.75rem",
          fontWeight: 600,
          borderRadius: 6,
          padding: "6px 12px",
        },
        arrow: {
          color: "#1E293B",
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: "none",
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #E2E8F0",
          },
          "& .MuiDataGrid-columnHeaders": {
            borderBottom: "none",
            backgroundColor: "#F8FAFC",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 600,
            textTransform: "uppercase",
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
            color: "#64748B",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#F1F5F9",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid #E2E8F0",
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          },
        },
      },
    },
  },
});

export const getTheme = () => theme;
