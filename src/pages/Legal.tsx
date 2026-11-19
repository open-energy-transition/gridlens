import AboutTabs from './AboutTabs';
import { Link } from '../lib/router';

const OET = 'https://www.openenergytransition.org';

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-ink-800/80 pt-6">
      <h2 className="font-display text-2xl text-ink-50">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-300">{children}</div>
    </section>
  );
}

const a = 'text-brand-300 hover:text-brand-200';

/** Imprint, privacy, disclaimer, trademarks and the correction process. */
export default function Legal() {
  return (
    <div>
      <AboutTabs current="/about/legal" />
      <h1 className="font-display mt-10 text-5xl text-ink-50">Legal</h1>
      <div className="mt-8 max-w-3xl space-y-8">
        <Block title="Publisher">
          <p>
            GridLens is published by Open Energy Transition gGmbH. The legal notice (Impressum) is on{' '}
            <a className={a} href={`${OET}/imprint`} target="_blank" rel="noreferrer">openenergytransition.org/imprint</a>.
          </p>
        </Block>
        <Block title="Privacy">
          <p>
            GridLens sets no cookies, has no accounts, and uses no analytics or tracking. Everything, including fonts and map
            data, is served from this site, and filters are processed in your browser. The site is hosted on GitHub Pages,
            whose servers log technical access data such as IP addresses to deliver and secure the site. Links to sources and
            organizations take you to other websites with their own privacy policies. Open Energy Transition’s full privacy
            statement is on <a className={a} href={`${OET}/privacy-statement`} target="_blank" rel="noreferrer">openenergytransition.org/privacy-statement</a>.
          </p>
        </Block>
        <Block title="Nature of the information">
          <p>
            GridLens reports that public sources document an organization’s use of a tool. It does not rate, rank or recommend
            tools or vendors, and it makes no statement about any tool’s quality, price, market share or suitability. Counts
            reflect what has been found in public sources and are incomplete by nature. The information is provided as is,
            without warranty, and is not professional advice. Every entry links to its source.
          </p>
        </Block>
        <Block title="Trademarks">
          <p>
            Product names, company names and logos are trademarks of their respective owners. They are used only to identify
            the tools and organizations the public sources refer to. GridLens is independent: it is not affiliated with,
            sponsored or endorsed by any software vendor or organization listed.
          </p>
        </Block>
        <Block title="Corrections and removal">
          <p>
            If an entry is wrong, or you represent an organization or vendor and want a correction or a logo removed, please{' '}
            <Link className={a} href="/about/contact">contact us</Link>. Requests are handled promptly, and changes to the data are
            listed in the <Link className={a} href="/about/changelog">changelog</Link>.
          </p>
        </Block>
        <Block title="Licence">
          <p>
            The GridLens code and data are released under the{' '}
            <a className={a} href="https://github.com/open-energy-transition/gridlens/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT licence</a>.
            Quotes from sources remain the property of their authors and are reproduced briefly to document each entry. Code
            contribution data comes from the public GitHub API.
          </p>
        </Block>
      </div>
    </div>
  );
}
