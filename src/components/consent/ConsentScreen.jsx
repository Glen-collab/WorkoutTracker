import React, { useState } from 'react';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    paddingTop: '40px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    maxWidth: '600px',
    margin: '0 auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  heroHeader: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '32px 24px',
    textAlign: 'center',
    color: '#fff',
  },
  heroIcon: {
    fontSize: '40px',
    marginBottom: '8px',
  },
  heroTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 4px 0',
  },
  heroSubtitle: {
    fontSize: '14px',
    opacity: 0.9,
    margin: 0,
  },
  body: {
    padding: '24px',
  },
  narrative: {
    fontSize: '14px',
    lineHeight: '1.7',
    color: '#444',
    marginBottom: '20px',
  },
  vowList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 28px 0',
  },
  vowItem: {
    fontSize: '14px',
    color: '#444',
    padding: '8px 0 8px 24px',
    position: 'relative',
    lineHeight: '1.5',
  },
  sectionDivider: {
    borderTop: '2px solid #e0e0e0',
    margin: '24px 0',
    padding: 0,
  },
  legalHeader: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: '0 0 20px 0',
    textAlign: 'center',
  },
  legalSection: {
    marginBottom: '18px',
  },
  legalTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1565c0',
    margin: '0 0 6px 0',
  },
  legalText: {
    fontSize: '13px',
    color: '#555',
    lineHeight: '1.6',
    margin: 0,
  },
  btnRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '0 24px 28px 24px',
  },
  btnAccept: {
    width: '100%',
    padding: '16px',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnDecline: {
    width: '100%',
    padding: '16px',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #e53935 0%, #b71c1c 100%)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  declinedCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px 28px',
    maxWidth: '420px',
    margin: '80px auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    textAlign: 'center',
  },
  declinedIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  declinedTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: '0 0 12px 0',
  },
  declinedText: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
  },
  btnBack: {
    padding: '14px 32px',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

const legalSections = [
  {
    num: '1\uFE0F\u20E3',
    title: 'Assumption of Risk',
    text: 'You acknowledge that physical exercise involves inherent risks of injury. You voluntarily assume all risks associated with participating in any workout program, exercise routine, or physical activity recommended or provided through this platform.',
  },
  {
    num: '2\uFE0F\u20E3',
    title: 'No Medical Advice',
    text: 'The content provided through this platform is for informational and educational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or qualified health provider before beginning any exercise program.',
  },
  {
    num: '3\uFE0F\u20E3',
    title: 'Personal Responsibility',
    text: 'You are solely responsible for your own health and safety during any workout. You agree to listen to your body, use proper form, and stop exercising immediately if you feel pain, dizziness, or discomfort beyond normal exertion.',
  },
  {
    num: '4\uFE0F\u20E3',
    title: 'Release of Liability',
    text: 'You hereby release, waive, and discharge the platform, its trainers, coaches, and affiliates from any and all liability, claims, demands, or causes of action arising out of or related to any loss, damage, or injury that may be sustained while using this platform or participating in any exercise program.',
  },
  {
    num: '5\uFE0F\u20E3',
    title: 'No Guarantee of Results',
    text: 'Results from any exercise program vary from individual to individual. No specific results are guaranteed. Your success depends on many factors including but not limited to your consistency, effort, diet, and genetics.',
  },
  {
    num: '6\uFE0F\u20E3',
    title: 'Digital Conduct',
    text: 'You agree to use this platform responsibly and not to share your access credentials with others. You agree not to reverse engineer, copy, or redistribute any content or programming provided through this platform.',
  },
  {
    num: '7\uFE0F\u20E3',
    title: 'Intellectual Property',
    text: 'All workout programs, content, designs, and materials on this platform are the intellectual property of the platform and its creators. Unauthorized reproduction or distribution is strictly prohibited.',
  },
  {
    num: '8\uFE0F\u20E3',
    title: 'Agreement',
    text: 'By clicking "Accept" below, you confirm that you have read, understood, and agree to all terms stated above. You confirm that you are at least 18 years of age or have parental/guardian consent to use this platform.',
  },
];

export default function ConsentScreen({ onAccept, onDecline, userName }) {
  const [declined, setDeclined] = useState(false);

  if (declined) {
    return (
      <div style={styles.container}>
        <div style={styles.declinedCard}>
          <div style={styles.declinedIcon}>&#x1F6E1;&#xFE0F;</div>
          <h1 style={styles.declinedTitle}>Quest Declined</h1>
          <p style={styles.declinedText}>
            We respect your decision. The path of strength will be here whenever
            you're ready to begin. May you find your way back when the time is right.
          </p>
          <button style={styles.btnBack} onClick={() => setDeclined(false)}>
            &#8592; Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.heroHeader}>
          <div style={styles.heroIcon}>&#x2694;&#xFE0F;</div>
          <h1 style={styles.heroTitle}>Part I — The Path of Strength: Your Hero's Oath</h1>
          <p style={styles.heroSubtitle}>
            {userName ? `${userName}, before you begin...` : 'Before you begin...'}
          </p>
        </div>

        <div style={styles.body}>
          <p style={styles.narrative}>
            You stand at the threshold of transformation. The road ahead will challenge your
            body, test your resolve, and forge your spirit in the fires of discipline. This is
            not merely a workout program — it is a quest. Every rep is a step forward, every
            set a battle won, and every session a chapter in the story of your becoming.
          </p>
          <p style={styles.narrative}>
            But every hero must first make a vow. By taking this oath, you commit to honoring
            your body, pushing your limits with wisdom, and showing up — not for perfection,
            but for progress.
          </p>

          <ul style={styles.vowList}>
            <li style={styles.vowItem}>&#x2694;&#xFE0F; I will show up, even on the days I don't feel like it.</li>
            <li style={styles.vowItem}>&#x1F6E1;&#xFE0F; I will listen to my body and train with intelligence, not ego.</li>
            <li style={styles.vowItem}>&#x1F525; I will embrace the struggle, knowing that growth lives on the other side of discomfort.</li>
            <li style={styles.vowItem}>&#x1F451; I will be patient with my progress, trusting the process over the outcome.</li>
          </ul>

          <div style={styles.sectionDivider} />

          <h2 style={styles.legalHeader}>Part II — Legal Waiver & Terms of Use</h2>

          {legalSections.map((section, i) => (
            <div key={i} style={styles.legalSection}>
              <p style={styles.legalTitle}>{section.num} {section.title}</p>
              <p style={styles.legalText}>{section.text}</p>
            </div>
          ))}
        </div>

        <div style={styles.btnRow}>
          <button style={styles.btnAccept} onClick={onAccept}>
            &#x2694;&#xFE0F; Accept: I Begin My Quest &amp; Agree to the Terms
          </button>
          <button
            style={styles.btnDecline}
            onClick={() => {
              setDeclined(true);
              if (onDecline) onDecline();
            }}
          >
            &#x274C; Decline: I Will Not Embark Today
          </button>
        </div>
      </div>
    </div>
  );
}
