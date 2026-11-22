import { Reveal } from "@/components/motion/reveal";

export function SectionHeader({
  index,
  label,
  title,
  description,
  id,
}: {
  index: string;
  label: string;
  title: string;
  description?: string;
  id?: string;
}) {
  return (
    <Reveal className="mb-12 grid gap-6 border-t border-line pt-6 md:mb-16 md:grid-cols-12">
      <p className="label md:col-span-3">
        <span className="text-accent">{index}</span>
        <span className="mx-2 text-faint" aria-hidden>/</span>
        {label}
      </p>
      <div className="md:col-span-9">
        <h2 id={id} className="display max-w-3xl text-[clamp(1.9rem,3.6vw,3rem)] text-fg">
          {title}
        </h2>
        {description ? <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{description}</p> : null}
      </div>
    </Reveal>
  );
}
