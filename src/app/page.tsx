"use client";

import Link from "next/link";
import {
  Image as ImageIcon,
  Video,
  FileText,
  Users,
  HelpCircle,
  Star,
  Mail,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

const stats = [
  { label: "Photos", value: "12", icon: ImageIcon, path: "/photos", color: "bg-orange-50 text-orange-600/40 border-orange-200" },
  { label: "Videos", value: "6", icon: Video, path: "/videos", color: "bg-blue-50 text-blue-600/40 border-blue-200" },
  { label: "Blog Blocks", value: "8", icon: FileText, path: "/blocks", color: "bg-purple-50 text-purple-600/40 border-purple-200" },
  { label: "Team Members", value: "5", icon: Users, path: "/teams", color: "bg-green-50 text-green-600/40 border-green-200" },
  { label: "FAQs", value: "10", icon: HelpCircle, path: "/faqs", color: "bg-[#00000000] text-yellow-600/40 border-yellow-200" },
  { label: "Reviews", value: "24", icon: Star, path: "/reviews", color: "bg-pink-50 text-pink-600/40 border-pink-200" },
  { label: "Contacts", value: "3", icon: Mail, path: "/contacts", color: "bg-teal-50 text-teal-600/40 border-teal-200" },
];

const quickLinks = [
  { label: "Add New Photo", path: "/photos", icon: ImageIcon },
  { label: "Add New Video", path: "/videos", icon: Video },
  { label: "Add New Block", path: "/blocks", icon: FileText },
  { label: "Add Team Member", path: "/teams", icon: Users },
  { label: "Add FAQ", path: "/faqs", icon: HelpCircle },
  { label: "Add Review", path: "/reviews", icon: Star },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Welcome back! Manage your Brightocity Interior content below.</p>
      </div>

      {/* Stats Grid */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          Content Overview
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.path}
                className="overflow-hidden relative group bg-background border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className={`absolute top-[50%] -right-8 group-hover:top-[20%] group-hover:right-1 duration-300 mb-3 bg-transparent ${stat.color}`}>
                  <Icon size={80} />
                </div>
                <p className="text-3xl text-muted-foreground mt-0.5 relative z-10 md:text-nowrap text-wrap">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {stat.value}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Quick Actions */}
      {/* <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                href={link.path}
                className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3 hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className="text-primary" />
                  <span className="text-sm font-medium text-foreground">{link.label}</span>
                </div>
                <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            );
          })}
        </div>
      </section> */}

      {/* Footer note */}
      {/* <div className="border border-border rounded-xl p-4 bg-primary/5">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">Note:</span> All data shown here is demo data. Connect a backend API or database to persist changes.
        </p>
      </div> */}
    </div>
  );
}
