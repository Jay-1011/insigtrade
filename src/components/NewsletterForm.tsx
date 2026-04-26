"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function NewsletterForm({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center gap-2 py-3">
        <CheckCircle
          className={`w-5 h-5 ${variant === "dark" ? "text-accent" : "text-accent"}`}
        />
        <span
          className={`font-medium ${variant === "dark" ? "text-white" : "text-navy"}`}
        >
          You&apos;re in! Check your inbox.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className={`flex-1 px-4 py-3 text-sm rounded-lg border outline-none transition-all ${
          variant === "dark"
            ? "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-primary focus:ring-1 focus:ring-primary"
            : "bg-white border-border text-navy placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary"
        }`}
      />
      <button
        type="submit"
        className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors shrink-0"
      >
        Subscribe
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
