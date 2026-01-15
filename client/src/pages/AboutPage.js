import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import './AboutPage.css';

const AboutPage = () => {
    return (
        <div className="about-page">
            <Navbar />
            
            {/* Hero Section */}
            <section className="about-hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <i className="fas fa-building"></i>
                            <span>About Us</span>
                        </div>
                        <h1>About Holy Family Polymers</h1>
                        <p>Pioneering quality and trust in the natural rubber latex industry since 1999. Building bridges between local farmers and global markets through innovation and integrity.</p>
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section className="story-section">
                <div className="container">
                    <div className="story-grid">
                        <div className="story-image">
                            <img src="/images/images2.jpeg" alt="Rubber Plantation" 
                                onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800'}
                            />
                            <div className="image-overlay">
                                <div className="overlay-badge">
                                    <i className="fas fa-seedling"></i>
                                    <span>Since 1999</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="story-text">
                            <span className="section-tag">Our Story</span>
                            <h2>From Local Roots to Global Impact</h2>
                            <p>
                                Founded in the heart of Kerala's rubber country, Kottayam, Holy Family Polymers was born from a desire to create a transparent and efficient link between local rubber farmers and the global market.
                            </p>
                            <p>
                                We saw the hard work of our community and built a platform that not only ensures fair pricing but also streamlines the entire process through technology. Our commitment is to uphold the values of integrity, quality, and community in every transaction.
                            </p>
                            <div className="story-highlights">
                                <div className="highlight-item">
                                    <i className="fas fa-check-circle"></i>
                                    <span>25+ Years of Excellence</span>
                                </div>
                                <div className="highlight-item">
                                    <i className="fas fa-check-circle"></i>
                                    <span>500+ Happy Clients</span>
                                </div>
                                <div className="highlight-item">
                                    <i className="fas fa-check-circle"></i>
                                    <span>ISO Certified Quality</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="values-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">Our Values</span>
                        <h2>What Drives Us Forward</h2>
                        <p>The principles that guide every decision we make</p>
                    </div>
                    
                    <div className="values-grid">
                        <div className="value-card quality">
                            <div className="value-icon">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <h3>Quality First</h3>
                            <p>We are dedicated to providing the highest grade of natural rubber latex, meeting stringent quality standards and exceeding customer expectations.</p>
                            <div className="value-badge">Excellence</div>
                        </div>
                        
                        <div className="value-card integrity">
                            <div className="value-icon">
                                <i className="fas fa-handshake"></i>
                            </div>
                            <h3>Integrity & Trust</h3>
                            <p>Our business is built on transparent pricing and honest relationships with our valued suppliers and clients across the globe.</p>
                            <div className="value-badge">Transparency</div>
                        </div>
                        
                        <div className="value-card community">
                            <div className="value-icon">
                                <i className="fas fa-users"></i>
                            </div>
                            <h3>Community Focused</h3>
                            <p>We are committed to empowering local farmers and contributing to the growth of our community in Kottayam and beyond.</p>
                            <div className="value-badge">Empowerment</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="mission-vision-section">
                <div className="container">
                    <div className="mission-vision-grid">
                        <div className="mission-card">
                            <div className="card-icon">
                                <i className="fas fa-bullseye"></i>
                            </div>
                            <h3>Our Mission</h3>
                            <p>
                                To deliver comprehensive accounting and operations management solutions specifically designed for rubber manufacturing, streamlining processes and enhancing productivity through real-time insights.
                            </p>
                        </div>
                        
                        <div className="vision-card">
                            <div className="card-icon">
                                <i className="fas fa-eye"></i>
                            </div>
                            <h3>Our Vision</h3>
                            <p>
                                To be the leading provider of innovative rubber manufacturing solutions, transforming the industry through cutting-edge technology and sustainable practices that empower businesses worldwide.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="about-stats-section">
                <div className="container">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-calendar-alt"></i>
                            </div>
                            <div className="stat-number">25+</div>
                            <div className="stat-label">Years of Experience</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-users"></i>
                            </div>
                            <div className="stat-number">500+</div>
                            <div className="stat-label">Happy Clients</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-award"></i>
                            </div>
                            <div className="stat-number">15+</div>
                            <div className="stat-label">Awards Won</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-globe"></i>
                            </div>
                            <div className="stat-number">10+</div>
                            <div className="stat-label">Countries Served</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="about-cta">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Experience Excellence?</h2>
                        <p>Join hundreds of satisfied clients who trust Holy Family Polymers for their rubber manufacturing needs.</p>
                        <div className="cta-buttons">
                            <Link to="/contact" className="btn btn-primary">
                                <i className="fas fa-envelope"></i>
                                <span>Contact Us</span>
                            </Link>
                            <Link to="/history" className="btn btn-outline">
                                <i className="fas fa-history"></i>
                                <span>Our Journey</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;

