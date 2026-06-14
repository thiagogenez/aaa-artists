"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { artists } from "@/data/artists";
import { Suspense } from "react";

const EVENT_TYPES = ["Club Night", "Festival", "Private Event", "Corporate Event", "Tour", "Other"];

function ContactForm() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("artist") ?? "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    artist: preselected,
    eventType: "",
    date: "",
    venue: "",
    attendance: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email address";
    if (!form.message.trim()) e.message = "Please include a message";
    return e;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const subject = `Booking Enquiry${form.artist ? `: ${form.artist}` : ""} — ${form.name}`;
    const body = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      form.phone ? `Phone: ${form.phone}` : null,
      form.artist ? `Artist: ${form.artist}` : null,
      form.eventType ? `Event type: ${form.eventType}` : null,
      form.date ? `Event date: ${form.date}` : null,
      form.venue ? `Venue / Location: ${form.venue}` : null,
      form.attendance ? `Expected attendance: ${form.attendance}` : null,
      "",
      "Message:",
      form.message,
    ]
      .filter((l) => l !== null)
      .join("\n");

    window.open(
      `mailto:booking@aaaevents.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    );
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div
          className="mb-6 flex h-16 w-16 items-center justify-center border"
          style={{ borderColor: "var(--border)" }}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--text)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mb-3 text-2xl font-bold" style={{ color: "var(--text)" }}>Enquiry sent</h2>
        <p className="mb-8 max-w-sm text-sm" style={{ color: "var(--text-40)" }}>
          Your email client should have opened with your message pre-filled. We aim to respond within 48 hours.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-sm underline underline-offset-4 transition-opacity hover:opacity-60"
          style={{ color: "var(--text-40)" }}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Name + Email */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Your Name" required error={errors.name}>
          <input
            name="name"
            type="text"
            placeholder="Jane Smith"
            value={form.name}
            onChange={handleChange}
            className="w-full border px-4 py-3 text-sm outline-none transition-all"
            style={{
              borderColor: errors.name ? "#e55" : "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--text)",
            }}
          />
        </Field>
        <Field label="Email Address" required error={errors.email}>
          <input
            name="email"
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={handleChange}
            className="w-full border px-4 py-3 text-sm outline-none transition-all"
            style={{
              borderColor: errors.email ? "#e55" : "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--text)",
            }}
          />
        </Field>
      </div>

      {/* Phone + Artist */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Phone Number">
          <input
            name="phone"
            type="tel"
            placeholder="+44 7700 000000"
            value={form.phone}
            onChange={handleChange}
            className="w-full border px-4 py-3 text-sm outline-none"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
          />
        </Field>
        <Field label="Artist of Interest">
          <select
            name="artist"
            value={form.artist}
            onChange={handleChange}
            className="w-full border px-4 py-3 text-sm outline-none"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
          >
            <option value="">Select an artist…</option>
            {artists.map((a) => (
              <option key={a.slug} value={a.name}>{a.name}</option>
            ))}
            <option value="Open to suggestions">Open to suggestions</option>
          </select>
        </Field>
      </div>

      {/* Event type + Date */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Event Type">
          <select
            name="eventType"
            value={form.eventType}
            onChange={handleChange}
            className="w-full border px-4 py-3 text-sm outline-none"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
          >
            <option value="">Select type…</option>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Event Date">
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className="w-full border px-4 py-3 text-sm outline-none"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
          />
        </Field>
      </div>

      {/* Venue + Attendance */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Venue / Location">
          <input
            name="venue"
            type="text"
            placeholder="Club Fabric, London"
            value={form.venue}
            onChange={handleChange}
            className="w-full border px-4 py-3 text-sm outline-none"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
          />
        </Field>
        <Field label="Expected Attendance">
          <input
            name="attendance"
            type="text"
            placeholder="e.g. 500–1000"
            value={form.attendance}
            onChange={handleChange}
            className="w-full border px-4 py-3 text-sm outline-none"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
          />
        </Field>
      </div>

      {/* Message */}
      <Field label="Message" required error={errors.message}>
        <textarea
          name="message"
          rows={5}
          placeholder="Tell us about your event, budget, and any other details…"
          value={form.message}
          onChange={handleChange}
          className="w-full resize-none border px-4 py-3 text-sm outline-none"
          style={{
            borderColor: errors.message ? "#e55" : "var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--text)",
          }}
        />
      </Field>

      <button
        type="submit"
        className="w-full py-4 text-sm font-semibold uppercase tracking-widest transition-all sm:w-auto sm:px-12"
        style={{ backgroundColor: "var(--cta-bg)", color: "var(--cta-text)" }}
      >
        Send Enquiry
      </button>

      <p className="text-xs" style={{ color: "var(--text-30)" }}>
        Submitting this form will open your email client with your details pre-filled.
        We aim to respond within 48 hours.
      </p>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-40)" }}>
        {label}{required && <span className="ml-0.5" style={{ color: "var(--text-40)" }}>*</span>}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: "#e55" }}>{error}</p>}
    </div>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen px-6 py-20" style={{ backgroundColor: "var(--bg)" }}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--text-30)" }}>
            AAA Events
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl" style={{ color: "var(--text)" }}>
            Book an Artist
          </h1>
          <p className="max-w-xl text-base leading-relaxed" style={{ color: "var(--text-60)" }}>
            Fill in as much detail as possible and we will get back to you within 48 hours to discuss
            availability and fees.
          </p>
        </div>

        <div className="border p-8 md:p-12" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
          <Suspense>
            <ContactForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
