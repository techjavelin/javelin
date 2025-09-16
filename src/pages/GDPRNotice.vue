<template>
  <main class="main-content">
    <div class="content-container">
      <h1>GDPR Notice</h1>
    <p class="effective-date"><strong>Effective Date:</strong> May 25, 2018 | <strong>Last Updated:</strong> October 14, 2022</p>
    
    <section class="policy-section">
      <h2>Your Rights Under GDPR</h2>
      <p>As a data subject under the General Data Protection Regulation (GDPR), you have specific rights regarding your personal data. TechJavelin is committed to protecting your privacy and ensuring compliance with GDPR requirements.</p>
    </section>

    <section class="policy-section">
      <h2>What Personal Data We Collect</h2>
      <p>We may collect and process the following types of personal data:</p>
      <ul>
        <li>Contact information (name, email address, phone number)</li>
        <li>Company information for business communications</li>
        <li>Technical data from website interactions</li>
        <li>Marketing preferences and communication history</li>
      </ul>
    </section>

    <section class="policy-section">
      <h2>Your GDPR Rights</h2>
      <p>Under GDPR, you have the following rights:</p>
      <ul>
        <li><strong>Right of Access:</strong> You can request copies of your personal data</li>
        <li><strong>Right to Rectification:</strong> You can request correction of inaccurate data</li>
        <li><strong>Right to Erasure:</strong> You can request deletion of your personal data</li>
        <li><strong>Right to Restrict Processing:</strong> You can request limitation of data processing</li>
        <li><strong>Right to Data Portability:</strong> You can request transfer of your data</li>
        <li><strong>Right to Object:</strong> You can object to processing of your personal data</li>
        <li><strong>Right to Withdraw Consent:</strong> You can withdraw consent at any time</li>
      </ul>
    </section>

    <section class="policy-section">
      <h2>Legal Basis for Processing</h2>
      <p>We process your personal data based on:</p>
      <ul>
        <li><strong>Consent:</strong> Where you have given clear consent</li>
        <li><strong>Contract:</strong> Where processing is necessary for contract performance</li>
        <li><strong>Legal Obligation:</strong> Where required by law</li>
        <li><strong>Legitimate Interests:</strong> Where necessary for our legitimate business interests</li>
      </ul>
    </section>

    <section class="policy-section">
      <h2>Data Retention</h2>
      <p>We retain personal data only for as long as necessary to fulfill the purposes for which it was collected, comply with legal obligations, resolve disputes, and enforce agreements.</p>
    </section>

    <section class="policy-section">
      <h2>Client-Side Storage (Cookies & Local Storage)</h2>
      <p>We use limited client-side storage (HTTP cookies, Local Storage, Session Storage) to support essential authentication, remember your preferences, and—when consent is granted—enhance usability. We do <strong>not</strong> use these mechanisms to build marketing profiles without your explicit consent.</p>
      <ul>
        <li><strong>Essential (Legitimate Interest / Contract):</strong> Authentication tokens required to keep you signed in and apply security controls; the <code>cookie-consent</code> record proving consent choices.</li>
        <li><strong>Functional (Consent):</strong> UI preferences (theme, sidebar state, command palette visibility choices).</li>
        <li><strong>Analytics (Consent):</strong> Only loaded if you enable analytics in the cookie banner (currently no third-party analytics scripts are loaded by default).</li>
        <li><strong>Marketing (Consent):</strong> Not presently in active use; any future addition will require an explicit opt-in.</li>
      </ul>
      <p>For a detailed inventory of storage keys, their purposes, and retention periods, see the <router-link to="/cookies-policy">Cookie Policy</router-link>.</p>
    </section>

    <section class="policy-section">
      <h2>International Data Transfers</h2>
      <p>When we transfer personal data outside the European Economic Area (EEA), we ensure appropriate safeguards are in place to protect your data in accordance with GDPR requirements.</p>
    </section>

    <section class="policy-section">
      <h2>How to Exercise Your Rights</h2>
      <p>To exercise any of your GDPR rights, please contact us using the following methods:</p>
      <ul>
        <li>Email: <a href="mailto:privacy@techjavelin.com">privacy@techjavelin.com</a></li>
        <li>Contact Form: Use our website contact form with "GDPR Request" in the subject line</li>
        <li>Written Notice: Send a letter to our registered address</li>
      </ul>
      <p>We will respond to your request within 30 days of receipt.</p>
    </section>

    <section class="policy-section">
      <h2>Complaints</h2>
      <p>If you believe we have not handled your personal data in accordance with GDPR, you have the right to lodge a complaint with your local supervisory authority.</p>
    </section>

    <section class="policy-section">
      <h2>Withdrawing Consent & Preference Management</h2>
      <p>You can withdraw consent for non-essential cookies or functional personalization at any time by reopening the cookie banner (Preferences → Reopen Cookie Banner) or using the Reset Personalization feature. Withdrawal does not affect the lawfulness of processing based on consent before its withdrawal.</p>
      <p>Essential authentication and security storage remain active to maintain a secure session; logging out will remove session tokens.</p>
    </section>

    <section class="policy-section">
      <h2>Data Subject Access Requests (DSAR)</h2>
      <p>To initiate a DSAR (access, rectification, deletion, portability) contact us at <a href="mailto:privacy@techjavelin.com">privacy@techjavelin.com</a> with subject line “DSAR Request”. We verify identity via existing account email confirmation or additional verification if required.</p>
      <ul>
        <li><strong>Response SLA:</strong> We aim to respond within 30 days (may extend by 60 days for complex cases).</li>
        <li><strong>Scope:</strong> Includes application data stored in Amplify-managed services (DynamoDB / AppSync) associated with your account.</li>
        <li><strong>Exclusions:</strong> Aggregated or anonymized analytics not reasonably linkable to your identity.</li>
      </ul>
    </section>

    <footer class="policy-footer">
      <p><small>This GDPR notice is part of our commitment to data protection and privacy compliance.</small></p>
    </footer>
    </div>
  </main>
</template>

<style scoped>
.main-content {
  background: #f7f7f7;
  padding: 2rem 0;
  min-height: 100%;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.1);
}

.content-container h1 {
  color: #2566af;
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-align: center;
}
.effective-date {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-left: 4px solid #2566af;
}

.policy-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.policy-section:last-child {
  border-bottom: none;
}

.policy-section h2 {
  color: #2566af;
  font-size: 1.3rem;
  margin-bottom: 1rem;
}

.policy-section p {
  line-height: 1.6;
  margin-bottom: 1rem;
}

.policy-section ul {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.policy-section li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.policy-section a {
  color: #2566af;
  text-decoration: underline;
}

.policy-section a:hover {
  color: #174a7c;
}

.policy-footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}
</style>
