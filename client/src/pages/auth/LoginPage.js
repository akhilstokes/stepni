import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { validators, validateField, commonValidationRules } from '../../utils/validation';
import './AuthStyles.css';

import './ButtonFix.css';



const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const navigate = useNavigate();
    const location = useLocation();
    const { login, googleSignIn } = useAuth();

    const returnTo = location.state?.from || null;

    
    // Check if coming from registration
    React.useEffect(() => {
        if (location.state?.registrationSuccess) {
            setSuccessMessage('✅ Registration successful! Please login with your credentials.');
            // Pre-fill email if provided
            if (location.state?.email) {
                setFormData(prev => ({ ...prev, email: location.state.email }));
            }
        }
    }, [location.state]);

    // Auto-clear email field on component mount
    React.useEffect(() => {
        setFormData(prev => ({ ...prev, email: '' }));
    }, []);



    const { email, password } = formData;

    const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

    const validateForm = () => {
        const emailError = validateField(email, commonValidationRules.login.email, 'Email');
        const passwordError = validateField(password, commonValidationRules.login.password, 'Password');
        
        setFieldErrors({
            email: emailError || '',
            password: passwordError || ''
        });

        return !emailError && !passwordError;
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        let error = '';
        
        if (name === 'email') {
            error = validateField(value, commonValidationRules.login.email, 'Email');
        } else if (name === 'password') {
            error = validateField(value, commonValidationRules.login.password, 'Password');
        }
        
        setFieldErrors(prev => ({
            ...prev,
            [name]: error || ''
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        

        // Clear error and success message when user starts typing

        // Clear error when user starts typing

        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        if (successMessage) {
            setSuccessMessage('');
        }


    };
    
    const navigatePostLogin = (loggedInUser) => {
        // If LAB user, prefer lab dashboard; only honor returnTo if it's also a lab route
        if (loggedInUser && loggedInUser.role === 'lab') {
            if (returnTo && String(returnTo).startsWith('/lab')) {
                navigate(returnTo, { replace: true });
            } else {
                navigate('/lab/dashboard', { replace: true });
            }
            return;
        }
        // Accountant users go to accountant module by default
        if (loggedInUser && loggedInUser.role === 'accountant') {
            navigate('/accountant', { replace: true });
            return;
        }
        if (returnTo) {
            navigate(returnTo, { replace: true });
            return;
        }
        // Redirect by role
        if (loggedInUser && loggedInUser.role === 'admin') {
            navigate('/admin/home', { replace: true });
        } else if (loggedInUser && loggedInUser.role === 'manager') {
            navigate('/manager/home', { replace: true });
        } else if (loggedInUser && loggedInUser.role === 'delivery_staff') {
            navigate('/delivery', { replace: true });
        } else if (loggedInUser && loggedInUser.role === 'field_staff') {
            navigate('/staff', { replace: true });
        } else {
            navigate('/user', { replace: true });
        }
    };

    const handleGoogleSignInSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            setError('');
            
            if (!credentialResponse?.credential) {
                throw new Error('No credential received from Google');
            }
            
            const res = await googleSignIn(credentialResponse.credential);
            navigatePostLogin(res?.user);
        } catch (err) {
            console.error('Google Sign-In Error:', err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Google Sign-In failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                setLoading(true);
                setError('');
                
                const res = await login(email, password);
                navigatePostLogin(res.user);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'An error occurred during login.');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="modern-auth-wrapper">
            <div className="auth-container">
                {/* Background Elements */}
                <div className="bg-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                </div>

                {/* Main Content */}
                <div className="auth-card">
                    {/* Header */}
                    <div className="auth-header">
                        <div className="logo-section">
                            <div className="logo-icon">
                                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                    <rect width="40" height="40" rx="12" fill="url(#logoGradient)"/>
                                    <path d="M12 20L18 14L28 24L22 30L12 20Z" fill="white" fillOpacity="0.9"/>
                                    <defs>
                                        <linearGradient id="logoGradient" x1="0" y1="0" x2="40" y2="40">
                                            <stop stopColor="#10B981"/>
                                            <stop offset="1" stopColor="#059669"/>
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                            <div className="logo-text">
                                <h1>Holy Family Polymers</h1>
                                <p>Smart Manufacturing Solutions</p>
                            </div>
                        </div>
                        
                        <Link to="/" className="back-home">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Home
                        </Link>
                    </div>

                    {/* Welcome Section */}
                    <div className="welcome-section">
                        <h2>Welcome Back</h2>
                        <p>Sign in to access your dashboard and manage operations</p>
                    </div>

                    {/* Messages */}
                    {successMessage && (
                        <div className="alert alert-success">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {successMessage}
                        </div>
                    )}
                    
                    {error && (
                        <div className="alert alert-error">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={onSubmit} className="auth-form">
                        <div className={`form-field ${fieldErrors.email ? 'error' : ''} ${email && !fieldErrors.email ? 'valid' : ''}`}>
                            <label htmlFor="email">Email Address</label>
                            <input 
                                id="email"
                                type="email" 
                                name="email" 
                                value={email} 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Enter your email"
                                required 
                            />
                            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                            {email && !fieldErrors.email && (
                                <span className="field-success">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </span>
                            )}
                        </div>
                        
                        <div className={`form-field ${fieldErrors.password ? 'error' : ''} ${password && !fieldErrors.password ? 'valid' : ''}`}>
                            <label htmlFor="password">Password</label>
                            <input 
                                id="password"
                                type="password"
                                name="password" 
                                value={password} 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Enter your password"
                                required
                            />
                            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                            {password && password.length >= 6 && !fieldErrors.password && (
                                <span className="field-success">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </span>
                            )}
                        </div>
                        
                        <button className="btn-primary" type="submit" disabled={loading}>
                            {loading && <div className="spinner"></div>}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="divider">
                        <span>or continue with</span>
                    </div>

                    {/* Google Login */}
                    <div className="google-login-container">
                        <GoogleLogin
                            onSuccess={handleGoogleSignInSuccess}
                            onError={() => setError('Google Sign-In failed. Please try again.')}
                            disabled={loading}
                            theme="outline"
                            size="large"
                            width="100%"
                        />
                    </div>

                    {/* Footer Links */}
                    <div className="auth-footer">
                        <Link to="/forgot-password" className="link-secondary">
                            Forgot your password?
                        </Link>
                        <div className="signup-prompt">
                            Don't have an account? 
                            <Link to="/register" state={returnTo ? { from: returnTo } : undefined} className="link-primary">
                                Create Account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
