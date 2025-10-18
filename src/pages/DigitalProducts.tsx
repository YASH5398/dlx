import React from 'react';

/**
 * Digital Products Page
 * Showcase of digital services and products
 * Dark blue + black gradient theme with modern card layouts
 */

const DigitalProducts: React.FC = () => {
  return (
    <div className="digital-products-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Digital Products & Services</h1>
          <p className="hero-description">
            Comprehensive digital solutions to transform your business and drive growth
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">500+</span>
              <span className="hero-stat-label">Digital Products</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">10K+</span>
              <span className="hero-stat-label">Happy Clients</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">99.9%</span>
              <span className="hero-stat-label">Uptime</span>
            </div>
          </div>
        </div>
        <div className="hero-image-placeholder">
          <div className="floating-element element-1">💻</div>
          <div className="floating-element element-2">📱</div>
          <div className="floating-element element-3">🚀</div>
          <div className="floating-element element-4">⚡</div>
        </div>
      </section>

      {/* Filter/Category Section */}
      <section className="filter-section">
        <div className="filter-wrapper">
          <button className="filter-chip active">All Products</button>
          <button className="filter-chip">Web Development</button>
          <button className="filter-chip">Mobile Apps</button>
          <button className="filter-chip">Digital Marketing</button>
          <button className="filter-chip">Cloud Solutions</button>
          <button className="filter-chip">AI & Automation</button>
          <button className="filter-chip">E-commerce</button>
        </div>
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search products..." 
            className="search-input"
          />
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="section-header">
          <h2 className="section-title">Featured Products</h2>
          <p className="section-subtitle">Our most popular and highly-rated solutions</p>
        </div>

        <div className="products-grid featured-grid">
          {/* Featured Product 1 */}
          <div className="product-card featured">
            <div className="product-badge featured-badge">⭐ Featured</div>
            <div className="product-icon large">🌐</div>
            <h3 className="product-title">Enterprise Website Development</h3>
            <p className="product-description">
              Custom-built, scalable websites with modern tech stack, responsive design, 
              and seamless user experience.
            </p>
            <div className="product-features">
              <span className="feature-tag">✓ Responsive Design</span>
              <span className="feature-tag">✓ SEO Optimized</span>
              <span className="feature-tag">✓ Fast Loading</span>
              <span className="feature-tag">✓ 24/7 Support</span>
            </div>
            <div className="product-footer">
              <div className="product-price">
                <span className="price-label">Starting at</span>
                <span className="price-value">$2,999</span>
              </div>
              <button className="btn-product">Learn More</button>
            </div>
            <div className="product-stats">
              <div className="stat-item">
                <span className="stat-icon">⭐</span>
                <span className="stat-text">4.9/5</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📦</span>
                <span className="stat-text">1.2K+ Orders</span>
              </div>
            </div>
          </div>

          {/* Featured Product 2 */}
          <div className="product-card featured">
            <div className="product-badge featured-badge">⭐ Featured</div>
            <div className="product-icon large">📱</div>
            <h3 className="product-title">Mobile App Development</h3>
            <p className="product-description">
              Native and cross-platform mobile applications for iOS and Android 
              with stunning UI/UX.
            </p>
            <div className="product-features">
              <span className="feature-tag">✓ iOS & Android</span>
              <span className="feature-tag">✓ React Native</span>
              <span className="feature-tag">✓ Push Notifications</span>
              <span className="feature-tag">✓ Analytics</span>
            </div>
            <div className="product-footer">
              <div className="product-price">
                <span className="price-label">Starting at</span>
                <span className="price-value">$4,999</span>
              </div>
              <button className="btn-product">Learn More</button>
            </div>
            <div className="product-stats">
              <div className="stat-item">
                <span className="stat-icon">⭐</span>
                <span className="stat-text">5.0/5</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📦</span>
                <span className="stat-text">850+ Orders</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Products Grid */}
      <section className="products-section">
        <div className="section-header">
          <h2 className="section-title">All Digital Products</h2>
          <div className="view-options">
            <button className="view-btn active">⊞ Grid</button>
            <button className="view-btn">☰ List</button>
          </div>
        </div>

        <div className="products-grid">
          {/* Product Card 1 */}
          <div className="product-card">
            <div className="product-badge">New</div>
            <div className="product-icon">🎯</div>
            <h3 className="product-title">Digital Marketing Suite</h3>
            <p className="product-description">
              Complete digital marketing solution including SEO, SEM, social media, 
              and content marketing.
            </p>
            <div className="product-meta">
              <span className="meta-item">📊 Analytics</span>
              <span className="meta-item">📈 Growth</span>
            </div>
            <div className="product-footer">
              <div className="product-price">
                <span className="price-value">$1,499/mo</span>
              </div>
              <button className="btn-product-small">View Details</button>
            </div>
            <div className="product-rating">
              <span>⭐⭐⭐⭐⭐</span>
              <span className="rating-count">(234)</span>
            </div>
          </div>

          {/* Product Card 2 */}
          <div className="product-card">
            <div className="product-badge hot">🔥 Hot</div>
            <div className="product-icon">☁️</div>
            <h3 className="product-title">Cloud Infrastructure</h3>
            <p className="product-description">
              Scalable cloud solutions with AWS, Azure, and Google Cloud 
              integration and management.
            </p>
            <div className="product-meta">
              <span className="meta-item">🔒 Secure</span>
              <span className="meta-item">⚡ Fast</span>
            </div>
            <div className="product-footer">
              <div className="product-price">
                <span className="price-value">$999/mo</span>
              </div>
              <button className="btn-product-small">View Details</button>
            </div>
            <div className="product-rating">
              <span>⭐⭐⭐⭐⭐</span>
              <span className="rating-count">(567)</span>
            </div>
          </div>

          {/* Product Card 3 */}
          <div className="product-card">
            <div className="product-icon">🤖</div>
            <h3 className="product-title">AI & Automation Tools</h3>
            <p className="product-description">
              Leverage artificial intelligence and automation to streamline 
              workflows and boost productivity.
            </p>
            <div className="product-meta">
              <span className="meta-item">🧠 Smart</span>
              <span className="meta-item">⚙️ Auto</span>
            </div>
            <div className="product-footer">
              <div className="product-price">
                <span className="price-value">$2,499</span>
              </div>
              <button className="btn-product-small">View Details</button>
            </div>
            <div className="product-rating">
              <span>⭐⭐⭐⭐⭐</span>
              <span className="rating-count">(189)</span>
            </div>
          </div>

          {/* Product Card 4 */}
          <div className="product-card">
            <div className="product-icon">🛒</div>
            <h3 className="product-title">E-Commerce Platform</h3>
            <p className="product-description">
              Full-featured online store with payment integration, inventory 
              management, and analytics.
            </p>
            <div className="product-meta">
              <span className="meta-item">💳 Payments</span>
              <span className="meta-item">📦 Shipping</span>
            </div>
            <div className="product-footer">
              <div className="product-price">
                <span className="price-value">$3,499</span>
              </div>
              <button className="btn-product-small">View Details</button>
            </div>
            <div className="product-rating">
              <span>⭐⭐⭐⭐⭐</span>
              <span className="rating-count">(423)</span>
            </div>
          </div>

          {/* Product Card 5 */}
          <div className="product-card">
            <div className="product-badge">Popular</div>
            <div className="product-icon">🎨</div>
            <h3 className="product-title">UI/UX Design Services</h3>
            <p className="product-description">
              Professional user interface and experience design for web and 
              mobile applications.
            </p>
            <div className="product-meta">
              <span className="meta-item">🎯 Modern</span>
              <span className="meta-item">✨ Creative</span>
            </div>
            <div className="product-footer">
              <div className="product-price">
                <span className="price-value">$1,799</span>
              </div>
              <button className="btn-product-small">View Details</button>
            </div>
            <div className="product-rating">
              <span>⭐⭐⭐⭐⭐</span>
              <span className="rating-count">(312)</span>
            </div>
          </div>

          {/* Product Card 6 */}
          <div className="product-card">
            <div className="product-icon">🔐</div>
            <h3 className="product-title">Cybersecurity Solutions</h3>
            <p className="product-description">
              Comprehensive security services including penetration testing, 
              audits, and monitoring.
            </p>
            <div className="product-meta">
              <span className="meta-item">🛡️ Protected</span>
              <span className="meta-item">🔍 Monitored</span>
            </div>
            <div className="product-footer">
              <div className="product-price">
                <span className="price-value">$2,199/mo</span>
              </div>
              <button className="btn-product-small">View Details</button>
            </div>
            <div className="product-rating">
              <span>⭐⭐⭐⭐⭐</span>
              <span className="rating-count">(178)</span>
            </div>
          </div>

          {/* Product Card 7 */}
          <div className="product-card">
            <div className="product-icon">📊</div>
            <h3 className="product-title">Data Analytics Platform</h3>
            <p className="product-description">
              Advanced analytics and business intelligence tools for data-driven 
              decision making.
            </p>
            <div className="product-meta">
              <span className="meta-item">📈 Insights</span>
              <span className="meta-item">🔍 Reports</span>
            </div>
            <div className="product-footer">
              <div className="product-price">
                <span className="price-value">$1,299/mo</span>
              </div>
              <button className="btn-product-small">View Details</button>
            </div>
            <div className="product-rating">
              <span>⭐⭐⭐⭐⭐</span>
              <span className="rating-count">(267)</span>
            </div>
          </div>

          {/* Product Card 8 */}
          <div className="product-card">
            <div className="product-badge">New</div>
            <div className="product-icon">🎥</div>
            <h3 className="product-title">Video Production Services</h3>
            <p className="product-description">
              Professional video creation, editing, and animation for marketing 
              and branding.
            </p>
            <div className="product-meta">
              <span className="meta-item">🎬 HD Quality</span>
              <span className="meta-item">✂️ Editing</span>
            </div>
            <div className="product-footer">
              <div className="product-price">
                <span className="price-value">$899</span>
              </div>
              <button className="btn-product-small">View Details</button>
            </div>
            <div className="product-rating">
              <span>⭐⭐⭐⭐⭐</span>
              <span className="rating-count">(145)</span>
            </div>
          </div>

          {/* Product Card 9 */}
          <div className="product-card">
            <div className="product-icon">📝</div>
            <h3 className="product-title">Content Management System</h3>
            <p className="product-description">
              Custom CMS solutions for easy content creation, management, 
              and publishing.
            </p>
            <div className="product-meta">
              <span className="meta-item">✍️ Easy Edit</span>
              <span className="meta-item">🚀 Fast</span>
            </div>
            <div className="product-footer">
              <div className="product-price">
                <span className="price-value">$1,899</span>
              </div>
              <button className="btn-product-small">View Details</button>
            </div>
            <div className="product-rating">
              <span>⭐⭐⭐⭐⭐</span>
              <span className="rating-count">(398)</span>
            </div>
          </div>
        </div>

        {/* Load More Button */}
        <div className="load-more-section">
          <button className="btn-load-more">
            Load More Products
            <span className="arrow-down">↓</span>
          </button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Need a Custom Solution?</h2>
          <p className="cta-description">
            Our team of experts can create tailored digital products specifically 
            for your business needs.
          </p>
          <div className="cta-buttons">
            <button className="btn-cta-primary">Get a Free Consultation</button>
            <button className="btn-cta-secondary">View Our Portfolio</button>
          </div>
        </div>
        <div className="cta-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </section>

      <style>{`
        .digital-products-container {
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1420 100%);
          min-height: 100vh;
          color: #ffffff;
          padding: 2rem;
        }

        /* Hero Section */
        .hero-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
          margin-bottom: 4rem;
          padding: 3rem 0;
        }

        .hero-content {
          z-index: 1;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .hero-description {
          font-size: 1.3rem;
          color: #cbd5e1;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .hero-stats {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .hero-stat {
          display: flex;
          flex-direction: column;
        }

        .hero-stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #ffffff;
        }

        .hero-stat-label {
          font-size: 0.95rem;
          color: #94a3b8;
        }

        .hero-image-placeholder {
          position: relative;
          height: 400px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .floating-element {
          position: absolute;
          font-size: 4rem;
          animation: float 3s ease-in-out infinite;
        }

        .element-1 {
          top: 10%;
          left: 15%;
          animation-delay: 0s;
        }

        .element-2 {
          top: 60%;
          right: 20%;
          animation-delay: 0.5s;
        }

        .element-3 {
          bottom: 20%;
          left: 25%;
          animation-delay: 1s;
        }

        .element-4 {
          top: 35%;
          right: 15%;
          animation-delay: 1.5s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        /* Filter Section */
        .filter-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }

        .filter-wrapper {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          flex: 1;
        }

        .filter-chip {
          background: rgba(100, 116, 139, 0.2);
          border: 1px solid rgba(100, 116, 139, 0.3);
          color: #cbd5e1;
          padding: 0.6rem 1.2rem;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .filter-chip.active,
        .filter-chip:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
          transform: translateY(-2px);
        }

        .search-wrapper {
          display: flex;
          align-items: center;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(100, 116, 139, 0.3);
          border-radius: 12px;
          padding: 0.6rem 1rem;
          min-width: 300px;
        }

        .search-icon {
          font-size: 1.2rem;
          margin-right: 0.5rem;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 1rem;
          outline: none;
        }

        .search-input::placeholder {
          color: #64748b;
        }

        /* Section Headers */
        .section-header {
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }

        .section-title {
          font-size: 2.2rem;
          font-weight: 700;
          color: #ffffff;
        }

        .section-subtitle {
          color: #94a3b8;
          font-size: 1.1rem;
          margin-top: 0.5rem;
        }

        .view-options {
          display: flex;
          gap: 0.5rem;
        }

        .view-btn {
          background: rgba(100, 116, 139, 0.2);
          border: 1px solid rgba(100, 116, 139, 0.3);
          color: #cbd5e1;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-btn.active,
        .view-btn:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        /* Products Grid */
        .featured-section {
          margin-bottom: 4rem;
        }

        .featured-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 2rem;
        }

        .products-section {
          margin-bottom: 4rem;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        /* Product Cards */
        .product-card {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid rgba(100, 116, 139, 0.2);
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .product-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transform: scaleX(0);
          transition: transform 0.4s ease;
        }

        .product-card:hover::before {
          transform: scaleX(1);
        }

        .product-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
          border-color: rgba(102, 126, 234, 0.5);
        }

        .product-card.featured {
          border-color: rgba(102, 126, 234, 0.4);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
        }

        .product-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .product-badge.featured-badge {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .product-badge.hot {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .product-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .product-icon.large {
          font-size: 4rem;
        }

        .product-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #ffffff;
        }

        .product-description {
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          flex: 1;
        }

        .product-features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .feature-tag {
          background: rgba(102, 126, 234, 0.2);
          color: #a5b4fc;
          padding: 0.4rem 0.8rem;
          border-radius: 15px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .product-meta {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .meta-item {
          background: rgba(100, 116, 139, 0.2);
          color: #cbd5e1;
          padding: 0.4rem 0.8rem;
          border-radius: 12px;
          font-size: 0.85rem;
        }

        .product-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid rgba(100, 116, 139, 0.2);
        }

        .product-price {
          display: flex;
          flex-direction: column;
        }

        .price-label {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        .price-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #ffffff;
        }

        .btn-product {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-product:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-product-small {
          background: rgba(102, 126, 234, 0.2);
          border: 1px solid rgba(102, 126, 234, 0.4);
          color: #a5b4fc;
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-product-small:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .product-stats {
          display: flex;
          justify-content: space-between;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(100, 116, 139, 0.2);
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #cbd5e1;
          font-size: 0.9rem;
        }

        .product-rating {
          margin-top: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #fbbf24;
        }

        .rating-count {
          color: #64748b;
          font-size: 0.9rem;
        }

        /* Load More */
        .load-more-section {
          display: flex;
          justify-content: center;
          margin-top: 3rem;
        }

        .btn-load-more {
          background: rgba(100, 116, 139, 0.2);
          border: 1px solid rgba(100, 116, 139, 0.3);
          color: #cbd5e1;
          padding: 1rem 3rem;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .btn-load-more:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
          transform: translateY(-2px);
        }

        .arrow-down {
          font-size: 1.3rem;
        }

        /* CTA Section */
        .cta-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 24px;
          padding: 4rem;
          margin: 4rem 0;
          position: relative;
          overflow: hidden;
          text-align: center;
        }

        .cta-content {
          position: relative;
          z-index: 1;
        }

        .cta-title {
          font-size: 2.8rem;
          font-weight: 800;
          margin-bottom: 1rem;
          color: #ffffff;
        }

        .cta-description {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 2rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-cta-primary {
          background: white;
          color: #667eea;
          border: none;
          padding: 1rem 2.5rem;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-cta-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .btn-cta-secondary {
          background: transparent;
          color: white;
          border: 2px solid white;
          padding: 1rem 2.5rem;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-cta-secondary:hover {
          background: white;
          color: #667eea;
          transform: translateY(-3px);
        }

        .cta-decoration {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .decoration-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
        }

        .circle-1 {
          width: 300px;
          height: 300px;
          top: -100px;
          right: -50px;
        }

        .circle-2 {
          width: 200px;
          height: 200px;
          bottom: -50px;
          left: -30px;
        }

        .circle-3 {
          width: 150px;
          height: 150px;
          top: 50%;
          left: 10%;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .hero-section {
            grid-template-columns: 1fr;
          }

          .hero-image-placeholder {
            height: 300px;
          }

          .featured-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .digital-products-container {
            padding: 1rem;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .hero-description {
            font-size: 1.1rem;
          }

          .filter-section {
            flex-direction: column;
            align-items: stretch;
          }

          .search-wrapper {
            min-width: 100%;
          }

          .products-grid {
            grid-template-columns: 1fr;
          }

          .cta-section {
            padding: 2rem;
          }

          .cta-title {
            font-size: 2rem;
          }

          .cta-buttons {
            flex-direction: column;
          }

          .btn-cta-primary,
          .btn-cta-secondary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default DigitalProducts;