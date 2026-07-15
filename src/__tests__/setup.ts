import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock Next.js Image
vi.mock("next/image", () => ({
  default: ({ alt, ...props }: any) =>
    React.createElement("img", { alt, ...props }),
}));

// Mock Framer Motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) =>
      React.createElement("div", { ...props }, children),
    button: ({ children, ...props }: any) =>
      React.createElement("button", { ...props }, children),
    header: ({ children, ...props }: any) =>
      React.createElement("header", { ...props }, children),
    h2: ({ children, ...props }: any) =>
      React.createElement("h2", { ...props }, children),
    p: ({ children, ...props }: any) =>
      React.createElement("p", { ...props }, children),
    span: ({ children, ...props }: any) =>
      React.createElement("span", { ...props }, children),
  },
  AnimatePresence: ({ children }: any) =>
    React.createElement(React.Fragment, {}, children),
}));

// Mock CSS custom properties
Object.defineProperty(window, "getComputedStyle", {
  value: () => ({
    getPropertyValue: (prop: string) => {
      const cssVars: Record<string, string> = {
        "--text": "#000000",
        "--primary": "#007bff",
        "--surface": "#ffffff",
        "--surface2": "#f8f9fa",
        "--border": "#dee2e6",
        "--muted": "#6c757d",
        "--muted2": "#adb5bd",
        "--bg": "#ffffff",
        "--sidebar": "#f8f9fa",
      };
      return cssVars[prop] || "";
    },
  }),
});

// Mock window.open
Object.defineProperty(window, "open", {
  value: vi.fn(),
});

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost:3000",
    assign: vi.fn(),
    replace: vi.fn(),
  },
  writable: true,
});

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
