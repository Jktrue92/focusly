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
      <form action={logout}>
        <button className="secondary-button">Log out of Focusly</button>
      </form>
    </>
  );
}
