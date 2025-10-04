import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, DollarSign, Users, Shield, CheckCircle } from 'lucide-react';
import ThemeToggler from '../components/ui/ThemeToggler';

const LandingPage = () => {
  const features = [
    {
      title: "Smart Expense Tracking",
      icon: DollarSign,
      content: "Intuitive expense submission with multi-currency support and receipt upload.",
    },
    {
      title: "Approval Workflows",
      icon: CheckCircle,
      content: "Streamlined approval process with role-based access and notification system.",
    },
    {
      title: "Secure & Compliant",
      icon: Shield,
      content: "Enterprise-grade security with comprehensive audit trails and data protection.",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Create Account",
      content: "Set up your company account and invite team members.",
    },
    {
      step: "2",
      title: "Submit Expenses",
      content: "Employees submit expenses with receipts and descriptions.",
    },
    {
      step: "3",
      title: "Get Approved",
      content: "Managers review and approve expenses instantly.",
    },
  ];

  const stats = [
    { number: "500+", label: "Companies Trust Us" },
    { number: "10K+", label: "Expenses Processed" },
    { number: "24/7", label: "Support Available" },
    { number: "99%", label: "Satisfaction Rate" },
  ];

  return (
    <div className="bg-gray-950 text-white font-sans antialiased">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-transparent bg-clip-text">
                ExpenseTracker
              </span>
            </h1>
            <div className="flex items-center space-x-4">
              <ThemeToggler />
              <Link
                to="/auth"
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/30"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-r from-gray-950 to-emerald-950/20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-transparent bg-clip-text">
              Streamline Your
            </span>
            <br />
            <span className="text-gray-100">
              Expense Management
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Empower your team with intelligent expense tracking, automated approvals, 
            and real-time insights. Take control of your company's financial workflow.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/auth"
              className="group bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/30 flex items-center justify-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 font-bold py-4 px-8 rounded-full transition-colors duration-300 flex items-center justify-center"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-transparent bg-clip-text">
                Why Choose ExpenseTracker
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Built for modern businesses that demand efficiency, transparency, and control.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-800/50 p-8 rounded-2xl border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-2 shadow-lg group"
              >
                <div className="mb-6">
                  <feature.icon className="w-12 h-12 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-500 mb-4 tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-950">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
              Simple Steps to Success
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Get started in minutes with our intuitive three-step process.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="absolute inset-0 flex items-center justify-center md:block">
              <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 absolute top-1/2 -translate-y-1/2 opacity-30" />
            </div>
            {howItWorks.map((step, index) => (
              <div
                key={index}
                className="relative z-10 bg-gray-800 p-8 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-400 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                  {step.step}
                </div>
                <h3 className="text-2xl font-bold text-center mt-6 mb-4 text-emerald-500 tracking-wide">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-center leading-relaxed">
                  {step.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="p-6 border border-emerald-500/10 rounded-2xl transition-all duration-300 hover:scale-105 hover:border-emerald-500/30"
              >
                <div className="text-3xl sm:text-4xl font-bold text-emerald-500 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-950 to-emerald-950/20">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Transform Your 
            <span className="block bg-gradient-to-r from-emerald-500 to-emerald-400 text-transparent bg-clip-text">
              Expense Management?
            </span>
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of companies already saving time and money with ExpenseTracker.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/30 group"
          >
            Get Started Today
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold text-emerald-500 mb-4">
                ExpenseTracker
              </h3>
              <p className="text-gray-400 mb-6 max-w-md">
                Empowering businesses with intelligent expense management solutions 
                that save time, reduce costs, and provide complete visibility.
              </p>
            </div>
            <div>
              <h4 className="text-gray-300 font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                {["Features", "Pricing", "Security", "Updates"].map((link, index) => (
                  <li key={index}>
                    <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors duration-300">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-gray-300 font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                {["Help Center", "Contact Us", "API Docs", "Status"].map((link, index) => (
                  <li key={index}>
                    <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors duration-300">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-500">
              © 2025 ExpenseTracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
