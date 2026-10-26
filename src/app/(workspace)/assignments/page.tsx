import { workspaceData } from "@/lib/data";
import { AssignmentForm, AssignmentList } from "@/components/assignments";
export default async function Assignments() {
  const { classes, assignments } = await workspaceData();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SMALL STEPS, REAL PROGRESS</span>
          <h1>Assignments</h1>
          <p>Get it out of your head. Make a little plan.</p>
        </div>
      </div>
      <section className="panel">
        <h2>Add an assignment</h2>
        <AssignmentForm classes={classes} />
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>On your plate</h2>
          <span className="pill">
            {assignments.filter((a) => !a.completed).length} remaining
          </span>
        </div>
        <AssignmentList assignments={assignments} classes={classes} editable />
      </section>
    </>
  );
}
