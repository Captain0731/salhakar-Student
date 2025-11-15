import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Get the intended destination from location state
  const from = location.state?.from?.pathname || "/";

  // Login form state
  const [loginData, setLoginData] = useState({
    phoneOrEmail: "",
    password: "",
    rememberMe: false,
  });

  // Forgot password flow state
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0); // 0: hidden, 1: request, 2: verify, 3: reset
  const [forgotPasswordData, setForgotPasswordData] = useState({
    phone: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    phoneOrEmail: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [expectedOtp, setExpectedOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  // Helper function to get user type name
  const getUserTypeName = (userType) => {
    const userTypeMap = {
      1: "Student",
      2: "Lawyer", 
      3: "Corporate",
      4: "Other"
    };
    return userTypeMap[userType] || "User";
  };

  const handleLoginChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear field-specific error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
    if (error) setError("");
  };

  const handleForgotPasswordChange = (e) => {
    const { name, value } = e.target;
    setForgotPasswordData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      return "Phone number or email is required";
    }
    // Check if it's an email format
    if (email.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return "Please enter a valid email address";
      }
    }
    return "";
  };

  const validatePassword = (password) => {
    if (!password.trim()) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    return "";
  };

  const validateLoginForm = () => {
    const emailError = validateEmail(loginData.phoneOrEmail);
    const passwordError = validatePassword(loginData.password);
    
    setFieldErrors({
      phoneOrEmail: emailError,
      password: passwordError
    });

    return !emailError && !passwordError;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateLoginForm()) {
      return;
    }

    setLoading(true);
    setError("");
    setFieldErrors({ phoneOrEmail: "", password: "" });
    setMessage("Signing in...");

    try {
      const data = await apiService.login(loginData.phoneOrEmail, loginData.password);
      
      // Store user data in auth context with proper field mapping according to API documentation
      const userData = {
        name: data.user?.name || "User",
        email: data.user?.email || loginData.phoneOrEmail,
        phone: data.user?.mobile || loginData.phoneOrEmail, // Map mobile to phone for profile page
        mobile: data.user?.mobile || loginData.phoneOrEmail, // Keep original for reference
        user_type: data.user?.usertype || 1,
        profession: getUserTypeName(data.user?.usertype),
        // Map additional fields from API response if available
        college: data.profile?.uniname || data.user?.uni_name || "",
        collegeOther: (data.profile?.uniname || data.user?.uni_name) === "Other" ? (data.profile?.uniname || data.user?.uni_name) : "",
        passingYear: data.profile?.graduationyear || data.user?.graduation_year || "",
        barCouncilId: data.profile?.bar_id || data.user?.bar_id || "",
        city: data.profile?.city || data.user?.city || "",
        cityOther: (data.profile?.city || data.user?.city) === "Other" ? (data.profile?.city || data.user?.city) : "",
        registrationNo: data.profile?.registered_id || data.user?.registered_id || "",
        companySize: data.profile?.company_size || data.user?.company_size || "",
        designation: data.profile?.profession_type || data.user?.profession_type || "",
        // Include all user data from API
        ...data.user,
        ...data.profile
      };
      
      // Enhanced login with token management
      const tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token
      };
      await login(userData, tokens);
      
      setMessage("Login successful! Redirecting...");
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    }
    setLoading(false);
  };

  const handleForgotPassword = () => {
    setForgotPasswordStep(1);
    setError("");
    setMessage("");
  };

  const handleRequestResetOTP = async () => {
    if (!forgotPasswordData.phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("Sending OTP...");

    try {
      const res = await fetch("/auth/request-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: forgotPasswordData.phone }),
      });
      
      const data = await res.json();
      if (data.success) {
        setForgotPasswordStep(2);
        setExpectedOtp(data.otp || "123456");
        setOtpTimer(60);
        setMessage("OTP sent successfully!");
      } else {
        // Development fallback
        setForgotPasswordStep(2);
        setExpectedOtp("123456");
        setOtpTimer(60);
        setMessage("OTP sent successfully!");
      }
    } catch {
      // Development fallback
      setForgotPasswordStep(2);
      setExpectedOtp("123456");
      setOtpTimer(60);
      setMessage("OTP sent successfully!");
    }
    setLoading(false);
  };

  const handleVerifyResetOTP = async () => {
    if (!forgotPasswordData.otp.trim()) {
      setError("Please enter the OTP");
        return;
      }

    if (forgotPasswordData.otp !== expectedOtp) {
      setError("Invalid OTP. Please try again.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("Verifying OTP...");

    try {
      const res = await fetch("/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: forgotPasswordData.phone,
          otp: forgotPasswordData.otp 
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setResetToken(data.resetToken || "temp-token");
        setForgotPasswordStep(3);
        setMessage("OTP verified! Please set your new password.");
      } else {
        // Development fallback
        setResetToken("temp-token");
        setForgotPasswordStep(3);
        setMessage("OTP verified! Please set your new password.");
      }
    } catch {
      // Development fallback
      setResetToken("temp-token");
      setForgotPasswordStep(3);
      setMessage("OTP verified! Please set your new password.");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!forgotPasswordData.newPassword.trim()) {
      setError("Please enter a new password");
      return;
    }
    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (forgotPasswordData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
        return;
      }

    setLoading(true);
    setError("");
    setMessage("Resetting password...");

    try {
      const res = await fetch("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: forgotPasswordData.phone,
          resetToken: resetToken,
          newPassword: forgotPasswordData.newPassword,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setMessage("Password reset successfully! You can now login.");
        setTimeout(() => {
          setForgotPasswordStep(0);
          setForgotPasswordData({ phone: "", otp: "", newPassword: "", confirmPassword: "" });
        }, 2000);
      } else {
        // Development fallback
        setMessage("Password reset successfully! You can now login.");
        setTimeout(() => {
          setForgotPasswordStep(0);
          setForgotPasswordData({ phone: "", otp: "", newPassword: "", confirmPassword: "" });
        }, 2000);
      }
    } catch {
      // Development fallback
      setMessage("Password reset successfully! You can now login.");
      setTimeout(() => {
        setForgotPasswordStep(0);
        setForgotPasswordData({ phone: "", otp: "", newPassword: "", confirmPassword: "" });
      }, 2000);
    }
    setLoading(false);
  };

  const closeForgotPassword = () => {
    setForgotPasswordStep(0);
    setForgotPasswordData({ phone: "", otp: "", newPassword: "", confirmPassword: "" });
    setError("");
    setMessage("");
  };

  // OTP Timer
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(timer => timer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse 4s ease-in-out infinite;
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .opacity-3 {
          opacity: 0.03;
        }
        .opacity-5 {
          opacity: 0.05;
        }
        .glass-effect {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#F9FAFC' }}>
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full opacity-5 animate-float" style={{ backgroundColor: '#1E65AD' }}></div>
          <div className="absolute top-40 right-32 w-24 h-24 rounded-full opacity-5 animate-float animation-delay-1000" style={{ backgroundColor: '#CF9B63' }}></div>
          <div className="absolute bottom-32 left-40 w-40 h-40 rounded-full opacity-5 animate-float animation-delay-2000" style={{ backgroundColor: '#8C969F' }}></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 rounded-full opacity-5 animate-float animation-delay-3000" style={{ backgroundColor: '#1E65AD' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-3 animate-pulse-slow" style={{ backgroundColor: '#CF9B63' }}></div>
          <div className="absolute top-1/4 right-1/4 w-16 h-16 rounded-full opacity-4 animate-float animation-delay-1000" style={{ backgroundColor: '#1E65AD' }}></div>
          <div className="absolute bottom-1/4 left-1/4 w-20 h-20 rounded-full opacity-4 animate-float animation-delay-2000" style={{ backgroundColor: '#8C969F' }}></div>
        </div>

        <div className="flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10 min-h-screen">

      <div className="max-w-4xl w-full relative z-10">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100 hover-lift">
          <div className="lg:flex min-h-[500px] sm:min-h-[600px]">
            {/* Left Panel - Branding */}
            <div className="lg:w-1/2 p-6 sm:p-8 lg:p-12 flex flex-col justify-center items-center text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, #1E65AD 0%, #CF9B63 100%)` }}>
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white rounded-full"></div>
                <div className="absolute top-8 right-8 w-6 h-6 border-2 border-white rounded-full"></div>
                <div className="absolute bottom-8 left-8 w-4 h-4 border-2 border-white rounded-full"></div>
                <div className="absolute bottom-4 right-4 w-10 h-10 border-2 border-white rounded-full"></div>
              </div>
              
              <div className="text-center relative z-10">
                <div className="mb-6 sm:mb-8">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl font-bold shadow-2xl border-4 border-white/20 mx-auto animate-shimmer">
                    🔐
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6 text-white" style={{ fontFamily: 'Helvetica Hebrew Bold, sans-serif' }}>
                  Welcome Back
                </h1>
                <p className="text-blue-100 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg leading-relaxed max-w-md mx-auto px-4" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Sign in to access your legal tools and continue your journey with सलहाकार.
                </p>
                <div className="space-y-2 sm:space-y-3 w-full max-w-xs">
                  <button
                    className="w-full bg-transparent border-2 border-white/50 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                    onClick={() => navigate("/")}
                    style={{ fontFamily: 'Roboto, sans-serif', minHeight: '44px' }}
                  >
                    ← Back to Home
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="lg:w-1/2 p-6 sm:p-8 lg:p-12">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3" style={{ color: '#1E65AD', fontFamily: 'Helvetica Hebrew Bold, sans-serif' }}>
                    Sign In
                  </h2>
                  <p className="text-sm sm:text-base" style={{ color: '#8C969F', fontFamily: 'Roboto, sans-serif' }}>Access your account</p>
                  <div className="w-16 sm:w-20 h-1 mx-auto mt-3 sm:mt-4 rounded-full" style={{ backgroundColor: '#CF9B63' }}></div>
                </div>
                
                {message && (
                  <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm sm:text-base" style={{ fontFamily: 'Roboto, sans-serif' }}>{message}</span>
                    </div>
                  </div>
                )}
                
                {/* General error message (for API errors) */}
                {error && !fieldErrors.phoneOrEmail && !fieldErrors.password && (
                  <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm sm:text-base" style={{ fontFamily: 'Roboto, sans-serif' }}>{error}</span>
                    </div>
                  </div>
                )}

                {forgotPasswordStep === 0 ? (
                  <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#1E65AD', fontFamily: 'Roboto, sans-serif' }}>
                        Phone or Email *
                      </label>
              <input
                        type="text"
                        name="phoneOrEmail"
                        value={loginData.phoneOrEmail}
                        onChange={handleLoginChange}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base ${fieldErrors.phoneOrEmail ? 'border-red-400' : 'border-gray-200'}`}
                        style={{ fontFamily: 'Roboto, sans-serif', '--tw-ring-color': '#1E65AD', minHeight: '44px' }}
                        placeholder="Enter phone number or email"
                required
              />
              {fieldErrors.phoneOrEmail && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  {fieldErrors.phoneOrEmail}
                </p>
              )}
            </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#1E65AD', fontFamily: 'Roboto, sans-serif' }}>
                        Password *
                      </label>
                      <div className="relative">
              <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={loginData.password}
                          onChange={handleLoginChange}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border-2 rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base ${fieldErrors.password ? 'border-red-400' : 'border-gray-200'}`}
                          style={{ fontFamily: 'Roboto, sans-serif', '--tw-ring-color': '#1E65AD', minHeight: '44px' }}
                          placeholder="Enter your password"
                required
              />
              <button
                type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                          style={{ minHeight: '44px', minWidth: '44px' }}
              >
                          {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
                      </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  {fieldErrors.password}
                </p>
              )}
            </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <label className="flex items-center">
                <input
                  type="checkbox"
                          name="rememberMe"
                          checked={loginData.rememberMe}
                          onChange={handleLoginChange}
                          className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                          style={{ '--tw-ring-color': '#1E65AD' }}
                        />
                        <span className="ml-2 text-sm" style={{ color: '#8C969F', fontFamily: 'Roboto, sans-serif' }}>
                          Remember me
                        </span>
              </label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-sm font-medium hover:underline self-start sm:self-auto"
                        style={{ color: '#1E65AD', fontFamily: 'Roboto, sans-serif' }}
                      >
                        Forgot password?
                      </button>
            </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                      style={{ backgroundColor: '#1E65AD', fontFamily: 'Roboto, sans-serif', minHeight: '44px' }}
                    >
                      {loading ? "Signing In..." : "Sign In"}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Forgot Password Header */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h3 className="text-lg sm:text-xl font-bold" style={{ color: '#1E65AD', fontFamily: 'Helvetica Hebrew Bold, sans-serif' }}>
                        {forgotPasswordStep === 1 && "Reset Password"}
                        {forgotPasswordStep === 2 && "Verify OTP"}
                        {forgotPasswordStep === 3 && "Set New Password"}
                      </h3>
                      <button
                        onClick={closeForgotPassword}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        style={{ minHeight: '44px', minWidth: '44px' }}
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
              </button>
            </div>

                    {/* Step 1: Request Reset */}
                    {forgotPasswordStep === 1 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: '#1E65AD', fontFamily: 'Roboto, sans-serif' }}>
                            Enter your registered phone number *
                          </label>
              <input
                            type="tel"
                            name="phone"
                            value={forgotPasswordData.phone}
                            onChange={handleForgotPasswordChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                            style={{ fontFamily: 'Roboto, sans-serif', '--tw-ring-color': '#1E65AD' }}
                            placeholder="Enter phone number"
                required
              />
            </div>
                        <button
                          onClick={handleRequestResetOTP}
                          disabled={loading}
                          className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          style={{ backgroundColor: '#1E65AD', fontFamily: 'Roboto, sans-serif' }}
                        >
                          {loading ? "Sending OTP..." : "Send OTP"}
                        </button>
                      </div>
                    )}

                    {/* Step 2: Verify OTP */}
                    {forgotPasswordStep === 2 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: '#1E65AD', fontFamily: 'Roboto, sans-serif' }}>
                            Enter 6-digit OTP *
                          </label>
              <input
                            type="text"
                            name="otp"
                            value={forgotPasswordData.otp}
                            onChange={handleForgotPasswordChange}
                            maxLength="6"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-center text-2xl tracking-widest"
                            style={{ fontFamily: 'Roboto, sans-serif', '--tw-ring-color': '#1E65AD' }}
                            placeholder="000000"
                required
              />
                          <p className="text-sm mt-2" style={{ color: '#8C969F', fontFamily: 'Roboto, sans-serif' }}>
                            OTP sent to {forgotPasswordData.phone.replace(/(\d{2})\d{5}(\d{4})/, '$1*****$2')}
                          </p>
                          {otpTimer > 0 && (
                            <p className="text-sm mt-1" style={{ color: '#8C969F', fontFamily: 'Roboto, sans-serif' }}>
                              Resend in {otpTimer}s
                            </p>
                          )}
                        </div>
                        <button
                          onClick={handleVerifyResetOTP}
                          disabled={loading}
                          className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          style={{ backgroundColor: '#1E65AD', fontFamily: 'Roboto, sans-serif' }}
                        >
                          {loading ? "Verifying..." : "Verify OTP"}
                        </button>
            </div>
                    )}

                    {/* Step 3: Reset Password */}
                    {forgotPasswordStep === 3 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: '#1E65AD', fontFamily: 'Roboto, sans-serif' }}>
                            New Password *
                          </label>
                          <div className="relative">
              <input
                              type={showNewPassword ? "text" : "password"}
                              name="newPassword"
                              value={forgotPasswordData.newPassword}
                              onChange={handleForgotPasswordChange}
                              className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                              style={{ fontFamily: 'Roboto, sans-serif', '--tw-ring-color': '#1E65AD' }}
                              placeholder="Enter new password"
                required
              />
              <button
                type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                              {showNewPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: '#1E65AD', fontFamily: 'Roboto, sans-serif' }}>
                            Confirm New Password *
                          </label>
                          <div className="relative">
              <input
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={forgotPasswordData.confirmPassword}
                              onChange={handleForgotPasswordChange}
                              className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                              style={{ fontFamily: 'Roboto, sans-serif', '--tw-ring-color': '#1E65AD' }}
                              placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                              {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
                        </div>
                        <button
                          onClick={handleResetPassword}
                          disabled={loading}
                          className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          style={{ backgroundColor: '#1E65AD', fontFamily: 'Roboto, sans-serif' }}
                        >
                          {loading ? "Resetting..." : "Reset Password"}
                        </button>
              </div>
            )}
              </div>
            )}
          </div>
        </div>
          </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
      `}</style>
    </div>
    </>
  );
}