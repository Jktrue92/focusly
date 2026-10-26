import { BookOpen, Trash2 } from "lucide-react";
import { workspaceData } from "@/lib/data";
import { saveClass, deleteClass } from "@/app/actions";
export default async function Classes() {
  const { classes, assignments } = await workspaceData();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A PLACE FOR EVERY SUBJECT</span>
          <h1>My classes</h1>
          <p>Your semester, a little more organized.</p>
        </div>
      </div>
      <section className="panel">
        <h2>Add a class</h2>
        <form action={saveClass} className="class-form">
          <label>
            Class name
            <input
              name="name"
              required
              maxLength={80}
              placeholder="e.g. Introduction to Psychology"
            />
          </label>
          <label>
            Color
            <input name="color" type="color" defaultValue="#7065f0" />
          </label>
          <button className="button small">Add class</button>
        </form>
      </section>
      <div className="classes-grid">
        {classes.map((c) => (
          <article
            className="panel class-card"
            key={c.id}
            style={{ borderTopColor: c.color }}
          >
            <BookOpen style={{ color: c.color }} />
            <h2>{c.name}</h2>
            <p className="muted">
              {
                assignments.filter((a) => a.class_id === c.id && !a.completed)
                  .length
              }{" "}
              assignments to do
            </p>
            <details>
              <summary>Edit class</summary>
              <form action={saveClass} className="editor-form">
                <input type="hidden" name="id" value={c.id} />
                <label>
                  Class name
                  <input
                    name="name"
                    required
                    maxLength={80}
                    defaultValue={c.name}
                  />
                </label>
                <label>
                  Color
                  <input type="color" name="color" defaultValue={c.color} />
                </label>
                <button className="button small">Save changes</button>
              </form>
            </details>
            <details className="delete-details">
              <summary>Delete class</summary>
              <p className="tiny muted">
                Assignments are kept and become unassigned.
              </p>
              <form action={deleteClass}>
                <input type="hidden" name="id" value={c.id} />
                <button className="danger-button">
                  <Trash2 size={14} /> Confirm deletion
                </button>
              </form>
            </details>
          </article>
        ))}
      </div>
      {!classes.length && (
        <div className="empty">
          <BookOpen />
          <h3>Your fresh semester starts here.</h3>
          <p>Add a class above to give your assignments a home.</p>
        </div>
      )}
    </>
  );
}
