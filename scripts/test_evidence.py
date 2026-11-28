"""Unit tests for check_evidence.py and audit_dataset.py (python3 -m unittest discover -s scripts)."""
import unittest
from unittest import mock

import audit_dataset as ad
import check_evidence as ce


class Evidence(unittest.TestCase):
    def test_quote_survives_markdown_line_breaks_and_typographic_quotes(self):
        page = "**Results.** The model was built\nin PLEXOS® by the “planning team” — see annex."
        self.assertTrue(ce.quote_on_page('The model was built in PLEXOS® by the "planning team" - see annex', page))
        self.assertFalse(ce.quote_on_page("The model was built in PyPSA", page))

    def test_markdown_links_and_symbols_in_a_stored_quote_still_match(self):
        page = "Calliope framework easy method for case studies. See Australia's first national hydrogen assessment."
        self.assertTrue(ce.quote_on_page("Calliope framework → easy method for case studies", page))
        self.assertTrue(ce.quote_on_page("[Australia's first national hydrogen assessment](https://x.org/h2)", page))

    def test_long_quote_broken_by_a_pdf_hyphenation_still_matches(self):
        quote = "The transmission system was modelled and simulated using PSCAD-EMTDC software to conduct the stability study."
        page = quote.replace("simulated", "simu- lated")
        self.assertTrue(ce.quote_on_page(quote, page))

    def test_ambiguous_tool_names_need_their_capitalised_form(self):
        self.assertTrue(ce.names_tool("LEAP", "scenarios were run in LEAP for 2050"))
        self.assertFalse(ce.names_tool("LEAP", "a leap in renewable capacity"))
        self.assertTrue(ce.names_tool("SDDP", "PSR's SDDP model"))
        self.assertFalse(ce.names_tool("SDDP", "an sddp algorithm for hydro scheduling"))
        self.assertTrue(ce.names_tool("TIMES", "the TIMES-PT model"))
        self.assertFalse(ce.names_tool("TIMES", "three times more capacity"))
        self.assertTrue(ce.names_tool("PowerFactory", "DIgSILENT simulations"))

    def test_html_text_skips_scripts_and_keeps_date_metadata(self):
        body = (b'<html><head><meta name="citation_publication_date" content="2021/03/04">'
                b"<script>var x='PLEXOS'</script></head><body><p>Report &amp; annex</p></body></html>")
        text, meta = ce.page_text(body, "text/html")
        self.assertIn("Report & annex", text)
        self.assertNotIn("PLEXOS", text)
        self.assertEqual(ce.dates_in(meta, "https://x.org/a")["citation_publication_date"], "2021/03/04")

    def test_pdf_creation_date_is_a_candidate(self):
        _, meta = ce.page_text(b"%PDF-1.7 ... /CreationDate (D:20190225120000) ...", "application/pdf")
        self.assertEqual(meta["pdf_created"], "2019-02-25")

    def test_url_date_needs_year_and_month(self):
        self.assertEqual(ce.dates_in({}, "https://site.org/2022/07/report/")["url"], "2022-07")
        self.assertNotIn("url", ce.dates_in({}, "https://site.org/plans/2050/"))

    def test_bot_walls_are_not_dead_links(self):
        with mock.patch.object(ce, "fetch", return_value=(403, "", b"")), mock.patch.object(ce, "archive_copy") as arch:
            self.assertFalse(ce.check_link("https://example.org")["dead"])
            arch.assert_not_called()
        with mock.patch.object(ce, "fetch", return_value=("URLError", "", b"")), \
                mock.patch.object(ce, "archive_copy", return_value="https://web.archive.org/web/1/x"):
            res = ce.check_link("https://gone.example")
            self.assertTrue(res["dead"])
            self.assertEqual(res["archive"], "https://web.archive.org/web/1/x")


def project(**kw):
    p = {"tool_name": "PLEXOS", "project_id": "P1", "project_title": "Grid study", "tool_category": "production_cost",
         "countries": ["Chile"], "sources": [{"title": "Study", "quote": "modelled in PLEXOS"}],
         "organizations": [{"name": "Coordinador", "role": "direct_user", "institution_category": "utility_iso_rto"}]}
    p.update(kw)
    return p


class Audit(unittest.TestCase):
    tools = {"PLEXOS": {"vendor": "Energy Exemplar", "categories": ["production_cost", "capacity_expansion"]}}

    def run_audit(self, *projects):
        return ad.audit(list(projects), self.tools, 2026)

    def test_clean_project_has_no_strict_findings(self):
        found = self.run_audit(project())
        self.assertFalse(any(found[n] for n in ad.STRICT))

    def test_strict_checks(self):
        found = self.run_audit(
            project(project_id="V", organizations=[{"name": "Energy Exemplar Pty", "role": "direct_user", "institution_category": "vendor"}]),
            project(project_id="C", tool_category="power_flow_dynamics"),
            project(project_id="Y", year=2031),
            project(project_id="T", project_title="Microsoft Word - Draft_Report_4.doc"),
            project(project_id="K", organizations=[{"name": "Energy Exemplary Institute", "role": "direct_user", "institution_category": "academic_research"}]),
        )
        self.assertEqual([r[1] for r in found["vendor_as_user"]], ["V"])
        self.assertEqual([r[1] for r in found["category_out_of_scope"]], ["C"])
        self.assertEqual([r[1] for r in found["future_year"]], ["Y"])
        self.assertEqual([r[1] for r in found["placeholder_title"]], ["T"])

    def test_review_checks(self):
        found = self.run_audit(project(project_id="Q", sources=[{"title": "Annual report", "quote": "we model the grid"}]),
                               project(project_id="M", countries=["Chile", "Peru"],
                                       sources=[{"title": "Chile plan", "quote": "PLEXOS"}, {"title": "Peru plan", "quote": "PLEXOS"}]))
        self.assertEqual([r[1] for r in found["tool_not_in_evidence"]], ["Q"])
        self.assertEqual([r[1] for r in found["mixed_project"]], ["M"])
        self.assertEqual(found["single_project_grid_org"], [])  # Coordinador has two projects here


if __name__ == "__main__":
    unittest.main()
