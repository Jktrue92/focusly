import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  Circle,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { Brand } from "@/components/brand";
export default function Home() {
  return (
    <div className="landing">
      <header className="public-nav">
        <Brand />
        <nav>
          <a href="#features">Why Daylane?</a>
          <Link href="/login">Log in</Link>
          <Link className="button small" href="/signup">
            Get started <ArrowRight size={15} />
          </Link>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles size={14} /> A LITTLE STRUCTURE. A LOT MORE CLARITY.
            </span>
            <h1>
              Your semester.
              <br />A little <span>lighter.</span>
            </h1>
            <p>
              All your classes and assignments, in one calm space.
              <br className="desktop" /> Less juggling. More time for what
              matters.
            </p>
            <Link href="/signup" className="button">
              Find your focus <ArrowRight size={18} />
            </Link>
            <div className="hero-note">
              <span className="avatar-stack">
                <i>J</i>
                <i>A</i>
                <i>M</i>
              </span>
              <span>
                Built for student life.
                <br />
                <strong>Less stress. More progress.</strong>
              </span>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Illustrative preview of the Daylane workspace"
          >
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="floating-badge">
              <Zap size={16} /> A clearer head starts here
            </div>
            <div className="preview">
              <div className="preview-top">
                <span className="mini-logo">
                  <Sparkles size={16} /> My workspace
                </span>
                <span className="dots">•••</span>
              </div>
              <span className="muted tiny">YOUR DAY, AT A GLANCE</span>
              <h3>
                Let’s make a little progress <span>✦</span>
              </h3>
              <div className="preview-stats">
                <div>
                  <strong>03</strong>
                  <span>Due today</span>
                </div>
                <div>
                  <strong>08</strong>
                  <span>Completed</span>
                </div>
                <div className="preview-ring">
                  <CheckCheck size={26} />
                </div>
              </div>
              <div className="preview-label">
                Today’s focus <span>3 assignments</span>
              </div>
              {[
                ["#7065F0", "Literature", "Read chapter 04", "10:00 AM"],
                ["#DEAF68", "Design studio", "Finish moodboard", "2:00 PM"],
                ["#74A69A", "Psychology", "Review lecture notes", "4:30 PM"],
              ].map(([color, subject, title, time], i) => (
                <div className="preview-task" key={subject}>
                  <span className="preview-check">
                    {i === 2 ? <Check size={13} /> : <Circle size={16} />}
                  </span>
                  <div>
                    <small style={{ color }}>{subject}</small>
                    <p>{title}</p>
                  </div>
                  <time>{time}</time>
                </div>
              ))}
            </div>
            <div className="floating-progress">
              <span className="progress-icon">
                <Check size={19} />
              </span>
              <div>
                A little progress, every day.<small>You’ve got this.</small>
              </div>
              <Sparkles size={16} />
            </div>
            <span className="preview-caption">
              AN EXAMPLE OF A MORE ORGANIZED DAY
            </span>
          </div>
        </section>
        <section className="trust-strip">
          <span>LESS MENTAL CLUTTER.</span>
          <p>One place for everything on your plate.</p>
          <div>
            <BookOpen size={17} /> Classes <i /> <CalendarDays size={17} />{" "}
            Assignments <i /> <Target size={17} /> Your goals
          </div>
        </section>
        <section id="features" className="features">
          <span className="eyebrow">MAKE ROOM FOR WHAT MATTERS</span>
          <h2>Organized feels good.</h2>
          <p>A thoughtful little toolkit for a busy student life.</p>
          <div className="feature-grid">
            {[
              [
                BookOpen,
                "A home for every class",
                "Keep your courses together, color coded and easy to find.",
              ],
              [
                CalendarDays,
                "Deadlines, under control",
                "See what’s due, choose your priorities, and take it one task at a time.",
              ],
              [
                CheckCheck,
                "Progress you can feel",
                "Turn small wins into momentum. Your next step is always clear.",
              ],
            ].map(([Icon, title, description]) => {
              const I = Icon as typeof BookOpen;
              return (
                <article key={String(title)}>
                  <span className="feature-icon">
                    <I size={23} />
                  </span>
                  <h3>{String(title)}</h3>
                  <p>{String(description)}</p>
                </article>
              );
            })}
          </div>
        </section>
        <section className="bottom-cta">
          <div>
            <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
            <h2>A calmer semester awaits.</h2>
          </div>
          <Link href="/signup" className="button">
            Create your workspace <ArrowRight size={17} />
          </Link>
        </section>
      </main>
      <footer>
        <Brand />
        <span>Less stress. More progress.</span>
        <Link href="/privacy">Privacy & children’s privacy</Link>
      </footer>
    </div>
  );
}
