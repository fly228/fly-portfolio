export function Contact() {
  return (
    <section
      id="contact"
      className="px-6 md:px-12 py-24 bg-paper text-ink border-t border-ink/10"
    >
      <h2 className="text-3xl md:text-4xl tracking-tight mb-6">Contact</h2>
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
        <a
          href="mailto:fly228999@gmail.com"
          className="text-xl md:text-2xl underline underline-offset-4"
        >
          fly228999@gmail.com
        </a>
        <div className="flex flex-col gap-1 text-sm text-ink/60">
          <a href="https://cake.me/me/Fly-Weng" target="_blank" rel="noreferrer">
            cake.me/me/Fly-Weng
          </a>
          <a
            href="https://fly228999.wixsite.com/fly228motion"
            target="_blank"
            rel="noreferrer"
          >
            fly228999.wixsite.com/fly228motion
          </a>
          <a href="/Fly_Weng_CV.pdf">Download CV (PDF)</a>
        </div>
      </div>
    </section>
  );
}
