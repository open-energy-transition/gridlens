import SectionHeader from '../components/common/SectionHeader';
import Changelog from '../components/common/Changelog';

export default function ChangelogPage() {
  return (
    <div>
      <SectionHeader
        title="Changelog"
        description="Every organization added, removed, or reclassified in the dataset, with evidence. App-only changes (design, bug fixes) aren't tracked here — this is a record of what changed in the data."
      />
      <Changelog />
    </div>
  );
}
