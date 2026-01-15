import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import './HistoryPage.css';

const HistoryPage = () => {
    const milestones = [
        {
            year: '1995',
            title: 'Company Founded',
            description: 'Holy Family Polymers was established as a small rubber manufacturing unit in Kottayam, Kerala.',
            icon: 'fas fa-seedling',
            image: '/images/company-founding.jpg'
        },
        {
            year: '2000',
            title: 'First Major Expansion',
            description: 'Expanded operations with new machinery and increased production capacity by 300%.',
            icon: 'fas fa-industry',
            image: '/images/first-expansion.jpg'
        },
        {
            year: '2005',
            title: 'Quality Certification',
            description: 'Achieved ISO 9001:2000 certification for quality management systems.',
            icon: 'fas fa-certificate',
            image: '/images/iso-certification.jpg'
        },
        {
            year: '2010',
            title: 'Technology Integration',
            description: 'Introduced automated production lines and computerized inventory management.',
            icon: 'fas fa-robot',
            image: '/images/automation.jpg'
        },
        {
            year: '2015',
            title: 'Digital Transformation',
            description: 'Launched our first digital accounting and payroll management system.',
            icon: 'fas fa-digital-tachograph',
            image: '/images/digital-transformation.jpg'
        },
        {
            year: '2018',
            title: 'Smart Manufacturing',
            description: 'Implemented IoT sensors and real-time monitoring across all production lines.',
            icon: 'fas fa-microchip',
            image: '/images/smart-manufacturing.jpg'
        },
        {
            year: '2020',
            title: 'Cloud Migration',
            description: 'Migrated all systems to cloud infrastructure for better scalability and reliability.',
            icon: 'fas fa-cloud',
            image: '/images/cloud-migration.jpg'
        },
        {
            year: '2022',
            title: 'AI Integration',
            description: 'Integrated artificial intelligence for predictive maintenance and quality control.',
            icon: 'fas fa-brain',
            image: '/images/ai-integration.jpg'
        },
        {
            year: '2024',
            title: 'Sustainability Initiative',
            description: 'Launched comprehensive sustainability program with zero-waste manufacturing.',
            icon: 'fas fa-leaf',
            image: '/images/sustainability.jpg'
        },
        {
            year: '2025',
            title: 'Platform Excellence',
            description: 'Achieved industry leadership with our comprehensive smart accounting platform.',
            icon: 'fas fa-trophy',
            image: '/images/platform-excellence.jpg'
        }
    ];

    const achievements = [
        {
            title: 'Industry Leader',
            description: '30 years of excellence in rubber manufacturing',
            icon: 'fas fa-crown',
            value: '30+'
        },
        {
            title: 'Production Capacity',
            description: 'Tons of rubber products manufactured annually',
            icon: 'fas fa-weight-hanging',
            value: '5000+'
        },
        {
            title: 'Satisfied Clients',
            description: 'Companies trust our products and services',
            icon: 'fas fa-handshake',
            value: '200+'
        },
        {
            title: 'Employee Strength',
            description: 'Skilled professionals in our team',
            icon: 'fas fa-users',
            value: '150+'
        }
    ];

    return (
        <div className="history-page">
            <Navbar />
            
            {/* Hero Section */}
            <section className="history-hero">
                <div className="container">
                    <div className="hero-content">
                        <h1>Our Journey</h1>
                        <p>Three decades of innovation, growth, and excellence in rubber manufacturing and smart technology solutions.</p>
                    </div>
                </div>
            </section>

            {/* Timeline Section */}
            <section className="timeline-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Our Milestones</h2>
                        <p>From humble beginnings to industry leadership</p>
                    </div>
                    
                    <div className="timeline">
                        {milestones.map((milestone, index) => (
                            <div key={index} className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'}`}>
                                <div className="timeline-content">
                                    <div className="timeline-image">
                                        <img
                                            src={milestone.image}
                                            alt={milestone.title}
                                            onError={(e) => e.target.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(milestone.title)}`}
                                        />
                                    </div>
                                    <div className="timeline-info">
                                        <div className="timeline-year">{milestone.year}</div>
                                        <div className="timeline-icon">
                                            <i className={milestone.icon}></i>
                                        </div>
                                        <h3>{milestone.title}</h3>
                                        <p>{milestone.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Achievements Section */}
            <section className="achievements-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Our Achievements</h2>
                        <p>Numbers that reflect our commitment to excellence</p>
                    </div>
                    
                    <div className="achievements-grid">
                        {achievements.map((achievement, index) => (
                            <div key={index} className="achievement-item">
                                <div className="achievement-icon">
                                    <i className={achievement.icon}></i>
                                </div>
                                <div className="achievement-value">{achievement.value}</div>
                                <h3>{achievement.title}</h3>
                                <p>{achievement.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Vision Section */}
            <section className="vision-section">
                <div className="container">
                    <div className="vision-content">
                        <div className="vision-text">
                            <h2>Our Vision for the Future</h2>
                            <p>
                                As we look ahead, Holy Family Polymers remains committed to pushing the boundaries of 
                                innovation in rubber manufacturing. Our smart accounting platform represents just the 
                                beginning of our digital transformation journey.
                            </p>
                            <p>
                                We envision a future where every aspect of manufacturing is optimized through intelligent 
                                automation, sustainable practices, and data-driven decision making. Our goal is to set 
                                new industry standards while maintaining our core values of quality, integrity, and 
                                customer satisfaction.
                            </p>
                            <div className="vision-features">
                                <div className="feature-item">
                                    <i className="fas fa-leaf"></i>
                                    <span>Sustainable Manufacturing</span>
                                </div>
                                <div className="feature-item">
                                    <i className="fas fa-robot"></i>
                                    <span>Advanced Automation</span>
                                </div>
                                <div className="feature-item">
                                    <i className="fas fa-globe"></i>
                                    <span>Global Expansion</span>
                                </div>
                                <div className="feature-item">
                                    <i className="fas fa-lightbulb"></i>
                                    <span>Continuous Innovation</span>
                                </div>
                            </div>
                        </div>
                        <div className="vision-image">
                            <img
                                src="/images/future-vision.jpg"
                                alt="Future Vision"
                                onError={(e) => e.target.src = 'https://via.placeholder.com/600x400?text=Future+Vision'}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Leadership Section */}
            <section className="leadership-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Leadership Team</h2>
                        <p>The visionaries behind our success</p>
                    </div>
                    
                    <div className="leadership-grid">
                        <div className="leader-item">
                            <div className="leader-image">
                                <img
                                    src="/images/ceo-portrait.jpg"
                                    alt="CEO"
                                    onError={(e) => e.target.src = 'https://via.placeholder.com/300x300?text=CEO'}
                                />
                            </div>
                            <div className="leader-info">
                                <h3>John Thomas</h3>
                                <p className="leader-title">Chief Executive Officer</p>
                                <p className="leader-description">
                                    With over 25 years in manufacturing, John has led Holy Family Polymers 
                                    through its digital transformation journey.
                                </p>
                            </div>
                        </div>
                        
                        <div className="leader-item">
                            <div className="leader-image">
                                <img
                                    src="/images/cto-portrait.jpg"
                                    alt="CTO"
                                    onError={(e) => e.target.src = 'https://via.placeholder.com/300x300?text=CTO'}
                                />
                            </div>
                            <div className="leader-info">
                                <h3>Sarah Johnson</h3>
                                <p className="leader-title">Chief Technology Officer</p>
                                <p className="leader-description">
                                    Sarah spearheads our technology initiatives and platform development, 
                                    bringing innovation to traditional manufacturing.
                                </p>
                            </div>
                        </div>
                        
                        <div className="leader-item">
                            <div className="leader-image">
                                <img
                                    src="/images/coo-portrait.jpg"
                                    alt="COO"
                                    onError={(e) => e.target.src = 'https://via.placeholder.com/300x300?text=COO'}
                                />
                            </div>
                            <div className="leader-info">
                                <h3>Michael Chen</h3>
                                <p className="leader-title">Chief Operations Officer</p>
                                <p className="leader-description">
                                    Michael ensures operational excellence and oversees our manufacturing 
                                    processes with a focus on quality and efficiency.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="history-cta">
                <div className="container">
                    <div className="cta-content">
                        <h2>Be Part of Our Future</h2>
                        <p>Join us as we continue to innovate and lead the rubber manufacturing industry.</p>
                        <div className="cta-buttons">
                            <Link to="/contact" className="btn btn-primary">Get in Touch</Link>
                            <Link to="/gallery" className="btn btn-secondary">View Our Work</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h3>Holy Family Polymers</h3>
                            <p>Smart accounting and operations dashboard for the modern rubber manufacturing industry.</p>
                        </div>
                        <div className="footer-section">
                            <h4>Our Journey</h4>
                            <ul>
                                <li><a href="#milestones">Milestones</a></li>
                                <li><a href="#achievements">Achievements</a></li>
                                <li><a href="#leadership">Leadership</a></li>
                                <li><a href="#vision">Vision</a></li>
                            </ul>
                        </div>
                        <div className="footer-section">
                            <h4>Quick Links</h4>
                            <ul>
                                <li><Link to="/">Home</Link></li>
                                <li><Link to="/gallery">Gallery</Link></li>
                                <li><Link to="/contact">Contact</Link></li>
                                <li><Link to="/login">Login</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2025 Holy Family Polymers. All Rights Reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HistoryPage;

