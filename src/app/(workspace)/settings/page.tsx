import { Download } from "lucide-react";
import { deleteAccount } from "@/app/account-actions";
import Link from "next/link";
import { requireUser } from "@/lib/data";
import { logout, updatePassword } from "@/app/actions";
export default async function Settings({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { user } = await requireUser();
  const { message } = await searchParams;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR LITTLE CORNER</span>
          <h1>Account settings</h1>
          <p>A simple account. A private workspace.</p>
        </div>
      </div>
      <section className="panel settings-panel">
        <h2>Your account</h2>
        <p className="muted">Signed in as</p>
        <strong>{user.email}</strong>
        <p className="tiny muted">
          We store only your authentication details, classes, and assignments.
        </p>
      </section>
      <section className="panel settings-panel">
        <h2>Change password</h2>
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        <form action={updatePassword} className="editor-form">
          <label>
            New password
            <input
              type="password"
              name="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
            />
          </label>
          <button className="button small">Update password</button>
        </form>
      </section>
      <section className="panel settings-panel data-controls">
        <h2>Your information, your choice</h2>
        <p>
          Download a copy of your account details, classes, and assignments. The
          export does not include your password or session tokens.
        </p>
        <a href="/api/account/export" className="secondary-button">
          <Download size={16} /> Download my data
        </a>
        <details className="account-delete">
          <summary>Delete my account</summary>
          <p>
            This permanently removes your account, classes, and assignments from
            the live database. Provider backups and security logs may expire
            separately. Export anything you want to keep first.
          </p>
          <form action={deleteAccount}>
            <label>
              Current password
              <input
                type="password"
                name="current_password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={128}
              />
            </label>
            <label>
              Type DELETE to confirm
              <input
                name="confirmation"
                autoComplete="off"
                pattern="DELETE"
                required
                placeholder="DELETE"
              />
            </label>
            <button className="danger-button">
              Permanently delete my account
            </button>
          </form>
        </details>
      </section>
      <p className="settings-privacy">
        <Link href="/privacy">
          Read our Privacy Policy & children’s privacy notice
        </Link>
      </p>
      <form action={logout}>
        <button className="secondary-button">Log out of Daylane</button>
      </form>
    </>
  );
}
