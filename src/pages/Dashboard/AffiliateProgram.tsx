import React from 'react';

/**
 * Dashboard - Affiliate Program Page
 * Modern dark blue + black gradient theme
 * Responsive design with cards, stats, and referral tracking
 */

const AffiliateProgram: React.FC = () => {
  return (
    <div className="affiliate-program-container">
      {/* Header Section */}
      <header className="page-header">
        <div className="header-content">
          <h1 className="page-title">Affiliate Program</h1>
          <p className="page-subtitle">Earn rewards by referring clients to DigiLinex</p>
        </div>
        <button className="btn-primary">
          <span className="icon">📋</span>
          Copy Referral Link
        </button>
      </header>

      {/* Stats Overview */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <span className="stat-icon">👥</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Referrals</p>
            <h3 className="stat-value">248</h3>
            <span className="stat-change positive">+12.5% this month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <span className="stat-icon">💰</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Earnings</p>
            <h3 className="stat-value">$12,450</h3>
            <span className="stat-change positive">+8.3% this month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <span className="stat-icon">✓</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">Active Referrals</p>
            <h3 className="stat-value">89</h3>
            <span className="stat-change neutral">No change</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <span className="stat-icon">⏳</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">Pending Commission</p>
            <h3 className="stat-value">$1,850</h3>
            <span className="stat-change positive">+15.2% this month</span>
          </div>
        </div>
      </section>

      {/* Referral Link Section */}
      <section className="referral-section">
        <div className="referral-card">
          <div className="referral-header">
            <h2 className="section-title">Your Referral Link</h2>
            <p className="section-description">Share this link with potential clients</p>
          </div>
          <div className="referral-link-wrapper">
            <div className="link-display">
              <span className="link-icon">🔗</span>
              <input 
                type="text" 
                value="https://digilinex.com/ref/DL-USER-12345" 
                readOnly 
                className="link-input"
              />
            </div>
            <button className="btn-copy">
              <span>📋</span>
              Copy
            </button>
          </div>
          <div className="share-options">
            <button className="share-btn email">
              <span>✉️</span> Email
            </button>
            <button className="share-btn whatsapp">
              <span>💬</span> WhatsApp
            </button>
            <button className="share-btn linkedin">
              <span>💼</span> LinkedIn
            </button>
            <button className="share-btn twitter">
              <span>🐦</span> Twitter
            </button>
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="commission-section">
        <h2 className="section-title">Commission Structure</h2>
        <div className="commission-grid">
          <div className="commission-card tier-1">
            <div className="tier-badge">Tier 1</div>
            <h3 className="tier-title">Bronze</h3>
            <div className="tier-percentage">10%</div>
            <p className="tier-description">0-10 referrals</p>
            <ul className="tier-benefits">
              <li>✓ 10% commission per sale</li>
              <li>✓ Monthly payouts</li>
              <li>✓ Basic analytics</li>
            </ul>
          </div>

          <div className="commission-card tier-2 featured">
            <div className="tier-badge">Tier 2</div>
            <h3 className="tier-title">Silver</h3>
            <div className="tier-percentage">15%</div>
            <p className="tier-description">11-50 referrals</p>
            <ul className="tier-benefits">
              <li>✓ 15% commission per sale</li>
              <li>✓ Bi-weekly payouts</li>
              <li>✓ Advanced analytics</li>
              <li>✓ Priority support</li>
            </ul>
          </div>

          <div className="commission-card tier-3">
            <div className="tier-badge">Tier 3</div>
            <h3 className="tier-title">Gold</h3>
            <div className="tier-percentage">20%</div>
            <p className="tier-description">51+ referrals</p>
            <ul className="tier-benefits">
              <li>✓ 20% commission per sale</li>
              <li>✓ Weekly payouts</li>
              <li>✓ Premium analytics</li>
              <li>✓ Dedicated manager</li>
              <li>✓ Bonus incentives</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Recent Referrals Table */}
      <section className="referrals-table-section">
        <div className="table-header">
          <h2 className="section-title">Recent Referrals</h2>
          <button className="btn-secondary">View All</button>
        </div>
        <div className="table-wrapper">
          <table className="referrals-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Referral Name</th>
                <th>Service</th>
                <th>Status</th>
                <th>Commission</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Oct 15, 2025</td>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">JD</div>
                    <span>John Doe</span>
                  </div>
                </td>
                <td>Website Development</td>
                <td><span className="status-badge completed">Completed</span></td>
                <td className="amount">$250.00</td>
                <td>
                  <button className="btn-icon">👁️</button>
                </td>
              </tr>
              <tr>
                <td>Oct 14, 2025</td>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">SM</div>
                    <span>Sarah Miller</span>
                  </div>
                </td>
                <td>Digital Marketing</td>
                <td><span className="status-badge pending">Pending</span></td>
                <td className="amount">$180.00</td>
                <td>
                  <button className="btn-icon">👁️</button>
                </td>
              </tr>
              <tr>
                <td>Oct 12, 2025</td>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">MJ</div>
                    <span>Mike Johnson</span>
                  </div>
                </td>
                <td>SEO Services</td>
                <td><span className="status-badge completed">Completed</span></td>
                <td className="amount">$320.00</td>
                <td>
                  <button className="btn-icon">👁️</button>
                </td>
              </tr>
              <tr>
                <td>Oct 10, 2025</td>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">EB</div>
                    <span>Emily Brown</span>
                  </div>
                </td>
                <td>Mobile App</td>
                <td><span className="status-badge active">Active</span></td>
                <td className="amount">$450.00</td>
                <td>
                  <button className="btn-icon">👁️</button>
                </td>
              </tr>
              <tr>
                <td>Oct 08, 2025</td>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">DW</div>
                    <span>David Wilson</span>
                  </div>
                </td>
                <td>Cloud Solutions</td>
                <td><span className="status-badge rejected">Rejected</span></td>
                <td className="amount">$0.00</td>
                <td>
                  <button className="btn-icon">👁️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Performance Chart Placeholder */}
      <section className="chart-section">
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="section-title">Performance Overview</h2>
            <div className="chart-filters">
              <button className="filter-btn active">7 Days</button>
              <button className="filter-btn">30 Days</button>
              <button className="filter-btn">90 Days</button>
              <button className="filter-btn">1 Year</button>
            </div>
          </div>
          <div className="chart-placeholder">
            <div className="chart-bars">
              <div className="bar" style={{height: '60%'}}></div>
              <div className="bar" style={{height: '80%'}}></div>
              <div className="bar" style={{height: '45%'}}></div>
              <div className="bar" style={{height: '90%'}}></div>
              <div className="bar" style={{height: '70%'}}></div>
              <div className="bar" style={{height: '85%'}}></div>
              <div className="bar" style={{height: '95%'}}></div>
            </div>
            <p className="chart-label">Referrals & Earnings Trend</p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .affiliate-program-container {
          padding: 2rem;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1420 100%);
          min-height: 100vh;
          color: #ffffff;
        }

        /* Header */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-content h1 {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .page-subtitle {
          color: #a0aec0;
          font-size: 1.1rem;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          border: 1px solid rgba(100, 116, 139, 0.2);
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
          border-color: rgba(102, 126, 234, 0.5);
        }

        .stat-icon-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
        }

        .stat-icon-wrapper.blue {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .stat-icon-wrapper.purple {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .stat-icon-wrapper.green {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .stat-icon-wrapper.orange {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          color: #94a3b8;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.3rem;
          color: #ffffff;
        }

        .stat-change {
          font-size: 0.85rem;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          display: inline-block;
        }

        .stat-change.positive {
          background: rgba(34, 197, 94, 0.2);
          color: #4ade80;
        }

        .stat-change.neutral {
          background: rgba(148, 163, 184, 0.2);
          color: #94a3b8;
        }

        /* Referral Section */
        .referral-section {
          margin-bottom: 2.5rem;
        }

        .referral-card {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(100, 116, 139, 0.2);
        }

        .referral-header {
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-size: 1.8rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #ffffff;
        }

        .section-description {
          color: #94a3b8;
          font-size: 1rem;
        }

        .referral-link-wrapper {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .link-display {
          flex: 1;
          display: flex;
          align-items: center;
          background: rgba(15, 23, 42, 0.8);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          border: 1px solid rgba(100, 116, 139, 0.3);
          min-width: 300px;
        }

        .link-icon {
          font-size: 1.5rem;
          margin-right: 0.75rem;
        }

        .link-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 1rem;
          outline: none;
        }

        .btn-copy {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-copy:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
        }

        .share-options {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .share-btn {
          flex: 1;
          min-width: 120px;
          background: rgba(100, 116, 139, 0.2);
          border: 1px solid rgba(100, 116, 139, 0.3);
          color: #ffffff;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .share-btn:hover {
          background: rgba(102, 126, 234, 0.3);
          border-color: rgba(102, 126, 234, 0.5);
          transform: translateY(-2px);
        }

        /* Commission Section */
        .commission-section {
          margin-bottom: 2.5rem;
        }

        .commission-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .commission-card {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(100, 116, 139, 0.2);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .commission-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }

        .commission-card.featured {
          border-color: rgba(102, 126, 234, 0.5);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
          transform: scale(1.05);
        }

        .commission-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
        }

        .tier-badge {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .tier-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #ffffff;
        }

        .tier-percentage {
          font-size: 3rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .tier-description {
          color: #94a3b8;
          margin-bottom: 1.5rem;
          font-size: 1rem;
        }

        .tier-benefits {
          list-style: none;
          padding: 0;
        }

        .tier-benefits li {
          padding: 0.5rem 0;
          color: #cbd5e1;
          font-size: 0.95rem;
        }

        /* Table Section */
        .referrals-table-section {
          margin-bottom: 2.5rem;
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .btn-secondary {
          background: rgba(100, 116, 139, 0.2);
          border: 1px solid rgba(100, 116, 139, 0.3);
          color: #ffffff;
          padding: 0.65rem 1.5rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .btn-secondary:hover {
          background: rgba(102, 126, 234, 0.3);
          border-color: rgba(102, 126, 234, 0.5);
        }

        .table-wrapper {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(100, 116, 139, 0.2);
          overflow-x: auto;
        }

        .referrals-table {
          width: 100%;
          border-collapse: collapse;
        }

        .referrals-table thead th {
          text-align: left;
          padding: 1rem;
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.9rem;
          border-bottom: 1px solid rgba(100, 116, 139, 0.2);
        }

        .referrals-table tbody tr {
          border-bottom: 1px solid rgba(100, 116, 139, 0.1);
          transition: all 0.3s ease;
        }

        .referrals-table tbody tr:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .referrals-table tbody td {
          padding: 1rem;
          color: #cbd5e1;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .status-badge {
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .status-badge.completed {
          background: rgba(34, 197, 94, 0.2);
          color: #4ade80;
        }

        .status-badge.pending {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .status-badge.active {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
        }

        .status-badge.rejected {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        .amount {
          font-weight: 600;
          color: #4ade80;
        }

        .btn-icon {
          background: transparent;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-icon:hover {
          transform: scale(1.2);
        }

        /* Chart Section */
        .chart-section {
          margin-bottom: 2.5rem;
        }

        .chart-card {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(100, 116, 139, 0.2);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .chart-filters {
          display: flex;
          gap: 0.5rem;
        }

        .filter-btn {
          background: rgba(100, 116, 139, 0.2);
          border: 1px solid rgba(100, 116, 139, 0.3);
          color: #cbd5e1;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .filter-btn.active,
        .filter-btn:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .chart-placeholder {
          height: 300px;
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          background: rgba(15, 23, 42, 0.5);
          border-radius: 12px;
          padding: 2rem;
          position: relative;
        }

        .chart-bars {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          width: 100%;
          height: 100%;
          gap: 1rem;
        }

        .bar {
          flex: 1;
          background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px 8px 0 0;
          min-height: 20px;
          transition: all 0.3s ease;
        }

        .bar:hover {
          background: linear-gradient(180deg, #764ba2 0%, #667eea 100%);
          transform: scaleY(1.05);
        }

        .chart-label {
          position: absolute;
          bottom: 0.5rem;
          left: 50%;
          transform: translateX(-50%);
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .affiliate-program-container {
            padding: 1rem;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-content h1 {
            font-size: 2rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .commission-grid {
            grid-template-columns: 1fr;
          }

          .commission-card.featured {
            transform: scale(1);
          }

          .referral-link-wrapper {
            flex-direction: column;
          }

          .table-wrapper {
            overflow-x: scroll;
          }

          .chart-filters {
            width: 100%;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default AffiliateProgram;