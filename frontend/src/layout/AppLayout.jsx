import Header from "./Header";
import Footer from "./Footer";

export default function AppLayout({
  headerTitle,
  headerSubtitle,
  headerRight,
  children,
}) {
  return (
    <div className="container">
      <Header
        title={headerTitle}
        subtitle={headerSubtitle}
        right={headerRight}
      />

      <main style={{ marginTop: 14 }}>{children}</main>

      <Footer />
    </div>
  );
}
