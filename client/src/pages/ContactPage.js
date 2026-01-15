import React from 'react';
import Navbar from '../components/common/Navbar';
import './ContactPage.css';

const ContactPage = () => {
    return (
        <div className="contact-page">
            <Navbar />
            {/* Hero Section */}
            <section className="contact-hero">
                <div className="container">
                    <div className="hero-content">
                        <h1>Contact Us</h1>
                        <p>Get in touch with Holy Family Polymers for all your rubber manufacturing needs.</p>
                    </div>
                </div>
            </section>

            {/* Contact Information Only */}
            <section className="contact-content">
                <div className="container">
                    <div className="contact-info-center">
                        <h2>Contact Information</h2>
                        
                        {/* Main Contact Grid */}
                        <div className="contact-main-grid">
                            {/* Primary Contact Box */}
                            <div className="primary-contact-box">
                                <div className="contact-header">
                                    <div className="company-icon">
                                        <i className="fas fa-building"></i>
                                    </div>
                                    <div className="company-details">
                                        <h3>Holy Family Polymers</h3>
                                        <p>Premium Rubber Manufacturing</p>
                                    </div>
                                </div>
                                
                                <div className="contact-details">
                                    <div className="detail-row">
                                        <div className="detail-icon">
                                            <i className="fas fa-map-marker-alt"></i>
                                        </div>
                                        <div className="detail-info">
                                            <span className="detail-label">Address</span>
                                            <span className="detail-value"> V/114 V-114, HOLYFAMILY BUILDINGS, KOOROPPADA, PAMPADY Kottayam, Kerala, 686502 India</span>
                                        </div>
                                    </div>
                                    
                                    <div className="detail-row">
                                        <div className="detail-icon">
                                            <i className="fas fa-phone"></i>
                                        </div>
                                        <div className="detail-info">
                                            <span className="detail-label">Phone</span>
                                            <span className="detail-value">+91 9526264949</span>
                                        </div>
                                    </div>
                                    
                                    <div className="detail-row">
                                        <div className="detail-icon">
                                            <i className="fas fa-envelope"></i>
                                        </div>
                                        <div className="detail-info">
                                            <span className="detail-label">Email</span>
                                            <span className="detail-value">info@holyfamilypolymers.com<br />support@holyfamilypolymers.com</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Business Hours Box */}
                            <div className="business-hours-box">
                                <div className="hours-header">
                                    <div className="hours-icon">
                                        <i className="fas fa-clock"></i>
                                    </div>
                                    <h3>Business Hours</h3>
                                </div>
                                
                                <div className="hours-schedule">
                                    <div className="schedule-item">
                                        <span className="day">Monday - Friday</span>
                                        <span className="time">9:00 AM - 6:00 PM</span>
                                    </div>
                                    <div className="schedule-item">
                                        <span className="day">Saturday</span>
                                        <span className="time">9:00 AM - 2:00 PM</span>
                                    </div>
                                    <div className="schedule-item closed">
                                        <span className="day">Sunday</span>
                                        <span className="time">Closed</span>
                                    </div>
                                </div>
                                
                                <div className="current-status">
                                    <div className="status-indicator open">
                                        <div className="status-dot"></div>
                                        <span>Currently Open</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="contact-actions">
                            <a href="tel:+919526264949" className="contact-action-link">
                                <i className="fas fa-phone"></i>
                                <div className="contact-action-content">
                                    <span className="contact-action-title">Call Now</span>
                                    <span className="contact-action-subtitle">+91 9526264949</span>
                                </div>
                            </a>
                            <a href="mailto:info@holyfamilypolymers.com" className="contact-action-link">
                                <i className="fas fa-envelope"></i>
                                <span>Email</span>
                            </a>
                            <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="contact-action-link">
                                <i className="fas fa-map-marker-alt"></i>
                                <span>Directions</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="map-section">
                <div className="container">
                    <h2>Find Us</h2>
                    <div className="map-container">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.0!2d76.5222!3d9.5916!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMzUnMjkuOCJOIDc2wrAzMScyMC4wIkU!5e0!3m2!1sen!2sin!4v1234567890"
                            width="100%"
                            height="400"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Holy Family Polymers Location"
                        ></iframe>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ContactPage;