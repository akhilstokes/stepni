import React, { useState } from 'react';
import './StaffIssues.css';

const StaffIssues = () => {
  const [form, setForm] = useState({ subject: '', description: '', category: 'general', priority: 'normal' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      // TODO: POST to backend endpoint like /api/requests/issues or /api/enquiries
      // await api.post('/api/requests/issues', form)
      await new Promise((r) => setTimeout(r, 600));
      setMessage('Issue submitted successfully.');
      setForm({ subject: '', description: '', category: 'general', priority: 'normal' });
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to submit issue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="staff-issues-container">
      <div className="issues-modal-wrapper">
        <div className="issues-modal">
          <div className="modal-header">
            <div className="header-content">
              <div className="header-icon">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <div className="header-text">
                <h2>Raise an Issue / Complaint</h2>
                <p>Please describe your issue. Our team will review and respond.</p>
              </div>
            </div>
          </div>

          <div className="modal-body">
            <form onSubmit={onSubmit} className="issue-form">
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-tag"></i>
                  Subject
                </label>
                <input 
                  name="subject" 
                  value={form.subject} 
                  onChange={onChange} 
                  required 
                  className="form-input"
                  placeholder="Enter issue subject..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-list"></i>
                  Category
                </label>
                <select name="category" value={form.category} onChange={onChange} className="form-select">
                  <option value="general">General</option>
                  <option value="salary">Salary</option>
                  <option value="schedule">Schedule</option>
                  <option value="safety">Safety</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-exclamation"></i>
                  Priority
                </label>
                <select name="priority" value={form.priority} onChange={onChange} className="form-select">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-align-left"></i>
                  Description
                </label>
                <textarea 
                  name="description" 
                  value={form.description} 
                  onChange={onChange} 
                  rows={5} 
                  required 
                  className="form-textarea"
                  placeholder="Describe your issue in detail..."
                />
              </div>

              <div className="form-actions">
                <button className="submit-btn" type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Submit Issue
                    </>
                  )}
                </button>
              </div>

              {message && (
                <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
                  <i className={`fas ${message.includes('successfully') ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                  {message}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffIssues;