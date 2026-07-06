import { experience } from "../data/experience";

export function Experience() {
  return (
    <section className="px-6 md:px-12 py-24 bg-paper text-ink">
      <h2 className="text-3xl md:text-4xl tracking-tight mb-12">Experience</h2>
      <div className="divide-y divide-ink/10 max-w-3xl">
        {experience.map((job) => (
          <div
            key={job.company + job.period}
            className="py-6 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-2 md:gap-8"
          >
            <div>
              <p className="font-medium">{job.company}</p>
              <p className="text-sm text-ink/50">{job.role}</p>
              <p className="text-xs text-ink/40 mt-1">{job.period}</p>
            </div>
            <ul className="space-y-1">
              {job.bullets.map((b) => (
                <li key={b} className="text-sm text-ink/70">
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
