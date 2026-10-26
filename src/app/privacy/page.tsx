import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Brand } from "@/components/brand";
export const metadata = {
  title: "Privacy Policy & Children’s Privacy — Focusly",
};
export default function Privacy() {
  const contact =
    process.env.NEXT_PUBLIC_PRIVACY_EMAIL || "hellofocusly@gmail.com";
  const operator = process.env.NEXT_PUBLIC_OPERATOR_NAME || "Focusly Inc.";
  return (
    <div className="policy-page">
      <header>
        <Brand />
        <Link href="/login">Log in</Link>
      </header>
      <main>
        <Link className="text-link" href="/">
          <ArrowLeft size={14} /> Back to Focusly
        </Link>
        <span className="recovery-icon">
          <ShieldCheck size={25} />
        </span>
        <span className="eyebrow">YOUR SPACE. YOUR INFORMATION.</span>
        <h1>Privacy, in plain language.</h1>
        <p className="policy-intro">
          How Focusly handles your information, and how we approach children’s
          privacy.
        </p>
        <p className="policy-date">Effective October 26, 2026</p>
        {!contact && (
          <div className="notice">
            Policy publication is incomplete: the operator’s legal name and
            privacy contact must be provided before a public launch.
          </div>
        )}
        <section>
          <h2>1. Who operates Focusly</h2>
          <p>
            Focusly is a student productivity service operated by {operator}.{" "}
            {contact ? (
              <>
                For privacy requests, contact{" "}
                <a href={"mailto:" + contact}>{contact}</a>.
              </>
            ) : (
              "A privacy contact has not yet been published. Do not send sensitive information through your classes or assignments."
            )}
          </p>
        </section>
        <section>
          <h2>2. Information we process</h2>
          <p>
            We process your account email, authentication identifiers, password
            credentials handled by Supabase, class names and colors, assignment
            titles, due dates, priorities, completion status, timestamps, and
            signup eligibility and policy acknowledgements. We do not request
            your birth date, school name, student ID, address, grades, or
            precise location.
          </p>
          <p>
            Hosting and authentication providers may process IP addresses,
            device/browser information, request logs, and authentication events
            to deliver and secure the service. Avoid adding sensitive personal
            information to class names or assignment titles.
          </p>
        </section>
        <section>
          <h2>3. Why we use it</h2>
          <p>
            We use this information to authenticate you, store and display your
            workspace, recover access to your account, respond to requests,
            maintain reliability, and prevent abuse. The app does not include
            advertising trackers or sell personal information. If we add other
            processing, this policy must be updated.
          </p>
        </section>
        <section>
          <h2>4. Providers and disclosures</h2>
          <p>
            Supabase provides authentication and database storage. Vercel
            provides hosting. Email-delivery providers configured for
            authentication may process your email address and delivery
            information. Providers may process information outside your country
            depending on their configuration. We may disclose information when
            required by law or to address security incidents. We do not offer
            your workspace to advertisers or other students.
          </p>
        </section>
        <section>
          <h2>5. Cookies and security</h2>
          <p>
            Essential authentication cookies keep you signed in and support
            account recovery. Your light, dark, or system appearance preference
            and an under-13 signup-block flag (when applicable) are stored
            locally in your browser and are not used for tracking. Access to
            workspace records is restricted through authentication and database
            ownership policies. No system can guarantee absolute security.
            Signing out ends the app session; you may also clear site data in
            your browser.
          </p>
        </section>
        <section>
          <h2>6. Retention and your choices</h2>
          <p>
            Your account and workspace are retained while needed to provide the
            service. You can edit or delete classes and assignments in the app.
            You can download a copy of your account and workspace and
            permanently delete your account in Account settings. You may also
            request a copy, correction, or deletion of your account information
            through the privacy contact. Account deletion removes live account
            and workspace records; providers may retain backups and security
            logs separately. Backups and security logs may remain according to
            provider retention settings and legal obligations; we do not promise
            immediate removal from every backup.
          </p>
        </section>
        <section id="children">
          <h2>7. Children’s privacy and COPPA</h2>
          <p>
            Focusly is intended for people aged 13 and older and is not directed
            to children under 13. Do not create an account if you are under 13.
            A neutral age-group screen blocks under-13 selections before asking
            for an email. A local browser flag keeps the signup screen blocked
            in that browser. Signup also requires an age-eligibility attestation
            before account creation; we do not ask for a birth date. This is an
            eligibility declaration, not verified age assurance or verifiable
            parental consent.
          </p>
          <p>
            We do not knowingly collect personal information from children under
            13. If a parent or guardian believes a child under 13 has provided
            information, contact the operator without sending the child’s
            password or unnecessary identifying information. The operator should
            investigate, prevent further collection, and remove affected
            information as appropriate. Focusly does not currently offer
            accounts for children under 13 or a parental-consent process.
          </p>
          <p>
            If applicable law requires parental permission for a user aged 13 or
            older, they should obtain that permission before using the service.
            Schools should not deploy Focusly for under-13 students. These
            safeguards do not constitute a certification of COPPA compliance;
            the operator must assess actual use and legal obligations before
            launch.
          </p>
        </section>
        <section>
          <h2>8. Changes and contact</h2>
          <p>
            We will update the effective date when this policy changes and
            provide appropriate notice for material changes.{" "}
            {contact ? (
              <>
                Contact <a href={"mailto:" + contact}>{contact}</a> for privacy
                and children’s privacy requests.
              </>
            ) : (
              "The operator must publish a monitored privacy contact before opening the service to the public."
            )}
          </p>
        </section>
      </main>
      <footer>Focusly · Less stress. More progress.</footer>
    </div>
  );
}
