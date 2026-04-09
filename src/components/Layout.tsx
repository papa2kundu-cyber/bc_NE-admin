"use client";

import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { usePathname, useRouter } from "next/navigation";

const Layout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex flex-col">
      {pathname !== "/rate" && <Navbar />}
      <main className="flex-1 pt-16 md:pt-20">{children}</main>
      {pathname !== "/rate" && <Footer />}
    </div>
  );
};

export default Layout;
