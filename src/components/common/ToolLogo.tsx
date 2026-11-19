import { logoOf } from '../../lib/tools';
import { slug } from '../../lib/router';

/** A tool's logo on a light tile (vendor marks are often dark), or its initials when we have no logo. */
export default function ToolLogo({ name, size = 28 }: { name: string; size?: number }) {
  const src = logoOf(slug(name));
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[22%] bg-ink-50 font-semibold text-ink-900"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" className="h-full w-full object-contain" loading="lazy" /> : name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()}
    </span>
  );
}
