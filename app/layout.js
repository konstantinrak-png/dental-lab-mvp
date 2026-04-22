import "./globals.css";

export const metadata = {
  title: "Зуботехнічна лабораторія",
  description: "Просте керування замовленнями для зуботехнічної лабораторії"
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
