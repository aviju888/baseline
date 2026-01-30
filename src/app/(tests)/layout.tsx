import { Header } from "@/components/layout/Header";

// TODO: Test layout improvements
// - Add breadcrumb navigation (Home > Category > Test Name)
// - Add page transition animations between tests
// - Add dynamic metadata per test page (og:title, og:description for link previews)
// - Add "back to category" link

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {children}
      </main>
    </>
  );
}
