import { Link } from "react-router-dom";

export default function AuthShell({ eyebrow = "مرحباً بك في", title, description, children, footer }) {
  return (
    <main className="auth-page" dir="rtl">
      <div className="auth-orb auth-orb-one"/><div className="auth-orb auth-orb-two"/>
      <div className="auth-layout">
        <section className="auth-showcase">
          <Link to="/login" className="auth-brand"><span className="brand-mark">🌱</span><span><strong>Happy Farmer</strong><small>SMART AGRICULTURE</small></span></Link>
          <div className="auth-showcase-copy"><span className="eyebrow"><i/> {eyebrow}</span><h1>ازرع بذكاء.<br/><em>واحصد بثقة.</em></h1><p>منصة زراعية تجمع بيانات مزرعتك وأدوات التحليل الذكي في مكان واحد، لتكون قراراتك أوضح ومحاصيلك أفضل.</p>
            <div className="auth-feature-list"><span>✦ متابعة المحاصيل</span><span>✦ تشخيص ذكي للأمراض</span><span>✦ توقع الإنتاج</span></div>
          </div>
          <div className="auth-showcase-bottom"><span>نحو زراعة أكثر ذكاءً واستدامة</span><span>01 — 03</span></div>
          <div className="auth-decoration"><span>✳</span><span>✳</span><span>✳</span></div>
        </section>
        <section className="auth-form-side">
          <div className="auth-form-card"><div className="auth-form-heading"><span className="auth-mini-mark">✦</span><span className="auth-form-eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{children}{footer && <div className="auth-form-footer">{footer}</div>}</div>
          <p className="auth-legal">© {new Date().getFullYear()} Happy Farmer · جميع الحقوق محفوظة</p>
        </section>
      </div>
    </main>
  );
}
