import React, { useState, useEffect } from 'react';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Animation States
  const [focusField, setFocusField] = useState(null); // 'email' | 'password' | null
  const [animationState, setAnimationState] = useState('idle'); // idle, shatter, success
  const [isTypingPassword, setIsTypingPassword] = useState(false);

  // Face tracking state (eyes + mouth together)
  const [faceRotations, setFaceRotations] = useState({
    purple: 0,
    black: 0,
    yellow: 0,
    orange: 0
  });

  // Pupil tracking state
  const [pupilPositions, setPupilPositions] = useState({
    purple: { x: 0, y: 0 },
    black: { x: 0, y: 0 },
    yellow: { x: 0, y: 0 },
    orange: { x: 0, y: 0 }
  });

  // Add state for eye positions (the white eyeballs)
  const [eyePositions, setEyePositions] = useState({
    purple: { x: 0, y: 0 },
    black: { x: 0, y: 0 },
    yellow: { x: 0, y: 0 },
    orange: { x: 0, y: 0 }
  });

  // Add state for mouth positions
  const [mouthPositions, setMouthPositions] = useState({
    purple: { x: 0, y: 0 },
    black: { x: 0, y: 0 },
    yellow: { x: 0, y: 0 },
    orange: { x: 0, y: 0 }
  });

  // Track mouse movement for face following
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Parallax effect for background bubbles
      const particles = document.querySelector('.background-particles');
      if (particles) {
        const moveX = (e.clientX * -0.02);
        const moveY = (e.clientY * -0.02);
        particles.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }

      // Stop tracking if password is shown (peek) or focused on password or shattering
      if (focusField === 'password' || animationState === 'shatter' || showPassword) return;

      const figures = {
        purple: document.querySelector('.figure-purple'),
        black: document.querySelector('.figure-black'),
        yellow: document.querySelector('.figure-yellow'),
        orange: document.querySelector('.figure-orange')
      };

      const newPositions = {};
      const newEyePositions = {};
      const newMouthPositions = {};
      const newFaceRotations = {};

      Object.keys(figures).forEach(key => {
        const figure = figures[key];
        if (!figure) return;

        const face = figure.querySelector('.face');
        if (!face) return;

        const rect = face.getBoundingClientRect();
        const faceCenterX = rect.left + rect.width / 2;
        const faceCenterY = rect.top + rect.height / 2;

        const deltaX = e.clientX - faceCenterX;
        const deltaY = e.clientY - faceCenterY;
        const angle = Math.atan2(deltaY, deltaX);
        
        // Pupil movement
        const maxDistance = key === 'black' ? 5 : 4; // Increased from 3/2
        const pupilX = Math.cos(angle) * maxDistance;
        const pupilY = Math.sin(angle) * maxDistance;
        newPositions[key] = { x: pupilX, y: pupilY };
        
        // Eye movement (eyeballs moving along face)
        const eyeMaxDist = 12; // Increased from 6
        const eyeX = Math.cos(angle) * eyeMaxDist;
        const eyeY = Math.sin(angle) * eyeMaxDist;
        newEyePositions[key] = { x: eyeX, y: eyeY };

        // Mouth movement
        const mouthMaxDist = 8; // Increased from 3
        const mouthX = Math.cos(angle) * mouthMaxDist;
        const mouthY = Math.sin(angle) * mouthMaxDist;
        newMouthPositions[key] = { x: mouthX, y: mouthY };
        
        // Calculate face rotation (convert radians to degrees)
        const rotationDegrees = (angle * 180 / Math.PI) * 0.05; // Increased from 0.03
        newFaceRotations[key] = rotationDegrees;
      });

      setPupilPositions(newPositions);
      setEyePositions(newEyePositions);
      setMouthPositions(newMouthPositions);
      setFaceRotations(newFaceRotations);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [focusField, animationState, showPassword]);

  const BackgroundParticles = () => (
    <div className="background-particles">
      <div className="particle p1"></div>
      <div className="particle p2"></div>
      <div className="particle p3"></div>
      <div className="particle p4"></div>
      <div className="particle p5"></div>
    </div>
  );

  // Mascot Component
  const MascotCharacter = ({ state }) => {
    return (
      <div className={`mascot-container ${state}`}>
        <div className="mascot-body">
          <div className="mascot-head">
            <div className="mascot-hair"></div>
            <div className="mascot-face">
              <div className="mascot-eyes">
                <div className="eye left">
                  <div className="pupil"></div>
                  <div className="eyelid"></div>
                </div>
                <div className="eye right">
                  <div className="pupil"></div>
                  <div className="eyelid"></div>
                </div>
              </div>
              <div className="mascot-mouth"></div>
              <div className="mascot-cheeks">
                <div className="cheek left"></div>
                <div className="cheek right"></div>
              </div>
            </div>
          </div>
          <div className="mascot-torso">
            <div className="mascot-arm left">
              <div className="hand"></div>
            </div>
            <div className="mascot-arm right">
              <div className="hand"></div>
            </div>
          </div>
        </div>
        <div className="mascot-shadow"></div>
        {state === 'success' && (
          <div className="confetti-burst">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
        )}
        {state === 'error' && (
          <div className="tear-drop"></div>
        )}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Trigger Shatter Animation on Login Click
    setAnimationState('shatter');
    
    // Delay actual API call slightly to let animation start
    await new Promise(r => setTimeout(r, 800)); 

    try {
      const endpoint = isLogin ? `${API_URL}/auth/login` : `${API_URL}/auth/register`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Cannot connect to server. Make sure backend is running on port 5000.');
      }

      const data = await res.json();

      if (!res.ok) {
        setAnimationState('error'); // Changed from idle
        throw new Error(data.error || 'Authentication failed');
      }

      setAnimationState('success'); // Optional success state if not shattering
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.email);
      
      setTimeout(() => {
        onLogin(data.token);
      }, 500);
      
    } catch (err) {
      setAnimationState('error'); // Changed from idle
      setError(err.message);
      setTimeout(() => setAnimationState('idle'), 2000); // Reset after 2s
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (resetStep === 1) {
        // Request reset code
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Cannot connect to server. Make sure backend is running.');
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to send reset code');
        }

        // Check if email was sent or if we got a fallback code
        if (data.resetToken) {
          // Fallback mode (email service unavailable) - hide the code
          setGeneratedCode(data.resetToken);
          setSuccess(`⚠️ Email service is currently unavailable. Please check backend console for the reset code.`);
        } else {
          // Email sent successfully
          setSuccess(`✅ Reset code sent to ${email}! Check your inbox.`);
        }
        setResetStep(2);
      } else if (resetStep === 2) {
        const res = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, resetToken: resetCode }),
        });

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Cannot connect to server.');
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Invalid reset code');
        }

        setSuccess('Code verified! Enter your new password.');
        setResetStep(3);
      } else if (resetStep === 3) {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, resetToken: resetCode, newPassword }),
        });

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Cannot connect to server.');
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Password reset failed');
        }

        setSuccess('Password reset successful! You can now login.');
        setTimeout(() => {
          setIsForgotPassword(false);
          setResetStep(1);
          setEmail('');
          setResetCode('');
          setNewPassword('');
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForgotPasswordFlow = () => {
    setIsForgotPassword(false);
    setResetStep(1);
    setEmail('');
    setResetCode('');
    setNewPassword('');
    setError('');
    setSuccess('');
  };

  // Handle password focus/blur logic for mascot
  const handlePasswordFocus = () => {
    if (showPassword) {
      setMascotState('peek');
    } else {
      setMascotState('focus-password');
    }
  };

  const handlePasswordBlur = () => {
    if (mascotState !== 'error' && mascotState !== 'success') {
      setMascotState('idle');
    }
  };

  const togglePasswordVisibility = () => {
    const newState = !showPassword;
    setShowPassword(newState);
    // If currently focused on password, update mascot state immediately
    if (mascotState === 'focus-password' || mascotState === 'peek') {
      setMascotState(newState ? 'peek' : 'focus-password');
    }
  };

  // Helper to determine current animation class for container
  const getFigureClass = () => {
    if (animationState === 'shatter') return 'shatter';
    if (animationState === 'success') return 'success';
    if (animationState === 'error') return 'error';
    if (showPassword) return 'peek';
    if (focusField === 'password') return 'shy';
    if (focusField === 'email') return 'curious';
    return 'idle';
  };

  // Helper to combine eye translation with animation scales
  const getEyeStyle = (key) => {
    const figureClass = getFigureClass();

    if (figureClass === 'error') {
      return {
        transform: 'translate(0, 0)', 
        transition: 'transform 0.2s ease-out'
      };
    }

    // Look away when showing password (peek state)
    if (figureClass === 'peek') {
      return {
        transform: 'translate(-12px, -6px)', // Look up-left
        transition: 'transform 0.2s ease-out'
      };
    }

    const { x, y } = eyePositions[key];
    let scale = '';

    if (figureClass === 'curious' || figureClass === 'shy') {
       if (key === 'purple') scale = 'scale(1.1, 0.85)';
       else if (key === 'black') scale = 'scale(1.15, 0.8)';
       else if (key === 'yellow') scale = 'scale(1.12, 0.82)';
       else if (key === 'orange') scale = 'scale(1.08, 0.88)';
    } else if (figureClass === 'peek') {
       if (key === 'purple') scale = 'scale(1.08)';
       else if (key === 'black') scale = 'scale(1.06)';
       else if (key === 'yellow') scale = 'scale(1.05)';
       else if (key === 'orange') scale = 'scale(1.04)';
    }
    
    return {
      transform: `translate(${x}px, ${y}px) ${scale}`,
      transition: 'transform 0.1s ease-out'
    };
  };

  // Helper to combine mouth translation with animation scales
  const getMouthStyle = (key) => {
    const { x, y } = mouthPositions[key];
    let scale = '';
    const figureClass = getFigureClass();

    if (figureClass === 'error') {
      return { transform: 'translate(0, 0)' };
    }

    if (figureClass === 'peek') {
       if (key === 'orange' || key === 'yellow') {
         return {}; // Let CSS handle whistling animation
       }
       return { transform: 'translate(0,0)' };
    }

    if (figureClass === 'curious') {
       if (key === 'purple') scale = 'scaleX(1) scaleY(0.8)';
       else if (key === 'yellow') scale = 'scaleX(0.8) scaleY(0.7)';
       else if (key === 'orange') scale = 'scaleY(0.9) scaleX(0.95)';
    } else if (figureClass === 'shy') {
       if (key === 'purple') scale = 'scaleX(0.7) scaleY(0.6)';
       else if (key === 'yellow') scale = 'scaleX(0.6) scaleY(0.5)';
       else if (key === 'orange') scale = 'scaleY(-0.8) scaleX(1.1)';
    } else if (figureClass === 'peek') {
       if (key === 'purple') scale = 'scaleY(1.2) scaleX(1.1)';
       else if (key === 'yellow') scale = 'scaleX(1.15) scaleY(1)';
       else if (key === 'orange') scale = 'scaleY(1) scaleX(1)';
    }
    
    return {
      transform: `translate(${x}px, ${y}px) ${scale}`,
      transition: 'transform 0.1s ease-out'
    };
  };

  // Helper for pupil style to look away during peek
  const getPupilStyle = (key) => {
    const figureClass = getFigureClass();
    if (figureClass === 'error') {
      return {
        transform: 'translate(0, 4px)', // Look down
        transition: 'transform 0.2s ease-out'
      };
    }
    if (figureClass === 'peek') {
      return {
        transform: 'translate(-3px, -1px)', 
        transition: 'transform 0.2s ease-out'
      };
    }
    const { x, y } = pupilPositions[key];
    return {
      transform: `translate(${x}px, ${y}px)`
    };
  };

  // Helper for face rotation style
  const getFaceStyle = (key) => {
    const figureClass = getFigureClass();
    if (figureClass === 'error') {
      return {}; // Reset rotation
    }
    // If peeking, let CSS handle the look-away transform by returning empty style
    if (figureClass === 'peek') {
      return {}; 
    }
    return { 
      transform: `translateX(-50%) rotate(${faceRotations[key]}deg)` 
    };
  };

  // Abstract Figures Component based on the image provided
  const AbstractFigures = () => (
    <div className={`figures-group ${getFigureClass()}`}>
      
      {/* Purple Rectangle (Back Left) */}
      <div className="figure figure-purple">
        <div 
          className="face" 
          style={getFaceStyle('purple')}
        >
          <div className="eyes">
            <div className="eye" style={getEyeStyle('purple')}>
              <div 
                className="pupil" 
                style={getPupilStyle('purple')}
              />
            </div>
            <div className="eye" style={getEyeStyle('purple')}>
              <div 
                className="pupil" 
                style={getPupilStyle('purple')}
              />
            </div>
          </div>
          <div className="mouth" style={getMouthStyle('purple')}></div>
        </div>
        <div className="hands-cover"></div>
      </div>

      {/* Black Tall Rectangle (Middle) */}
      <div className="figure figure-black">
        <div 
          className="face" 
          style={getFaceStyle('black')}
        >
          <div className="eyes">
            <div className="eye" style={getEyeStyle('black')}>
              <div 
                className="pupil" 
                style={getPupilStyle('black')}
              />
            </div>
            <div className="eye" style={getEyeStyle('black')}>
              <div 
                className="pupil" 
                style={getPupilStyle('black')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Yellow Shape (Right) */}
      <div className="figure figure-yellow">
        <div 
          className="face" 
          style={getFaceStyle('yellow')}
        >
          <div className="eyes">
            <div className="eye" style={getEyeStyle('yellow')}>
              <div 
                className="pupil" 
                style={getPupilStyle('yellow')}
              />
            </div>
            <div className="eye" style={getEyeStyle('yellow')}>
              <div 
                className="pupil" 
                style={getPupilStyle('yellow')}
              />
            </div>
          </div>
          <div className="mouth" style={getMouthStyle('yellow')}></div>
          {/* Musical notes for whistling */}
          <div className="music-note note-1">♪</div>
          <div className="music-note note-2">♫</div>
        </div>
      </div>

      {/* Orange Semicircle (Front Left) */}
      <div className="figure figure-orange">
        <div 
          className="face" 
          style={getFaceStyle('orange')}
        >
          <div className="eyes">
            <div className="eye" style={getEyeStyle('orange')}>
              <div 
                className="pupil" 
                style={getPupilStyle('orange')}
              />
            </div>
            <div className="eye" style={getEyeStyle('orange')}>
              <div 
                className="pupil" 
                style={getPupilStyle('orange')}
              />
            </div>
          </div>
          <div className="mouth" style={getMouthStyle('orange')}></div>
        </div>
      </div>

    </div>
  );

  if (isForgotPassword) {
    return (
      <div className="auth-split-layout">
        <BackgroundParticles />
        <div className="auth-left-panel">
          {AbstractFigures()}
        </div>
        <div className="auth-right-panel">
          <div className="auth-card">
            <div className="card-header">
              <h2>Reset Password</h2>
              <p className="subtitle">Follow the steps to recover your account</p>
            </div>
            
            {error && <div className="auth-message error">{error}</div>}
            {success && <div className="auth-message success">{success}</div>}
            
            <form onSubmit={handleForgotPassword}>
              {resetStep === 1 && (
                <div className="input-group">
                  <input
                    type="email"
                    id="reset-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder=" "
                  />
                  <label htmlFor="reset-email">Enter your email</label>
                </div>
              )}
              {resetStep === 2 && (
                <>
                  <p className="reset-info">Enter the 6-digit code sent to {email}</p>
                  <div className="input-group">
                    <input
                      type="text"
                      id="reset-code"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      required
                      maxLength="6"
                      placeholder=" "
                    />
                    <label htmlFor="reset-code">6-digit code</label>
                  </div>
                </>
              )}
              {resetStep === 3 && (
                <div className="input-group">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength="6"
                    placeholder=" "
                  />
                  <label htmlFor="new-password">New Password</label>
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>
              )}

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Processing...' : 
                  resetStep === 1 ? 'Send Reset Code' :
                  resetStep === 2 ? 'Verify Code' :
                  'Reset Password'}
              </button>
            </form>

            <div className="auth-footer">
              <button type="button" onClick={resetForgotPasswordFlow} className="link-btn">
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-split-layout">
      <BackgroundParticles />
      <div className="auth-left-panel">
        {AbstractFigures()}
      </div>
      
      <div className="auth-right-panel">
        <div className="auth-card entrance-animation">
          <div className="card-header">
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="subtitle">
              {isLogin ? 'Enter your details to access your budget' : 'Start tracking your expenses today'}
            </p>
          </div>
          
          {error && <div className="auth-message error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder=" "
                onFocus={() => setAnimationState('curious')}
                onBlur={() => setAnimationState('idle')}
              />
              <label htmlFor="email">Email Address</label>
            </div>

            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setIsTypingPassword(e.target.value.length > 0);
                }}
                required
                minLength="6"
                placeholder=" "
                onFocus={() => {
                  setIsTypingPassword(true);
                  setAnimationState('shy');
                }}
                onBlur={() => {
                  setIsTypingPassword(false);
                  setAnimationState('idle');
                }}
              />
              <label htmlFor="password">Password</label>
              <button
                type="button"
                className="password-toggle"
                onClick={() => {
                  setShowPassword(!showPassword);
                  setAnimationState(showPassword ? 'shy' : 'peek');
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div className="auth-footer">
            {isLogin && (
              <button type="button" onClick={() => setIsForgotPassword(true)} className="link-btn forgot-link">
                Forgot Password?
              </button>
            )}
            
            <div className="toggle-container">
              <span>{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="link-btn highlight">
                {isLogin ? 'Register' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;