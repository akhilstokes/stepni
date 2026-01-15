 
import React from 'react';
import './GalleryPage.css';

const GalleryPage = () => {
    const galleryItems = [
        {
            id: 1,
            title: 'Dashboard Overview',
            category: 'dashboard',
            image: '/images/holy1.jpg',
            description: 'Main dashboard showing real-time analytics and key metrics for rubber manufacturing operations.'
        },
        {
            id: 2,
            title: 'Payroll Management',
            category: 'payroll',
            image: '/images/holy2.jpg',
            description: 'Automated payroll calculation system with wage verification workflows.'
        },
        {
            id: 3,
            title: 'Inventory Tracking',
            category: 'inventory',
            image: '/images/holy3.jpg',
            description: 'Real-time latex barrel tracking and stock monitoring system.'
        },
        {
            id: 4,
            title: 'Financial Reports',
            category: 'reports',
            image: '/images/holy4.jpg',
            description: 'Comprehensive financial reporting and profitability analysis tools.'
        },
        {
            id: 5,
            title: 'Manufacturing Floor',
            category: 'facility',
            image: '/images/holy5.jpg',
            description: 'Holy Family Polymers manufacturing facility with modern equipment.'
        },
        {
            id: 6,
            title: 'Quality Control Lab',
            category: 'facility',
            image: '/images/holy6.jpg',
            description: 'State-of-the-art quality control laboratory for rubber testing.'
        },
        {
            id: 7,
            title: 'Mobile Dashboard',
            category: 'dashboard',
            image: '/images/holy7.jpg',
            description: 'Responsive mobile interface for on-the-go management.'
        },
        {
            id: 10,
            title: 'Production Line',
            category: 'facility',
            image: '/images/holy1.jpg',
            description: 'Automated rubber production line with quality monitoring.'
        },
        {
            id: 11,
            title: 'Billing System',
            category: 'dashboard',
            image: '/images/holy2.jpg',
            description: 'Automated latex billing and invoice generation system.'
        },
        {
            id: 12,
            title: 'Warehouse Management',
            category: 'inventory',
            image: '/images/holy3.jpg',
            description: 'Modern warehouse facility with automated inventory tracking.'
        },
        {
            id: 13,
            title: 'Holy Family Polymers',
            category: 'facility',
            image: '/images/holy3.jpg',
            description: 'Holy Family Polymers facility view.'
        }
    ];

    return (
        <div className="gallery-page">
            <section className="gallery-content">
                <div className="container">
                    <div className="gallery-grid">
                        {galleryItems.map(item => (
                            <div key={item.id} className="gallery-item">
                                <div className="image-container">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/images/logo.png'; }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default GalleryPage;
