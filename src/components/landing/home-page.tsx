"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle, ChevronRight, Users, Building, BarChart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function HomePage() {
  const [activeTab, setActiveTab] = useState("leadManagement");

  const features = [
    {
      id: "leadManagement",
      title: "Lead Management",
      icon: <Users className="w-6 h-6" />,
      description: "Capture, organize, and nurture leads through your sales pipeline with ease. Never miss another opportunity.",
      benefits: ["Centralized lead database", "Automated lead scoring", "Custom lead qualification processes", "Real-time lead activity tracking"]
    },
    {
      id: "teamCollaboration",
      title: "Team Collaboration",
      icon: <Building className="w-6 h-6" />,
      description: "Enable seamless collaboration between lead brokers and sub-brokers to close deals faster.",
      benefits: ["Role-based access control", "Lead assignment workflow", "Internal communication tools", "Activity logging and history"]
    },
    {
      id: "analytics",
      title: "Analytics & Reporting",
      icon: <BarChart className="w-6 h-6" />,
      description: "Gain valuable insights into your sales pipeline and team performance with powerful analytics.",
      benefits: ["Conversion metrics", "Sales forecasting", "Performance reports", "Custom dashboards"]
    },
    {
      id: "followUps",
      title: "Smart Follow-ups",
      icon: <MessageSquare className="w-6 h-6" />,
      description: "Never miss important follow-ups with automated reminders and scheduled interactions.",
      benefits: ["Task scheduling", "Follow-up reminders", "Communication history", "Template messaging"]
    }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Streamline Your <span className="text-primary">Lead Management</span> Process
            </h1>
            <p className="hero-subtitle">
              The complete platform for real estate professionals to manage leads, track follow-ups, and boost conversions.
            </p>
            <div className="hero-cta">
              <Link href="/auth/signin">                <Button size="lg" className="cta-button">
                  Sign in <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>              <Link href="#features">
                <Button variant="outline" size="lg" className="learn-more-button">
                  Learn More <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>          <div className="hero-image">
            <Image
              src="/dashboard-preview.svg"
              alt="Dashboard Preview"
              width={900}
              height={600}
              className="dashboard-preview"
              priority
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </div>
      </section>

      {/* Clients/Trust Section */}
      <section className="trust-section">
        <div className="container">
          <p className="trusted-by">Trusted by real estate professionals worldwide</p>
          <div className="company-logos">
            {["logo1", "logo2", "logo3", "logo4", "logo5"].map((logo, index) => (
              <div key={index} className="company-logo-placeholder">
                <div className="placeholder-text">{`Real Estate Co. ${index + 1}`}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">Features designed for modern lead management</h2>
          <p className="section-subtitle">
            Everything you need to capture, nurture, and convert leads efficiently
          </p>
          
          <div className="features-tabs">
            <div className="tab-headers">
              {features.map((feature) => (
                <button
                  key={feature.id}
                  className={`tab-button ${activeTab === feature.id ? "active" : ""}`}
                  onClick={() => setActiveTab(feature.id)}
                >
                  <span className="tab-icon">{feature.icon}</span>
                  <span className="tab-title">{feature.title}</span>
                </button>
              ))}
            </div>
            
            <div className="tab-content">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className={`tab-panel ${activeTab === feature.id ? "active" : ""}`}
                >
                  <div className="feature-info">
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-description">{feature.description}</p>
                    <ul className="feature-benefits">
                      {feature.benefits.map((benefit, index) => (
                        <li key={index} className="benefit-item">
                          <CheckCircle className="check-icon" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>                  <div className="feature-image">
                    <div className="feature-image-placeholder">                      <Image
                        src={`/feature-${feature.id}.svg`}
                        alt={feature.title}
                        width={500}
                        height={300}
                        className="feature-img"
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <h2 className="section-title">What our customers say</h2>
          
          <div className="testimonials-grid">
            {[
              {
                quote: "This lead management system has transformed how our brokerage handles client acquisition. We've seen a 40% increase in conversion rates since implementation.",
                author: "Jennifer Hansen",
                position: "Lead Broker, City Real Estate"
              },
              {
                quote: "The collaboration features make it so easy to work with my team. I can assign leads, track follow-ups, and monitor progress all in one place.",
                author: "Michael Rodriguez",
                position: "Managing Director, Property Experts"
              },
              {
                quote: "As a super admin overseeing multiple brokers, the reporting tools give me invaluable insights into performance across different teams.",
                author: "Sarah Johnson",
                position: "Operations Manager, Metro Properties"
              }
            ].map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="quote-mark">"</div>
                <p className="testimonial-quote">{testimonial.quote}</p>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    <div className="avatar-placeholder"></div>
                  </div>
                  <div className="author-info">
                    <p className="author-name">{testimonial.author}</p>
                    <p className="author-position">{testimonial.position}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to transform your lead management?</h2>
            <p className="cta-text">
              Join thousands of real estate professionals who are growing their business with our platform.
            </p>
            <Link href="/auth/signin">              <Button size="lg" className="cta-button">
                Sign in to Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
