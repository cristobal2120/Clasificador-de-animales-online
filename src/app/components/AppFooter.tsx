interface AppFooterProps {
  variant?: "default" | "minimal";
}

export function AppFooter({ variant = "default" }: AppFooterProps) {
  if (variant === "minimal") {
    return (
      <footer
        className="py-2 px-6 text-center text-[10px] shrink-0 opacity-50"
        style={{ color: "var(--app-text-muted)" }}
      >
        Proyecto académico · Firebase · Vercel
      </footer>
    );
  }

  return (
    <footer
      className="py-4 px-6 text-center text-xs shrink-0"
      style={{ color: "var(--app-text-muted)", borderTop: "1px solid var(--layout-divider)" }}
    >
      Clasificador de animales · Proyecto académico · Firebase · Vercel
    </footer>
  );
}
