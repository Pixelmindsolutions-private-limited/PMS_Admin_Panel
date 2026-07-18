import React, { useState, useEffect } from 'react';
import { MdEmail, MdArrowBack } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  // Load saved email from localStorage on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail,
        rememberMe: true
      }));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email) return;
    setLoading(true);
    try {
      const response = await fetch('https://pmsbackend.pixelmindsolutions.com/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send OTP. Please try again.');
      setShowOtpModal(true);
      setTimeout(() => { document.getElementById('otp-0')?.focus(); }, 100);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) { setOtpError('Please enter complete 6-digit OTP'); return; }
    setOtpLoading(true);
    setOtpError('');
    try {
      const response = await fetch('https://pmsbackend.pixelmindsolutions.com/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: otpString }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Invalid OTP. Please try again.');
      
      // Save to sessionStorage
      sessionStorage.setItem('loginDetails', JSON.stringify({
        email: data.data.email,
        adminId: data.data.id || null,
        adminName: data.data.name || null,
        token: data.data.token || null,
      }));

      // Save email to localStorage if remember me is checked
      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      console.log("Login Successful:", data);
      onLogin();
      navigate('/dashboard');
    } catch (err) {
      setOtpError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setOtpError('');
    try {
      const response = await fetch('https://pmsbackend.pixelmindsolutions.com/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to resend OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => { document.getElementById('otp-0')?.focus(); }, 100);
    } catch (err) {
      setOtpError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #001a1a 0%, #003333 35%, #005555 65%, #008b8b 100%)' }}>

      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full animate-[floatOrb1_8s_ease-in-out_infinite]"
          style={{ width: 'clamp(200px,40vw,500px)', height: 'clamp(200px,40vw,500px)', top: '-10%', left: '-10%',
            background: 'radial-gradient(circle,rgba(0,139,139,0.28) 0%,transparent 70%)' }} />
        <div className="absolute rounded-full animate-[floatOrb2_10s_ease-in-out_2s_infinite]"
          style={{ width: 'clamp(160px,30vw,400px)', height: 'clamp(160px,30vw,400px)', bottom: '-8%', right: '-8%',
            background: 'radial-gradient(circle,rgba(0,255,200,0.14) 0%,transparent 70%)' }} />
        <div className="absolute rounded-full animate-[floatOrb3_7s_ease-in-out_1s_infinite] hidden sm:block"
          style={{ width: 230, height: 230, top: '38%', right: '12%',
            background: 'radial-gradient(circle,rgba(255,165,0,0.1) 0%,transparent 70%)' }} />
        <div className="absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(rgba(0,139,139,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,139,139,0.06) 1px,transparent 1px)',
            backgroundSize: '44px 44px' }} />
      </div>

      {/* Watermark logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none animate-[fadeIn_1.2s_ease_0.3s_both]">
        <img src="/logo.png" alt=""
          className="opacity-5 brightness-[12] object-contain"
          style={{ width: 'clamp(260px,65vw,940px)', maxWidth: '78vw' }} />
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full px-4 sm:px-5 animate-[slideUp_0.7s_cubic-bezier(0.16,1,0.3,1)_both]"
        style={{ maxWidth: 'min(680px, 100vw)' }}>
        <div
          className="rounded-2xl sm:rounded-3xl flex flex-col justify-center"
          style={{
            padding: 'clamp(1.5rem, 5vw, 2.5rem)',
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-5 sm:mb-6">
            <img src="/logo.png" alt="Logo"
              className="object-contain brightness-[20] opacity-92"
              style={{ width: 'clamp(120px, 35vw, 192px)' }} />
          </div>

          {/* Heading */}
          <div className="text-center mb-5 sm:mb-6">
            <h1 className="text-white font-bold tracking-tight mb-1"
              style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}>Admin</h1>
            <p className="text-white/70 text-xs sm:text-sm">Sign in to manage your projects</p>
          </div>

          {/* Error */}
          {error && (
            <div className="animate-[errIn_0.3s_ease_both] flex items-start gap-2.5 rounded-xl px-4 py-2.5 mb-4 text-xs sm:text-sm font-medium bg-red-500/15 border border-red-500/30 text-red-300">
              <span className="text-base shrink-0 mt-0.5">⚠️</span>
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email"
                className="text-[10px] font-semibold uppercase tracking-widest text-white/80 ml-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 flex items-center pointer-events-none">
                  <MdEmail className="text-lg text-[#00e5cc]" />
                </div>
                <input
                  type="email" id="email" name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="your@email.com"
                  required
                  className="w-full py-3 sm:py-3.5 pl-11 pr-4 text-white text-sm bg-transparent border border-white/20 rounded-xl outline-none transition-all duration-300 placeholder:text-white/25 focus:border-[#00e5cc]/70 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(0,229,204,0.12)]"
                />
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center mt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-white/50 group">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="w-4 h-4 cursor-pointer rounded border-white/30 bg-white/10 checked:bg-[#00e5cc] checked:border-[#00e5cc] focus:ring-0 focus:ring-offset-0 transition-colors duration-200"
                />
                <span className="group-hover:text-white transition-colors duration-200">Remember me</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-3.5 mt-1 text-white text-sm font-bold tracking-wide rounded-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                background: 'linear-gradient(to right, #00b3b3, #008b8b)',
                boxShadow: '0 8px 20px rgba(0,139,139,0.35)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Sending OTP...
                </span>
              ) : 'Send OTP'}
            </button>

            {/* Staff Login Link */}
            <p className="text-center text-xs mt-1 text-white/40">
              Are you staff?{' '}
              <button
                type="button"
                onClick={() => navigate('/staff-login')}
                className="text-[#00e5cc] font-semibold hover:text-[#00e5cc]/80 hover:underline transition-all duration-200"
              >
                Staff Login
              </button>
            </p>
          </form>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease]">
          <div className="relative w-full sm:max-w-md">
            <div
              className="rounded-t-3xl sm:rounded-2xl p-6 sm:p-8"
              style={{
                background: 'rgba(10,25,25,0.97)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,229,204,0.2)',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.4), 0 25px 50px -12px rgba(0,0,0,0.5)',
              }}
            >
              {/* Back button */}
              <button
                onClick={() => { setShowOtpModal(false); setOtp(['','','','','','']); setOtpError(''); }}
                className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-[#00e5cc] hover:bg-white/10 transition-all duration-200"
              >
                <MdArrowBack size={20} />
              </button>

              {/* Modal header */}
              <div className="text-center mb-6 sm:mb-8 mt-1">
                <h3 className="text-white text-lg sm:text-xl font-bold mb-1.5">Enter OTP</h3>
                <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                  We've sent a 6-digit code to<br />
                  <span className="text-[#00e5cc] font-medium">{formData.email}</span>
                </p>
              </div>

              {/* OTP Error */}
              {otpError && (
                <div className="flex items-start gap-2 rounded-lg px-4 py-2.5 mb-5 text-xs sm:text-sm bg-red-500/15 border border-red-500/30 text-red-300">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span className="leading-snug">{otpError}</span>
                </div>
              )}

              {/* OTP Inputs */}
              <form onSubmit={handleOtpSubmit}>
                <div className="flex justify-between gap-1.5 sm:gap-2 mb-6 sm:mb-8">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      autoFocus={index === 0}
                      disabled={otpLoading || resendLoading}
                      className="flex-1 min-w-0 aspect-square text-center text-white font-bold bg-white/5 border border-white/15 rounded-xl outline-none transition-all duration-300 focus:border-[#00e5cc]/70 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(0,229,204,0.12)] disabled:opacity-60"
                      style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}
                    />
                  ))}
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  <button
                    type="submit"
                    disabled={otpLoading || resendLoading || otp.join('').length !== 6}
                    className="w-full py-3 text-white text-sm font-bold tracking-wide rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(to right, #00b3b3, #008b8b)', boxShadow: '0 8px 20px rgba(0,139,139,0.35)' }}
                  >
                    {otpLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Verifying...
                      </span>
                    ) : 'Verify & Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpLoading || resendLoading}
                    className="w-full py-3 text-sm font-medium text-[#00e5cc] bg-white/5 border border-[#00e5cc]/30 rounded-xl hover:bg-[#00e5cc]/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Sending...
                      </span>
                    ) : 'Resend OTP'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes floatOrb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(30px,-40px) scale(1.06); }
          66%      { transform: translate(-20px,20px) scale(0.95); }
        }
        @keyframes floatOrb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(-40px,-30px) scale(1.08); }
        }
        @keyframes floatOrb3 {
          0%,100% { transform: translate(0,0); }
          50%     { transform: translate(20px,-25px); }
        }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(40px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes errIn {
          from { opacity:0; transform:translateX(-10px); }
          to   { opacity:1; transform:translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default Login;