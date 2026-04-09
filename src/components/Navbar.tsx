"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
const logo = "/images/logo.png";

const navItems = [
  { label: "Home", path: "/" },
  { label: "About Us", path: "/about" },
  { label: "Our Works", path: "/works" },
  { label: "Interior", path: "/interior" },
  { label: "Video Gallery", path: "/video-gallery" },
  { label: "Blog", path: "/blog" },
  // { label: "Our Team", path: "/teams" },
  { label: "FAQ", path: "/faq" },
  { label: "Contact Us", path: "/contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container-narrow flex items-center justify-between h-16 md:h-20 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-heading text-xl md:text-2xl font-bold tracking-tight">
          {/* <span className="text-primary">LUXE</span>
          <span className="text-foreground">INTERIOR</span> */}
          <Image src={logo} alt="Brightocity Interior Logo" width={150} height={40} className="object-contain" />
        </Link>

        {/* Desktop Nav */}
        <div className="relative hidden lg:flex items-center gap-1">
          {/* <Link
            href="/admin"
            className="px-3 py-2 text-xs font-medium text-muted-foreground/60 hover:text-primary transition-colors rounded-md"
            title="Admin Panel"
          >
            Admin
          </Link> */}
          {navItems.map((item) => (
            item.label === "Contact Us" ? (
              <Link
                key={item.path}
                href={item.path}
                className="ml-2 px-4 py-2 text-sm font-medium transition-colors rounded-md bg-primary text-white hover:bg-primary/90 relative z-10"
              >
                {item.label}
              </Link>
            ) :

              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 text-sm font-medium transition-colors rounded-md ${pathname === item.path
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {item.label}
              </Link>
          ))}
          <div className="absolute -bottom-1 right-1 rounded-lg w-[calc(100%_-_85.5%)] h-4 bg-black/30"></div>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 text-foreground"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1 relative">
              {navItems.map((item, idx) => (
                item.label === "Contact Us" ? <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-white bg-primary relative z-10`}
                >
                  {item.label}
                </Link> : <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${pathname === item.path
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="absolute bottom-3 left-0 flex justify-center w-full">
                <div className="rounded-lg w-[calc(100%_-_40px)] h-4 bg-black/30"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
