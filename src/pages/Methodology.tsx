import type { CatalogueRecord } from '../types';
import { TOOLS } from '../lib/tools';
import { IMPACT_INFO, IMPACT_ORDER } from '../lib/impact';
import { Link } from '../lib/router';
import AboutTabs from './AboutTabs';

const CONTENTS = [
  ['purpose', 'Why GridLens exists'],
  ['scope', 'What is counted'],
  ['sources', 'Where the evidence comes from'],
  ['checks', 'How each entry is checked'],
  ['dates', 'Study dates'],
  ['contributions', 'Code contributions'],
  ['model', 'How entries become projects'],
  ['measures', 'What the measures mean'],
  ['limits', 'Limits'],
] as const;

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-ink-800/80 pt-8">
      <h2 className="font-display text-3xl text-ink-50">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink-300 [&_strong]:font-medium [&_strong]:text-ink-100">{children}</div>
    </section>
  );
}

/** About GridLens, and how the data is collected, checked and measured. */
export default function Methodology({ catalogue }: { catalogue: CatalogueRecord[] }) {
  const countries = new Set(catalogue.flatMap((r) => r.countries)).size;
  const dated = catalogue.filter((r) => r.year).length;
  return (
    <div>
      <AboutTabs current="/about" />
      <h1 className="font-display mt-10 max-w-3xl text-5xl leading-tight text-ink-50">How GridLens knows who uses which tool</h1>
      <p className="mt-5 max-w-2xl text-lg text-ink-300">
        Every entry rests on a public source with a verbatim quote. This page explains where the evidence comes from,
        how it is checked, and what the numbers do and do not say.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Contents" className="lg:sticky lg:top-24 lg:self-start">
          <ol className="space-y-2 text-sm">
            {CONTENTS.map(([id, label], i) => (
              <li key={id}><a href={`#${id}`} className="flex gap-3 text-ink-400 hover:text-ink-100"><span className="font-mono text-xs text-ink-600">{String(i + 1).padStart(2, '0')}</span>{label}</a></li>
            ))}
          </ol>
        </nav>

        <div className="max-w-3xl space-y-12">
          <Block id="purpose" title="Why GridLens exists">
            <p>
              Funders, grid operators and researchers keep asking the same question: <em>who actually uses which energy system
              model, where, and for which grid decision?</em> The answers are scattered across annual reports, regulatory
              filings, case studies, conference papers and job posts. GridLens brings that evidence into one place, so you can
              see which tools are trusted for real decisions, and by whom.
            </p>
            <p>
              GridLens is built and maintained by <a className="text-brand-300 hover:text-brand-200" href="https://openenergytransition.org/" target="_blank" rel="noreferrer">Open Energy Transition</a>,
              a non-profit that develops open-source energy system models. Because OET is itself active in this field, every
              rule below is applied the same way to every tool, open or commercial, and the full data is public.
            </p>
          </Block>

          <Block id="scope" title="What is counted">
            <p>
              GridLens tracks {TOOLS.length} tools: {TOOLS.map((t) => t.name).join(', ')}. An entry is <strong>an organization
              using one of these tools in a project</strong>: running the model, commissioning a study made with it, or
              delivering one as a consultant. Training courses, software resale and passing mentions are not counted.
            </p>
            <p>
              Today the catalogue holds {catalogue.length.toLocaleString('en')} projects in {countries} countries.
            </p>
          </Block>

          <Block id="sources" title="Where the evidence comes from">
            <ul className="list-disc space-y-2 pl-5">
              <li><strong>Organizations’ own publications</strong>: reports, plans, studies and news on their websites, found by searching each country and by reading the sites of heavy users.</li>
              <li><strong>Vendor and community case studies</strong>, credited to the client that used the tool, never to the vendor itself.</li>
              <li><strong>Scholarly publications</strong> from <a className="text-brand-300 hover:text-brand-200" href="https://openalex.org" target="_blank" rel="noreferrer">OpenAlex</a> whose abstract reports using a tool, credited to the authors’ institutions.</li>
              <li><strong>Public user lists</strong> maintained by tool communities, each entry checked against its own source.</li>
              <li><strong>Code contributions</strong> to open-source tools from the public GitHub API (see <a className="text-brand-300 hover:text-brand-200" href="#contributions">code contributions</a>).</li>
            </ul>
            <p>Only public sources are used. Nothing is inferred from job titles or from an organization merely being a customer.</p>
          </Block>

          <Block id="checks" title="How each entry is checked">
            <p>
              Pages are read by open-weight language models running on our own hardware, which propose the organization, its
              role, the tool and the use. A proposal is kept only if its <strong>quote appears word for word in the source</strong>.
            </p>
            <p>
              A second, independent model then re-reads the source and judges whether the quote supports the claim. An entry is
              <strong> published</strong> when that check confirms it, or when the organization is the source’s own author or is
              named in the quote. Entries the check attributes to a different organization are dropped; the rest stay
              unpublished until better evidence turns up.
            </p>
            <p>
              Organization names are merged by hand-reviewed rules so that each organization appears once; a parent company and
              its subsidiary stay separate.
            </p>
          </Block>

          <Block id="dates" title="Study dates">
            <p>
              A project is dated by when the study was published or carried out, as precisely as its sources say: a day, a month
              or only a year. Page-update or copyright dates are not used, and years after today are plan horizons, not study
              dates. The study-year slider filters by year; projects whose year is unknown are left out of a period and the
              charts say how many, with a one-click option to include them.
            </p>
          </Block>

          <Block id="contributions" title="Code contributions">
            <p>
              For each open-source tool, GridLens reads every public repository of the tool’s GitHub organizations and counts,
              per person and month, <strong>merged pull requests</strong>, <strong>commits</strong> on the main branch (GitHub’s
              statistics cover the top 100 authors of each repository), <strong>reviews</strong> of other people’s pull
              requests and <strong>issues</strong> opened. Bots and AI coding agents are left out. The approach follows OET’s{' '}
              <a className="text-brand-300 hover:text-brand-200" href="https://openmod-tracker.org" target="_blank" rel="noreferrer">openmod-tracker</a>.
            </p>
            <p>
              A person counts for the organization written in the <strong>“Company” field of their public GitHub profile</strong>.
              People who leave it empty are not attributed to anyone. Name variants of one organization are merged, and the
              tool’s own GitHub organization does not count as an employer. No GitHub user names are published.
            </p>
            <p>
              <strong>To make your organization visible:</strong> ask your developers to set the Company field of their GitHub
              profile, preferably to your organization’s GitHub handle (for example <code>@open-energy-transition</code>), which
              also links it. If your organization appears under several names or without a link,{' '}
              <Link className="text-brand-300 hover:text-brand-200" href="/about/contact">tell us</Link> or add it to{' '}
              <a className="text-brand-300 hover:text-brand-200" href="https://github.com/open-energy-transition/gridlens/blob/main/data/contributor_orgs.json" target="_blank" rel="noreferrer">data/contributor_orgs.json</a>.
            </p>
            <p>
              These counts are hints, not a ranking of merit: documentation, teaching, user support, funding and the upstream and
              downstream projects the tools depend on are not counted.
            </p>
          </Block>

          <Block id="model" title="How entries become projects">
            <p>
              One study is one <strong>project</strong>, with every organization involved and every country it covers. A study for
              a region or the whole world shows up when you filter by any country it covers, after that country’s own studies.
              Recurring reports, such as a yearly adequacy outlook, count once per edition.
            </p>
            <p>
              The <strong>year</strong> is the publication date stated in the source. Plan horizons (“to 2040”) and web-page update
              dates are not used. {dated.toLocaleString('en')} of {catalogue.length.toLocaleString('en')} projects have a known year;
              charts over time leave the others out.
            </p>
          </Block>

          <Block id="measures" title="What the measures mean">
            <dl className="space-y-3">
              {IMPACT_ORDER.map((i) => (
                <div key={i}><dt className="font-medium text-ink-100">{IMPACT_INFO[i].label}</dt><dd>{IMPACT_INFO[i].description}</dd></div>
              ))}
              <div><dt className="font-medium text-ink-100">Decision-makers</dt><dd>Grid and system operators, utilities, regulators and ministries: the organizations whose own decisions the modelling informs.</dd></div>
              <div><dt className="font-medium text-ink-100">Grid decision</dt><dd>The kind of decision a project supports, taken from the source. When the source does not state it, the project says “decision inferred”.</dd></div>
              <div><dt className="font-medium text-ink-100">Adoption</dt><dd>Distinct organizations with at least one documented project. One organization counts once per tool, however many projects it ran.</dd></div>
              <div><dt className="font-medium text-ink-100">Evidence strength</dt><dd>How directly the source shows the use, as rated when the entry was checked. Every project links its sources, so you can judge for yourself.</dd></div>
            </dl>
          </Block>

          <Block id="limits" title="Limits">
            <ul className="list-disc space-y-2 pl-5">
              <li><strong>Absence is not evidence.</strong> Many organizations never publish which tools they use, so counts show documented use, not market share.</li>
              <li>Sources in English and from large organizations are easier to find, so some regions are under-represented.</li>
              <li>Vendors publish case studies, communities publish user lists; tools with neither are harder to document.</li>
              <li>GridLens reports documented use; it does not rate or recommend tools. See <Link href="/about/legal" className="text-brand-300 hover:text-brand-200">legal &amp; privacy</Link>.</li>
              <li>Model-assisted reading can still be wrong. Every entry links to its source so you can check it, and <Link href="/about/contact" className="text-brand-300 hover:text-brand-200">corrections are welcome</Link>.</li>
            </ul>
          </Block>

        </div>
      </div>
    </div>
  );
}
