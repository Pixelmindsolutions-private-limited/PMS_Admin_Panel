import React, { useState, useEffect } from 'react';
import { MdEmail, MdLock, MdArrowBack } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const StaffLogin = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Load saved credentials from localStorage on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('staffRememberedEmail');
    const savedPassword = localStorage.getItem('staffRememberedPassword');
    if (savedEmail && savedPassword) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail,
        password: savedPassword,
        rememberMe: true
      }));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://pmsbackend.pixelmindsolutions.com/api/admin-staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Invalid credentials. Please try again.');

      // Save staff details to sessionStorage
      sessionStorage.setItem(
        "loginDetails",
        JSON.stringify({
          id: data.data.id,
          employeeId: data.data.employeeId,
          name: data.data.name,
          email: data.data.email,
          adminEmail: data.data.adminEmail,
          role: data.data.role,
          mobile: data.data.mobile,
          profileImage: data.data.profileImage,
          modulePermissions: data.data.modulePermissions,
          accessibleModules: data.data.accessibleModules,
          isAllProjectsAllowed: data.data.isAllProjectsAllowed,
          allowedProjects: data.data.allowedProjects,
          isReadOnly: data.data.isReadOnly,
          token: data.data.token || null,
        })
      );

      // Save credentials to localStorage if remember me is checked
      if (formData.rememberMe) {
        localStorage.setItem('staffRememberedEmail', formData.email);
        localStorage.setItem('staffRememberedPassword', formData.password);
      } else {
        localStorage.removeItem('staffRememberedEmail');
        localStorage.removeItem('staffRememberedPassword');
      }

      console.log("Staff Login Successful:", data);
      onLogin();
      navigate('/staff-dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #001a1a 0%, #003333 35%, #005555 65%, #008b8b 100%)' }}>

      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full animate-[floatOrb1_8s_ease-in-out_infinite]"
          style={{
            width: 'clamp(200px,40vw,500px)', height: 'clamp(200px,40vw,500px)', top: '-10%', left: '-10%',
            background: 'radial-gradient(circle,rgba(0,139,139,0.28) 0%,transparent 70%)'
          }} />
        <div className="absolute rounded-full animate-[floatOrb2_10s_ease-in-out_2s_infinite]"
          style={{
            width: 'clamp(160px,30vw,400px)', height: 'clamp(160px,30vw,400px)', bottom: '-8%', right: '-8%',
            background: 'radial-gradient(circle,rgba(0,255,200,0.14) 0%,transparent 70%)'
          }} />
        <div className="absolute rounded-full animate-[floatOrb3_7s_ease-in-out_1s_infinite] hidden sm:block"
          style={{
            width: 230, height: 230, top: '38%', right: '12%',
            background: 'radial-gradient(circle,rgba(255,165,0,0.1) 0%,transparent 70%)'
          }} />
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,139,139,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,139,139,0.06) 1px,transparent 1px)',
            backgroundSize: '44px 44px'
          }} />
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
          {/* Back Button */}
          <button
            onClick={() => navigate('/login')}
            className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-[#00e5cc] hover:bg-white/10 transition-all duration-200"
          >
            <MdArrowBack size={20} />
          </button>

          {/* Logo */}
          <div className="flex justify-center mb-5 sm:mb-6">
            <img src="/logo.png" alt="Logo"
              className="object-contain brightness-[20] opacity-92"
              style={{ width: 'clamp(120px, 35vw, 192px)' }} />
          </div>

          {/* Heading */}
          <div className="text-center mb-5 sm:mb-6">
            <h1 className="text-white font-bold tracking-tight mb-1"
              style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}>Staff Login</h1>
            <p className="text-white/70 text-xs sm:text-sm">Sign in to manage staff tasks</p>
          </div>

          {/* Error */}
          {error && (
            <div className="animate-[errIn_0.3s_ease_both] flex items-start gap-2.5 rounded-xl px-4 py-2.5 mb-4 text-xs sm:text-sm font-medium bg-red-500/15 border border-red-500/30 text-red-300">
              <span className="text-base shrink-0 mt-0.5">⚠️</span>
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  placeholder="staff@email.com"
                  required
                  className="w-full py-3 sm:py-3.5 pl-11 pr-4 text-white text-sm bg-transparent border border-white/20 rounded-xl outline-none transition-all duration-300 placeholder:text-white/25 focus:border-[#00e5cc]/70 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(0,229,204,0.12)]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password"
                className="text-[10px] font-semibold uppercase tracking-widest text-white/80 ml-1">
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 flex items-center pointer-events-none">
                  <MdLock className="text-lg text-[#00e5cc]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password" name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  required
                  className="w-full py-3 sm:py-3.5 pl-11 pr-12 text-white text-sm bg-transparent border border-white/20 rounded-xl outline-none transition-all duration-300 placeholder:text-white/25 focus:border-[#00e5cc]/70 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(0,229,204,0.12)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-white/40 hover:text-white/80 transition-colors duration-200"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between mt-0.5">
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
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>

            {/* Admin Login Link */}
            <p className="text-center text-xs mt-1 text-white/40">
              Not a staff member?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#00e5cc] font-semibold hover:text-[#00e5cc]/80 hover:underline transition-all duration-200"
              >
                Admin Login
              </button>
            </p>
          </form>
        </div>
      </div>

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

export default StaffLogin;