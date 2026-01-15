import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import './HomePage.css';

const HomePage = () => {
    return (
        <div className="homepage">
            <Navbar />
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-background">
                    <div className="hero-shape hero-shape-1"></div>
                    <div className="hero-shape hero-shape-2"></div>
                    <div className="hero-shape hero-shape-3"></div>
                </div>
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-text">
                            <div className="hero-badge">
                                <i className="fas fa-award"></i>
                                <span>Industry Leading Solution Since 1999</span>
                            </div>
                            <h1 className="hero-title">
                                Transform Your <span className="gradient-text">Rubber Manufacturing</span> Operations
                            </h1>
                            <p className="hero-subtitle">
                                Complete ERP solution for latex billing, inventory management, payroll automation, and real-time analytics. 
                                Trusted by 500+ manufacturers across India with 99.9% uptime guarantee.
                            </p>
                            <div className="hero-actions">
                                <Link to="/login" className="btn btn-primary btn-large">
                                    <i className="fas fa-sign-in-alt"></i>
                                    <span>Get Started</span>
                                </Link>
                                <Link to="/contact" className="btn btn-outline btn-large">
                                    <i className="fas fa-calendar-check"></i>
                                    <span>Contact Us</span>
                                </Link>
                            </div>

                            <div className="home-feature-cards">
                                <div className="home-feature-card">
                                    <div className="home-feature-icon">
                                        <i className="fas fa-file-invoice-dollar"></i>
                                    </div>
                                    <div className="home-feature-title">Billing</div>
                                    <div className="home-feature-desc">Automated latex billing with DRC & GST support.</div>
                                </div>
                                <div className="home-feature-card">
                                    <div className="home-feature-icon">
                                        <i className="fas fa-cubes"></i>
                                    </div>
                                    <div className="home-feature-title">Inventory</div>
                                    <div className="home-feature-desc">Track barrels and stock with real-time updates.</div>
                                </div>
                                <div className="home-feature-card">
                                    <div className="home-feature-icon">
                                        <i className="fas fa-chart-line"></i>
                                    </div>
                                    <div className="home-feature-title">Analytics</div>
                                    <div className="home-feature-desc">Clear dashboards for decisions and reporting.</div>
                                </div>
                            </div>
                        </div>
                        <div className="hero-visual">
                            <div className="dashboard-preview">
                                <div className="preview-window">
                                    <div className="window-header">
                                        <div className="window-dots">
                                            <span className="dot-red"></span>
                                            <span className="dot-yellow"></span>
                                            <span className="dot-green"></span>
                                        </div>
                                        <div className="window-title">
                                            <i className="fas fa-chart-line"></i>
                                            Holy Family Polymers Dashboard
                                        </div>
                                    </div>
                                    <div className="window-content">
                                        <div className="dashboard-mockup">
                                            <img src="/images/logo.png" alt="Dashboard Preview" className="dashboard-img" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default HomePage;