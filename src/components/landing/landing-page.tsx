"use client";

import { Header } from "./header";
import { Footer } from "./footer";
import { HomePage } from "./home-page";

import "./header.css";
import "./footer.css";
import "./home-page.css";
import "./landing-layout.css";
import "./responsive-fixes.css";

export default function LandingPage() {
  return (
    <div className="landing-layout">
      <Header />
      <main>
        <HomePage />
      </main>
      <Footer />
    </div>
  );
}
