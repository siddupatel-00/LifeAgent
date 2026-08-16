import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Lock 
} from 'lucide-react';

/**
 * Staff-Level Bottom CTA Section for LifeAgent
 * High-conversion closing card with reassurance points.
 */
export default function BottomCTA({ onGetStarted, onJoinWaitlist }) {
  return (
    <section className="landing-section" aria-label="Get Started with LifeAgent">
      <div className="landing-container">
        <div className="bottom-cta-card">
          {/* Badge */}
          <div className="landing-badge" style={{ marginBottom: '20px' }}>
            <Sparkles size={14} aria-hidden="true" />
            <span>START ELEVATING YOUR DAILY AGENCY</span>
          </div>

          {/* Heading */}
          <h2 className="bottom-cta-title">
            Ready to Connect Your Life with Autonomous AI Intelligence?
          </h2>

          {/* Subheading */}
          <p className="bottom-cta-desc">
            Stop juggling fragmented apps. Unify your sleep, workouts, cashflow, calendar, and notes in a single high-velocity workspace.
          </p>

          {/* Actions */}
          <div className="bottom-cta-actions">
            <button 
              type="button" 
              className="landing-btn-primary"
              onClick={onGetStarted}
              aria-label="Get started free with LifeAgent"
            >
              Get Started Free <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button 
              type="button" 
              className="landing-btn-secondary"
              onClick={onJoinWaitlist}
              aria-label="Join the VIP waitlist"
            >
              Join VIP Waitlist
            </button>
          </div>

          {/* Reassurance Perks */}
          <div className="bottom-cta-perks">
            <div className="bottom-cta-perk-item">
              <ShieldCheck size={16} color="#10b981" aria-hidden="true" />
              <span>Free forever local tier</span>
            </div>
            <div className="bottom-cta-perk-item">
              <Lock size={16} color="var(--accent-blue)" aria-hidden="true" />
              <span>100% Private local SQLite</span>
            </div>
            <div className="bottom-cta-perk-item">
              <Zap size={16} color="#f59e0b" aria-hidden="true" />
              <span>Zero credit card required</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
