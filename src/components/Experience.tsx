import { experience } from "../data/experience";

export function Experience() {
  return (
    <section className="px-6 md:px-12 py-24 text-ink">
      <h2 className="text-3xl md:text-4xl tracking-normal mb-12 leading-snug">
        十四年，六個團隊，
        <br className="md:hidden" />
        同一件事。
      </h2>
      <div className="divide-y divide-ink/10">
        {experience.map((job) => (
          <div
            key={job.company + job.period}
            className="py-6 grid grid-cols-1 md:grid-cols-[220px_1fr_110px] gap-3 md:gap-8 items-start"
          >
            <div>
              <p className="font-medium">{job.company}</p>
              <p className="text-sm text-ink/50">{job.role}</p>
              <p className="text-xs text-ink/40 mt-1">{job.period}</p>
            </div>
            <ul className="space-y-1 max-w-[60ch]">
              {job.bullets.map((b) => (
                <li key={b} className="text-sm text-ink/70">
                  {b}
                </li>
              ))}
            </ul>
            <div className="md:text-right">
              <span className="pixel-notch-sm inline-block text-[11px] border border-ink/20 text-ink/60 px-2 py-1">
                {job.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
