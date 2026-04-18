import "./globals.css";

export const metadata = {
  title: "SplitSmart — AI Expense Splitter",
  description: "Effortlessly split group expenses with AI-powered categorization and spending insights.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
