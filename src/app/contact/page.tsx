"use client";

import { useState } from "react";
import { Mail, MessageSquare, Send, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      {/* Header */}
      <section className="bg-surface border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-navy">
              Contact Us
            </h1>
            <p className="mt-4 text-lg text-muted leading-relaxed">
              Have a question, suggestion, or want to collaborate? We&apos;d
              love to hear from you.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-[1fr_280px] gap-12">
          {/* Form */}
          <div>
            {submitted ? (
              <div className="bg-accent/5 rounded-2xl border border-accent/20 p-12 text-center">
                <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
                <h2 className="text-xl font-bold text-navy mb-2">
                  Message Sent!
                </h2>
                <p className="text-muted">
                  Thanks for reaching out. We&apos;ll get back to you as soon
                  as possible.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-navy mb-2"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder="Your name"
                      className="w-full px-4 py-3 text-sm bg-white border border-border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-navy mb-2"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 text-sm bg-white border border-border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-navy mb-2"
                  >
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    required
                    placeholder="What is this about?"
                    className="w-full px-4 py-3 text-sm bg-white border border-border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-navy mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    placeholder="Write your message..."
                    className="w-full px-4 py-3 text-sm bg-white border border-border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
                >
                  Send Message
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-surface rounded-xl border border-border p-6">
              <Mail className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold text-navy mb-1">Email</h3>
              <p className="text-sm text-muted">hello@insigtrade.com</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-6">
              <MessageSquare className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold text-navy mb-1">Response Time</h3>
              <p className="text-sm text-muted">
                We typically respond within 24-48 hours.
              </p>
            </div>
            <div className="bg-navy rounded-xl p-6 text-white">
              <h3 className="font-bold mb-2">Want to collaborate?</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                If you&apos;re building an AI tool for traders and want us to
                review it, reach out and we&apos;ll be happy to take a look.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
