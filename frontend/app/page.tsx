"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");

  const features = [
    {
      icon: "📋",
      title: "Smart Task Management",
      description: "Organize academic and personal tasks with intelligent prioritization"
    },
    {
      icon: "⚡",
      title: "AI-Powered Scheduling",
      description: "Automatic scheduling based on deadlines, priorities, and energy levels"
    },
    {
      icon: "📊",
      title: "Productivity Analytics",
      description: "Track your progress with detailed analytics and insights"
    },
    {
      icon: "🔔",
      title: "Smart Reminders",
      description: "Never miss a deadline with intelligent notifications"
    },
    {
      icon: "📅",
      title: "Calendar Integration",
      description: "Visualize your schedule on an interactive calendar"
    },
    {
      icon: "🎯",
      title: "Goal Tracking",
      description: "Set and achieve your academic and personal goals"
    }
  ];

  const benefits = [
    { number: "85%", label: "Average Productivity Increase" },
    { number: "50%", label: "Less Time Planning" },
    { number: "10K+", label: "Students Helped" },
    { number: "4.9/5", label: "User Rating" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <span className="text-xl font-bold text-white">StudentScheduler</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-white hover:text-blue-300 transition">
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 rounded-full text-blue-300 text-sm mb-8">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              AI-Powered Task Management
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Master Your
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Student Life</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Organize tasks, boost productivity, and reduce stress with our AI-powered scheduling system designed specifically for students.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/register"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Start Free Trial
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
              >
                Sign In
              </Link>
            </div>

            {/* Email Signup */}
            <div className="max-w-md mx-auto">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-blue-400 placeholder-slate-400"
                />
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
              <div className="bg-slate-900 rounded-xl p-6">
                {/* Mock Dashboard */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-600 rounded-xl p-4 text-white">
                    <div className="text-3xl font-bold">85%</div>
                    <div className="text-blue-200 text-sm">Productivity</div>
                  </div>
                  <div className="bg-slate-700 rounded-xl p-4">
                    <div className="text-3xl font-bold text-white">12</div>
                    <div className="text-slate-400 text-sm">Tasks Today</div>
                  </div>
                  <div className="bg-slate-700 rounded-xl p-4">
                    <div className="text-3xl font-bold text-green-400">8</div>
                    <div className="text-slate-400 text-sm">Completed</div>
                  </div>
                  <div className="bg-slate-700 rounded-xl p-4">
                    <div className="text-3xl font-bold text-white">4</div>
                    <div className="text-slate-400 text-sm">Due Today</div>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {benefit.number}
                </div>
                <div className="text-slate-400">{benefit.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Powerful features designed to help students manage their time, reduce stress, and achieve their goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all hover:transform hover:-translate-y-1 group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400">
              Get started in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Create Account", description: "Sign up in seconds with your email" },
              { step: "2", title: "Add Tasks", description: "Enter your assignments and commitments" },
              { step: "3", title: "Get Scheduled", description: "AI optimizes your schedule automatically" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              What Students Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "This app completely transformed how I manage my coursework. My grades improved by 15%!",
                author: "Sarah M.",
                role: "Computer Science Student"
              },
              {
                quote: "The AI scheduling is incredible. I never miss deadlines anymore and have more free time.",
                author: "James K.",
                role: "Medical Student"
              },
              {
                quote: "Finally, a tool that understands the chaos of being a student. Highly recommend!",
                author: "Emily R.",
                role: "Business Student"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <div className="text-blue-400 text-4xl mb-4">"</div>
                <p className="text-slate-300 mb-4">{testimonial.quote}</p>
                <div>
                  <div className="font-semibold text-white">{testimonial.author}</div>
                  <div className="text-slate-400 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Boost Your Productivity?
            </h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto">
              Join thousands of students who are already achieving more with StudentScheduler.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <span className="text-xl font-bold text-white">StudentScheduler</span>
            </div>
            <div className="text-slate-400 text-sm">
              © 2024 StudentScheduler. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-white transition">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-white transition">Terms</a>
              <a href="#" className="text-slate-400 hover:text-white transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
