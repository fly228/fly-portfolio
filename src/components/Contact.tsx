import { Button } from "./Button";

export function Contact() {
  return (
    <section
      id="contact"
      className="px-6 md:px-12 py-24 text-ink border-t border-ink/10"
    >
      <h2 className="text-3xl md:text-4xl tracking-normal mb-4 leading-snug">
        有想講清楚的東西？
      </h2>
      <p className="text-ink/60 text-sm leading-relaxed max-w-md mb-8">
        簡報、介面或影像，只要是「內容很多、需要被看懂」的案子，都可以聊。
      </p>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <Button href="mailto:fly228999@gmail.com">寫信給我</Button>
        <div className="flex flex-col gap-1 text-sm text-ink/60">
          <a href="https://cake.me/me/Fly-Weng" target="_blank" rel="noreferrer" data-cursor="hover">
            cake.me/me/Fly-Weng
          </a>
          <a
            href="https://fly228999.wixsite.com/fly228motion"
            target="_blank"
            rel="noreferrer"
            data-cursor="hover"
          >
            fly228999.wixsite.com/fly228motion
          </a>
          <a href="/Fly_Weng_CV.pdf" data-cursor="hover">
            下載履歷（PDF）
          </a>
        </div>
      </div>
    </section>
  );
}
