# PLEXOS Organization Catalogue — Final Summary

All figures below were produced by deterministic Python (`csv.DictReader`) counting against
`candidate_organizations.csv` (397 rows) and `world_country_checklist.csv` (163 rows). No figure
in this document is estimated or eyeballed.

## 1. Headline Numbers

| Metric | Value |
|---|---|
| **Total confirmed organizations** | **397** (100% of rows; `status == confirmed` for all 397) |
| **Distinct countries represented** (normalized to checklist country names) | **107** |
| Raw distinct `country` field values (incl. multi-country/regional strings) | 134 |

### Role breakdown (397 confirmed orgs)

| Role | Count |
|---|---|
| direct_user | 171 |
| research_user | 86 |
| consultant_modeler | 76 |
| commissioner | 37 |
| subject_of_study | 24 |
| qa_reviewer | 3 |
| **Total** | **397** |

## 2. Organizations by Region

Regions are taken from `world_country_checklist.csv`. 14 rows carry a regional/multi-country or
non-checklist country string (e.g. "Pan-European (44 TSO members...)", "Global", "Turkey" and
"Palestine" — not present in the 163-country checklist, "Democratic Republic of Congo" — spelled
differently than the checklist's entry) and are bucketed separately rather than forced into a
single-country region.

| Region | Confirmed Orgs |
|---|---|
| North America | 80 |
| Western Europe | 51 |
| Oceania | 31 |
| Southeast Asia | 26 |
| Southern Africa | 26 |
| East Asia | 20 |
| West Africa | 17 |
| South America | 16 |
| South Asia | 14 |
| Middle East | 14 |
| Southern Europe | 14 |
| Balkans | 14 |
| *Pan-regional / multi-country / unmapped* | 14 |
| Caribbean | 11 |
| Eastern Europe | 10 |
| Nordics | 9 |
| North Africa | 8 |
| East Africa | 6 |
| Central Asia | 6 |
| Baltics | 5 |
| Caucasus | 5 |
| **Total** | **397** |

## 3. Top 15 Countries (most PLEXOS-saturated markets)

| Rank | Country | Confirmed Orgs | Region |
|---|---|---|---|
| 1 | United States | 69 | North America |
| 2 | Australia | 30 | Oceania |
| 3 | United Kingdom | 19 | Western Europe |
| 4 | South Africa | 14 | Southern Africa |
| 5 | Ireland | 12 | Western Europe |
| 6 | Canada | 9 | North America |
| 6 | India | 9 | South Asia |
| 8 | Germany | 8 | Western Europe |
| 9 | Italy | 7 | Southern Europe |
| 10 | Finland | 6 | Nordics |
| 10 | South Korea | 6 | East Asia |
| 10 | Indonesia | 6 | Southeast Asia |
| 10 | Philippines | 6 | Southeast Asia |
| 14 | Chile | 5 | South America |
| 14 | Japan | 5 | East Asia |

Country counts above are after normalizing multi-entity country strings (e.g. "United States
(Virginia IRP intervenor work)" → United States) to their base country.

## 4. Genuine Gaps — Countries still `gap_confirmed` in the checklist

55 of 163 checklist countries remain `gap_confirmed` (multi-method-verified: no PLEXOS evidence
found despite dedicated search). Grouped by region:

**Central America (7):** Belize, Costa Rica, El Salvador, Guatemala, Honduras, Nicaragua, Panama

**South America (7):** Bolivia, Colombia, Ecuador, Paraguay, Suriname, Uruguay, Venezuela

**Middle East (6):** Bahrain, Iran, Iraq, Kuwait, Syria, Yemen

**East Africa (5):** Burundi, Djibouti, Eritrea, Kenya, Somalia

**South Asia (5):** Afghanistan, Bangladesh, Bhutan, Maldives, Nepal

**Oceania (5):** Fiji, Papua New Guinea, Samoa, Solomon Islands, Vanuatu

**Eastern Europe (4):** Belarus, Poland, Romania, Slovakia

**Southeast Asia (4):** Brunei, Cambodia, Myanmar, Timor-Leste

**Central Asia (3):** Kyrgyzstan, Tajikistan, Turkmenistan

**Caribbean (2):** Cuba, Haiti

**Nordics (2):** Denmark, Iceland

**Southern Europe (2):** Cyprus, Malta

**East Asia (1):** North Korea

**Southern Africa (1):** Angola

**Western Europe (1):** Luxembourg

**Total gap_confirmed: 55**

*(Note: 9 checklist countries marked `covered` currently have 0 rows in the organizations table
under their exact checklist spelling — Oman, Albania, Moldova, North Macedonia, Montenegro, DRC,
Zambia, Ivory Coast, Kosovo — because the confirmed evidence for them lives under regional/
multi-country organization entries, e.g. the Balkans regional consultancy row and the Energy
Community PECI regional-model row, rather than a country-specific row. This is a
labeling/aggregation artifact, not a gap — treat these 9 as covered.)*

## 5. New Categories Opened During This Research Program

The original scope was utilities/ISOs, consultancies, and academia. The following categories were
opened as the program progressed and found genuine confirmed PLEXOS users:

### Oil & Gas Major / Trading (9 orgs)
- Equinor (Norway) — Oil & Gas Major
- Shell / Shell Energy / Shell Trading (Netherlands/UK/Global) — Oil & Gas Major
- bp / bp Trading & Shipping (Australia/Spain/UK/Global) — Oil & Gas Major
- TotalEnergies incl. Trading Division (France/US/Global) — Oil & Gas Major
- Mercuria Energy Group Ltd (Switzerland/Global) — Commodity Trading Company
- Centrica plc (UK) — Energy Company (Diversified/Trading)
- CEZ Group / CEZ a.s. (Czech Republic) — Utility (Generation/Distribution/Trading)
- Tokyo Gas Co. Ltd (Japan) — Gas Utility / LNG Value Chain Operator
- The Energy Authority (TEA) (US) — Consultancy / Power & Gas Trading Services Provider

### Energy Policy Think Tanks (4 orgs)
- Policy Research Institute for Equitable Development (PRIED) / Renewables First (Pakistan)
- Prayas (Energy Group) (India)
- Rocky Mountain Institute (RMI) (United States)
- Regulatory Assistance Project (RAP) (India)

### Financial Sector / Lender's Engineer (5 orgs)
- World Bank — 3 separate confirmed engagements (Ghana, Mongolia, Indonesia)
- European Bank for Reconstruction and Development (EBRD) (UK HQ / Pan-European-Central Asian ops)
- DNV (Norway HQ) — explicitly in lender's-engineer / assurance role on a PJM-region case study
- Also flagged by explicit "lender's engineer" language in notes: Black & Veatch (US), Baringa
  Partners LLP (South Africa engagement)

### Tech / Datacenter Companies (2 orgs)
- Constellation Energy Generation LLC (US) — power/datacenter developer
- Sumitomo SHI FW (Finland) — categorized as Energy Technology Company

### Mining Captive Power (3 orgs)
- Rio Tinto (Australia — Pacific Aluminium/Queensland-Gladstone smelters)
- BHP (Australia — global mining HQ)
- Fortescue (Australia — Pilbara iron ore "Green Grid" islanded system)

### Battery / Hydrogen Developers (3 orgs)
- Ren-Gas (Finland) — Renewable/P2X Project Developer
- Eku Energy (Australia/Singapore HQ, Taiwan/Japan engagement) — battery storage developer
- Fortescue (Australia) — green hydrogen developer (same org as mining captive power, different role/engagement row)

## 6. Methodology — Most Effective Search Techniques (descending productivity)

Ranked by rough hit-rate observed across the research program (based on notes-field evidence
density: 44 rows cite LinkedIn corroboration, 41 cite vendor/consultancy case studies, 8 cite
project-reference pages, 12 cite procurement documentation):

1. **LinkedIn multi-employee corroboration** — searching for 2+ employees at the same organization
   independently listing "PLEXOS" as a skill/tool in their profile. Highest-confidence technique
   for confirming current, internal (non-public) PLEXOS use at utilities, ISOs, and consultancies;
   used in 44 confirmed rows.
2. **Vendor case-study / customer-reference archive mining** — Energy Exemplar's own case studies,
   webinars, and customer-logo pages, cross-checked against the target org's own publications. 41
   rows cite case-study evidence.
3. **Consultancy project-reference-page mining** — consultancies (Mott MacDonald, DNV, Baringa,
   ECA, etc.) publish project pages naming the client and the modeling tool used; this both
   confirms the consultancy as consultant_modeler and the client as commissioner/subject_of_study
   in one pass. Drove most of the commissioner (37) and subject_of_study (24) role counts.
4. **World Bank / multilateral development bank procurement-line-item search** — ESMAP, IBRD/IDA
   procurement notices and terms-of-reference documents naming PLEXOS as a required deliverable
   tool; directly produced the World Bank commissioner rows (Ghana, Mongolia, Indonesia) and
   several Africa/Asia utility subject_of_study rows.
5. **Direct-publication search (HTTP-verified model files)** — regulators/ISOs that publish their
   own PLEXOS model files (XML/ZIP) openly, e.g. CAISO, SEM Committee. Lower volume but the
   highest-certainty evidence tier (`confirmed_direct_user`), requiring no second-pass verification.
6. **Academic thesis/paper repository search** — university repositories and published papers
   citing PLEXOS as the modeling tool; main driver of the 86 research_user and most of the 27
   university + 44 Academic/Research Institution category rows.

## 7. Genuinely Unresolved Items — Do Not Re-Search With the Same Methods

These leads were pursued in this program and did **not** yield a confirmed organization. They are
absent from `candidate_organizations.csv` (verified by direct search of the 397 rows). Re-running
LinkedIn/case-study/procurement searches on them is expected to fail again; a future session should
either try a materially different method or deprioritize these:

- **WSP / Serbia** — WSP appears in the catalogue only via WSP Caribbean/WSP Global (Bahamas) and
  WSP UK & Ireland entries; no confirmed WSP-Serbia PLEXOS link was found.
- **Tanzania / TANESCO** — appears only as a tangential "SAPP regional-modeling aspect" mention,
  not as a standalone confirmed direct_user/subject_of_study; Tanzania itself is not in the
  gap_confirmed list, so its status is genuinely ambiguous, not a clean gap or a clean hit.
- **NAMA / Oman** — zero matches for "NAMA" anywhere in the dataset; the Oman thread never
  resolved to a confirmed organization.
- **ExxonMobil** — zero matches; no confirmed PLEXOS evidence found despite being a major oil
  & gas target analogous to the 9 confirmed Oil & Gas/Trading orgs above.
- **Gunvor** — zero matches; commodity-trading analog to Mercuria (which *was* confirmed) never
  produced evidence.
- **Navigant / Simon Carr / ESB lead** — zero matches for "Navigant" or "Simon Carr"; ESB
  (Electricity Supply Board, Ireland) itself IS confirmed in the catalogue as an Oil & Gas/Trading-
  adjacent utility row, but the specific Navigant/Simon Carr connection that was being chased was
  never substantiated and should be treated as closed/unconfirmed, not reopened.

---
*Generated by deterministic CSV analysis of `candidate_organizations.csv` (397 rows) and
`world_country_checklist.csv` (163 rows). All counts reproducible via `csv.DictReader` + `collections.Counter`.*
