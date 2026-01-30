import Link from "next/link";
import { Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border py-8 mt-auto">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <div className="text-center sm:text-left">
            <p className="font-medium text-foreground">Baseline</p>
            <p>Measure your cognitive abilities.</p>
          </div>

          <div className="flex items-center gap-4">
            <span>Made by Adriel V.</span>
            <Link
              href="https://www.linkedin.com/in/adriel-vijuan/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              <Linkedin className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
