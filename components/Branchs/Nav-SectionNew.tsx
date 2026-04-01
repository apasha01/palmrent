import React from "react";
import NavSectionSearchClient from "./Nav-SectionNew.search-client";


type NavSectionProps = {
  image?: string;
  title?: React.ReactNode;
  subtitle1?: React.ReactNode;
  subtitle2?: React.ReactNode;
};

const NavSection = ({ title, subtitle1, subtitle2 }: NavSectionProps) => {
  const hasSubtitle2 = Boolean(subtitle2);
  const headerTopClass = hasSubtitle2 ? "top-4 md:top-5" : "top-8 md:top-10";

  return (
    <section className="w-full" aria-labelledby="home-hero-title">
      <div className="relative w-full h-72 md:h-40">
        <div className="absolute inset-0 flex items-start justify-center pt-10 md:bg-[#12416b] md:pt-0 md:items-center">
          <div
            className={[
              "w-full max-w-6xl absolute px-2 md:px-4 text-center z-10",
              headerTopClass,
            ].join(" ")}
          >
            <div className="flex flex-col gap-2">
              <h1
                id="home-hero-title"
                className="text-md md:text-2xl md:text-white font-bold"
              >
                {title}
              </h1>

              <p className="text-muted-foreground md:text-white font-light text-sm">
                {subtitle1}
              </p>

              {subtitle2 ? (
                <p className="text-muted-foreground md:text-white text-sm">
                  {subtitle2}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <NavSectionSearchClient />
      </div>

      <div className="hidden md:block h-20" />
    </section>
  );
};

export default NavSection;