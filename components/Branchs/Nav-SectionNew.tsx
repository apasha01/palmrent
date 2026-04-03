import React from "react";
import NavSectionSearchClient from "./Nav-SectionNew.search-client";

type NavSectionProps = {
  image?: string;
  title?: React.ReactNode;
  subtitle1?: React.ReactNode;
  subtitle2?: React.ReactNode;
};

const NavSection = ({ title, subtitle1, subtitle2 }: NavSectionProps) => {
  return (
    <section className="w-full" aria-labelledby="home-hero-title">

      {/* ── MOBILE layout: flex column, height is dynamic ── */}
      <div className="flex flex-col md:hidden px-4 pt-6 pb-4 gap-3">
        <div className="flex flex-col gap-2 text-center">
          <h1
            id="home-hero-title"
            className="text-md font-bold"
          >
            {title}
          </h1>

          <p className="text-muted-foreground font-light text-sm">
            {subtitle1}
          </p>

          {subtitle2 ? (
            <p className="text-muted-foreground text-sm">{subtitle2}</p>
          ) : null}
        </div>

        {/* Search form rendered inline in flow — no absolute positioning */}
        <NavSectionSearchClient mobileInline />
      </div>

      {/* ── DESKTOP layout: text top-aligned, search bar floats half-outside bottom ── */}
      <div className="relative hidden md:block w-full bg-[#12416b] pb-14">
        <div className="flex flex-col items-center gap-2 pt-6 pb-2 px-4 text-center">
          <h1
            id="home-hero-title"
            className="text-2xl text-white font-bold"
          >
            {title}
          </h1>

          <p className="text-white font-light text-sm">{subtitle1}</p>

          {subtitle2 ? (
            <p className="text-white text-sm">{subtitle2}</p>
          ) : null}
        </div>

        <NavSectionSearchClient />
      </div>

      <div className="hidden md:block h-8" />
    </section>
  );
};

export default NavSection;
