-- ============================================================
-- Seed Business Tasks for EasyNav across all 10 roles
-- Uses hardcoded role UUIDs from the database
-- ============================================================

-- Get user_id
DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users LIMIT 1;

  -- CEO — 7ffa27eb-467a-406a-986b-d4bc5b23bdbd
  INSERT INTO penta.business_tasks (user_id, role_id, title, due_date) VALUES
  (v_uid, '7ffa27eb-467a-406a-986b-d4bc5b23bdbd', 'Determine new pricing tiers and free trial period (7-day vs 14-day vs 30-day)', '2026-03-22'),
  (v_uid, '7ffa27eb-467a-406a-986b-d4bc5b23bdbd', 'Research competitor pricing — WiseNav, MappedIn, Pointr, Jibestream — document why EasyNav is cheapest', '2026-03-25'),
  (v_uid, '7ffa27eb-467a-406a-986b-d4bc5b23bdbd', 'Write 1-page pricing justification doc explaining value per dollar vs competitors', '2026-03-29'),
  (v_uid, '7ffa27eb-467a-406a-986b-d4bc5b23bdbd', 'Define free trial → paid conversion flow and what happens when trial expires', '2026-03-29'),
  (v_uid, '7ffa27eb-467a-406a-986b-d4bc5b23bdbd', 'Set quarterly OKRs for Q2 2026 (revenue targets, clients signed, product milestones)', '2026-04-01'),
  (v_uid, '7ffa27eb-467a-406a-986b-d4bc5b23bdbd', 'Decide target order: private hospitals first, then hotels, then libraries/public', '2026-03-22'),
  (v_uid, '7ffa27eb-467a-406a-986b-d4bc5b23bdbd', 'Draft email template for initial outreach to facility managers', '2026-04-05'),
  (v_uid, '7ffa27eb-467a-406a-986b-d4bc5b23bdbd', 'Prepare elevator pitch — 30 second and 2 minute versions', '2026-04-05'),
  (v_uid, '7ffa27eb-467a-406a-986b-d4bc5b23bdbd', 'Research government grants available for Qld tech startups (Advance Qld, R&D Tax Incentive)', '2026-04-15'),
  (v_uid, '7ffa27eb-467a-406a-986b-d4bc5b23bdbd', 'Draft letter to Mayor Adrian Schrinner re: Brisbane 2032 Olympics wayfinding partnership', '2026-04-15'),
  (v_uid, '7ffa27eb-467a-406a-986b-d4bc5b23bdbd', 'Research which Brisbane 2032 venues are under construction and would benefit from navigation', '2026-04-20'),
  (v_uid, '7ffa27eb-467a-406a-986b-d4bc5b23bdbd', 'Identify the right contact at Brisbane City Council for smart city / tech partnerships', '2026-04-20'),
  (v_uid, '7ffa27eb-467a-406a-986b-d4bc5b23bdbd', 'Create a simple financial model — costs, projected revenue, break-even timeline', '2026-05-01'),
  (v_uid, '7ffa27eb-467a-406a-986b-d4bc5b23bdbd', 'Prepare a 1-page investor brief in case of angel interest', '2026-05-15');

  -- Engineer — fa30c902-2dfb-4d21-8431-b3bc8c031d3d
  INSERT INTO penta.business_tasks (user_id, role_id, title, due_date) VALUES
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Fix runtime navigation bugs between different sections of the app', '2026-03-19'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Test all navigation transitions and document remaining edge cases', '2026-03-20'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Fix any crash/error states when switching between map views', '2026-03-21'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Design floor plans for fake demo hospital (3 floors minimum)', '2026-03-29'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Add demo hospital as a new site in the app with all floor plans', '2026-04-05'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Add all destinations to demo hospital (reception, wards, radiology, pharmacy, cafeteria, etc.)', '2026-04-08'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Test demo hospital navigation end-to-end on both iOS and Android', '2026-04-10'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Create demo video — screen recording walking through the app with mouse clicks', '2026-04-15'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Create phone-view version of demo video for mobile showcase', '2026-04-17'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Build store section in admin panel for QR code stands', '2026-04-25'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Add colour/style options for QR stands in the store', '2026-04-28'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Integrate Stripe/payment processing for stand purchases', '2026-05-05'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Build automated weekly email report system for clients', '2026-05-10'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Track: total users helped, most visited destinations, problem areas, peak times', '2026-05-10'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Ensure zero personal data collection — verify no PII stored, document in code', '2026-04-01'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Build new marketing website (WiseNav-style design)', '2026-04-20'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Embed demo video on new website landing page', '2026-04-22'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Add pricing page with tier comparison table', '2026-04-25'),
  (v_uid, 'fa30c902-2dfb-4d21-8431-b3bc8c031d3d', 'Add free trial signup flow on website', '2026-04-28');

  -- Designer — e203cf35-b85f-40dc-8110-8366c40e2604
  INSERT INTO penta.business_tasks (user_id, role_id, title, due_date) VALUES
  (v_uid, 'e203cf35-b85f-40dc-8110-8366c40e2604', 'Design demo hospital floor plans — clean, professional, realistic layout', '2026-03-29'),
  (v_uid, 'e203cf35-b85f-40dc-8110-8366c40e2604', 'Design 3 colour variants for QR code stands (white, black, brushed steel)', '2026-04-05'),
  (v_uid, 'e203cf35-b85f-40dc-8110-8366c40e2604', 'Design QR code stand product photos for the admin store', '2026-04-10'),
  (v_uid, 'e203cf35-b85f-40dc-8110-8366c40e2604', 'Design new marketing website — WiseNav-style, modern, clean, trust-building', '2026-04-12'),
  (v_uid, 'e203cf35-b85f-40dc-8110-8366c40e2604', 'Design PowerPoint presentation template with EasyNav branding', '2026-04-15'),
  (v_uid, 'e203cf35-b85f-40dc-8110-8366c40e2604', 'Design invoice template with EasyNav logo and ABN', '2026-04-01'),
  (v_uid, 'e203cf35-b85f-40dc-8110-8366c40e2604', 'Design email templates for automated client reports', '2026-05-01'),
  (v_uid, 'e203cf35-b85f-40dc-8110-8366c40e2604', 'Create brand guidelines doc (logo usage, colours, fonts, tone of voice)', '2026-04-20'),
  (v_uid, 'e203cf35-b85f-40dc-8110-8366c40e2604', 'Design sales one-pager / leave-behind PDF for facility managers', '2026-04-25'),
  (v_uid, 'e203cf35-b85f-40dc-8110-8366c40e2604', 'Design onboarding welcome email for new trial clients', '2026-05-05');

  -- Sales — 6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3
  INSERT INTO penta.business_tasks (user_id, role_id, title, due_date) VALUES
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Build target list: all private hospitals in Brisbane (Mater, St Andrews, Greenslopes, Wesley, etc.)', '2026-04-01'),
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Build target list: major hotels in Brisbane CBD and surrounds', '2026-04-05'),
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Build target list: Brisbane City Council libraries', '2026-04-05'),
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Build target list: shopping centres, universities, airports', '2026-04-10'),
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Find facility manager / operations contact for each target', '2026-04-15'),
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Create PowerPoint sales presentation with local data and facts', '2026-04-20'),
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Include published research on wayfinding reducing patient anxiety and missed appointments', '2026-04-20'),
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Include stats on hospital visitor confusion rates and staff time spent giving directions', '2026-04-20'),
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Add ROI calculation slide showing cost savings vs staff time redirecting visitors', '2026-04-22'),
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Add competitive comparison slide — EasyNav vs alternatives (price, features, setup time)', '2026-04-22'),
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Send first batch of outreach emails to top 5 private hospitals', '2026-04-25'),
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Follow up on all sent emails within 3 business days', '2026-04-30'),
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Book first demo meeting with a facility manager', '2026-05-05'),
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Prepare objection handling doc (cost, implementation time, privacy concerns)', '2026-04-25'),
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Prepare subscription agreement template for clients', '2026-05-01'),
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Prepare free trial agreement (what''s included, data handling, exit terms)', '2026-05-01'),
  (v_uid, '6a70ceac-7168-4f12-a8d6-12f8fe6ecfc3', 'Set up CRM or spreadsheet to track outreach pipeline', '2026-04-10');

  -- Marketing — 776da3b3-5399-4814-8331-cbb099b40028
  INSERT INTO penta.business_tasks (user_id, role_id, title, due_date) VALUES
  (v_uid, '776da3b3-5399-4814-8331-cbb099b40028', 'Create demo walkthrough video for website and sales presentations', '2026-04-17'),
  (v_uid, '776da3b3-5399-4814-8331-cbb099b40028', 'Write website copy — hero section, features, how it works, pricing, FAQ', '2026-04-15'),
  (v_uid, '776da3b3-5399-4814-8331-cbb099b40028', 'Set up Google Business Profile for EasyNav', '2026-03-29'),
  (v_uid, '776da3b3-5399-4814-8331-cbb099b40028', 'Create LinkedIn company page for EasyNav', '2026-03-29'),
  (v_uid, '776da3b3-5399-4814-8331-cbb099b40028', 'Write 3 LinkedIn posts: launch announcement, problem/solution, behind-the-scenes', '2026-04-05'),
  (v_uid, '776da3b3-5399-4814-8331-cbb099b40028', 'Research SEO keywords: "indoor navigation app", "hospital wayfinding", "visitor navigation"', '2026-04-10'),
  (v_uid, '776da3b3-5399-4814-8331-cbb099b40028', 'Write a case study template ready for first client', '2026-05-01'),
  (v_uid, '776da3b3-5399-4814-8331-cbb099b40028', 'Source published data on wayfinding needs (HFMA, Deloitte health reports, WHO)', '2026-04-10'),
  (v_uid, '776da3b3-5399-4814-8331-cbb099b40028', 'Create social proof section — any beta feedback, testimonials, or pilot data', '2026-05-10'),
  (v_uid, '776da3b3-5399-4814-8331-cbb099b40028', 'Set up Google Analytics on new website', '2026-04-25'),
  (v_uid, '776da3b3-5399-4814-8331-cbb099b40028', 'Buy domains: easynav.app, easynav.com, easynav.com.au (check availability)', '2026-03-22'),
  (v_uid, '776da3b3-5399-4814-8331-cbb099b40028', 'Set up proper email signatures with EasyNav branding', '2026-03-25');

  -- Customer Success — 506d033e-14ca-47bb-8f9b-4c5b4a9a3a95
  INSERT INTO penta.business_tasks (user_id, role_id, title, due_date) VALUES
  (v_uid, '506d033e-14ca-47bb-8f9b-4c5b4a9a3a95', 'Design client onboarding flow: signup → floor plan upload → destination setup → go live', '2026-04-20'),
  (v_uid, '506d033e-14ca-47bb-8f9b-4c5b4a9a3a95', 'Write onboarding guide / getting started PDF for new clients', '2026-04-25'),
  (v_uid, '506d033e-14ca-47bb-8f9b-4c5b4a9a3a95', 'Create FAQ document answering top 20 questions facility managers will ask', '2026-04-25'),
  (v_uid, '506d033e-14ca-47bb-8f9b-4c5b4a9a3a95', 'Design weekly automated report email — users helped, popular destinations, problem zones', '2026-05-10'),
  (v_uid, '506d033e-14ca-47bb-8f9b-4c5b4a9a3a95', 'Write email explaining no personal data is collected — ready to send to privacy-concerned clients', '2026-04-15'),
  (v_uid, '506d033e-14ca-47bb-8f9b-4c5b4a9a3a95', 'Plan check-in cadence: Day 1 welcome, Day 7 check-in, Day 14 review, Day 30 renewal chat', '2026-05-01'),
  (v_uid, '506d033e-14ca-47bb-8f9b-4c5b4a9a3a95', 'Create support email address and set up auto-responder', '2026-04-01'),
  (v_uid, '506d033e-14ca-47bb-8f9b-4c5b4a9a3a95', 'Write troubleshooting guide for common QR code scanning issues', '2026-05-05'),
  (v_uid, '506d033e-14ca-47bb-8f9b-4c5b4a9a3a95', 'Prepare renewal/upsell talking points for end of free trial', '2026-05-15');

  -- Operations — efe90c8d-caed-47b8-880d-5903a943069d
  INSERT INTO penta.business_tasks (user_id, role_id, title, due_date) VALUES
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Finish and send ANZ email to sign docs for two business accounts', '2026-03-18'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Set up Xero accounting and connect ANZ business accounts', '2026-03-29'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Create invoice template in Xero with EasyNav branding and ABN', '2026-04-01'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Test invoice → payment flow through Xero (send test invoice, verify receipt)', '2026-04-05'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Set up Xero bank feed rules for categorising expenses', '2026-04-10'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Get professional indemnity insurance — compare BizCover, CGU, QBE quotes', '2026-03-25'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Get public liability insurance — need minimum $10M for enterprise clients', '2026-03-25'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Get cyber security insurance — required for health sector clients', '2026-03-25'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Save all insurance certificates of currency — clients will request these', '2026-03-29'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Register business name officially with ASIC (if not already done)', '2026-03-22'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Trademark "EasyNav" — file with IP Australia (class 9: software, class 42: SaaS)', '2026-03-29'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Trademark the EasyNav logo with IP Australia', '2026-03-29'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Remake privacy policy — must comply with Australian Privacy Act and APP guidelines', '2026-04-05'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Remake terms and conditions for the app and website', '2026-04-05'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Remake terms of service / subscription agreement for B2B clients', '2026-04-08'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Create data processing agreement (DPA) template — hospitals will require this', '2026-04-10'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Document data handling practices — what is collected, where stored, retention period', '2026-04-10'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Research QR code stand suppliers — Alibaba, local AU suppliers, Amazon Business', '2026-04-01'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Order sample QR stands in 3 colours for quality testing', '2026-04-08'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Test QR stands — durability, scan distance, visibility, mounting options', '2026-04-15'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Determine pricing and margin for QR stands sold through admin store', '2026-04-20'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Set up supplier relationship and bulk ordering process', '2026-04-25'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Set up receipt/expense tracking system (Xero Expenses or similar)', '2026-04-15'),
  (v_uid, 'efe90c8d-caed-47b8-880d-5903a943069d', 'Prepare BAS lodgement process for GST reporting', '2026-05-01');

  -- Data / Analytics — 7e7db080-6da5-491b-af71-36a399343f1d
  INSERT INTO penta.business_tasks (user_id, role_id, title, due_date) VALUES
  (v_uid, '7e7db080-6da5-491b-af71-36a399343f1d', 'Define key metrics to track: scans per day, destinations searched, completion rate, drop-off points', '2026-04-05'),
  (v_uid, '7e7db080-6da5-491b-af71-36a399343f1d', 'Build analytics dashboard for internal use (Supabase + Metabase or custom)', '2026-04-20'),
  (v_uid, '7e7db080-6da5-491b-af71-36a399343f1d', 'Build client-facing analytics dashboard in admin panel', '2026-05-01'),
  (v_uid, '7e7db080-6da5-491b-af71-36a399343f1d', 'Create weekly report data pipeline — aggregate anonymous usage data per site', '2026-05-10'),
  (v_uid, '7e7db080-6da5-491b-af71-36a399343f1d', 'Identify "problem areas" algorithm — destinations with high search but low completion', '2026-05-15'),
  (v_uid, '7e7db080-6da5-491b-af71-36a399343f1d', 'Build peak hours analysis — when do most visitors use navigation?', '2026-05-15'),
  (v_uid, '7e7db080-6da5-491b-af71-36a399343f1d', 'Create demo analytics with fake data for sales presentations', '2026-04-20'),
  (v_uid, '7e7db080-6da5-491b-af71-36a399343f1d', 'Document all data points collected and confirm zero PII', '2026-04-05'),
  (v_uid, '7e7db080-6da5-491b-af71-36a399343f1d', 'Research what analytics hospital operations teams actually want to see', '2026-04-10');

  -- Biz Dev — 866017ad-d150-47a0-b866-0816cdc2d287
  INSERT INTO penta.business_tasks (user_id, role_id, title, due_date) VALUES
  (v_uid, '866017ad-d150-47a0-b866-0816cdc2d287', 'Research Brisbane 2032 Olympics organising committee and venue contracts', '2026-04-10'),
  (v_uid, '866017ad-d150-47a0-b866-0816cdc2d287', 'Identify which Olympic venues (Gabba, BCEC, RNA Showgrounds) need wayfinding', '2026-04-15'),
  (v_uid, '866017ad-d150-47a0-b866-0816cdc2d287', 'Draft proposal for Mayor Adrian Schrinner — EasyNav for Brisbane smart city initiative', '2026-04-20'),
  (v_uid, '866017ad-d150-47a0-b866-0816cdc2d287', 'Research Trade & Investment Queensland programs for tech startups', '2026-04-15'),
  (v_uid, '866017ad-d150-47a0-b866-0816cdc2d287', 'Apply to any relevant Brisbane City Council innovation programs', '2026-04-25'),
  (v_uid, '866017ad-d150-47a0-b866-0816cdc2d287', 'Research private hospital groups in QLD (Ramsay, Healthscope, UnitingCare) — who makes tech decisions?', '2026-04-05'),
  (v_uid, '866017ad-d150-47a0-b866-0816cdc2d287', 'Research hotel chains with Brisbane properties (Marriott, Accor, IHG) — regional ops contacts', '2026-04-10'),
  (v_uid, '866017ad-d150-47a0-b866-0816cdc2d287', 'Research State Library of QLD and Brisbane City Council library network contacts', '2026-04-10'),
  (v_uid, '866017ad-d150-47a0-b866-0816cdc2d287', 'Explore university campus partnerships (UQ, QUT, Griffith)', '2026-04-20'),
  (v_uid, '866017ad-d150-47a0-b866-0816cdc2d287', 'Research aged care facilities as a potential market', '2026-04-25'),
  (v_uid, '866017ad-d150-47a0-b866-0816cdc2d287', 'Explore airport partnership potential (Brisbane Airport Corporation)', '2026-05-01'),
  (v_uid, '866017ad-d150-47a0-b866-0816cdc2d287', 'Identify potential integration partners (hospital management software, property management)', '2026-05-05'),
  (v_uid, '866017ad-d150-47a0-b866-0816cdc2d287', 'Research joining Brisbane tech community (River City Labs, Startup Grind Brisbane)', '2026-04-01'),
  (v_uid, '866017ad-d150-47a0-b866-0816cdc2d287', 'Attend next Brisbane startup/tech networking event', '2026-04-15');

  -- DevOps — aac9a50c-4e12-43b7-8dbd-f11ba6359326
  INSERT INTO penta.business_tasks (user_id, role_id, title, due_date) VALUES
  (v_uid, 'aac9a50c-4e12-43b7-8dbd-f11ba6359326', 'Set up Google Workspace for EasyNav (Business Starter plan — $7.20/user/month)', '2026-03-22'),
  (v_uid, 'aac9a50c-4e12-43b7-8dbd-f11ba6359326', 'Configure custom email domain (levi@easynav.com.au or similar)', '2026-03-25'),
  (v_uid, 'aac9a50c-4e12-43b7-8dbd-f11ba6359326', 'Set up email aliases: hello@, support@, billing@, info@', '2026-03-25'),
  (v_uid, 'aac9a50c-4e12-43b7-8dbd-f11ba6359326', 'Configure SPF, DKIM, and DMARC records for email deliverability', '2026-03-27'),
  (v_uid, 'aac9a50c-4e12-43b7-8dbd-f11ba6359326', 'Set up Google Workspace security — 2FA, recovery email, admin controls', '2026-03-27'),
  (v_uid, 'aac9a50c-4e12-43b7-8dbd-f11ba6359326', 'Buy and configure easynav.app domain', '2026-03-22'),
  (v_uid, 'aac9a50c-4e12-43b7-8dbd-f11ba6359326', 'Buy and configure easynav.com domain (if available, otherwise .co)', '2026-03-22'),
  (v_uid, 'aac9a50c-4e12-43b7-8dbd-f11ba6359326', 'Set up DNS records and SSL certificates for all domains', '2026-03-25'),
  (v_uid, 'aac9a50c-4e12-43b7-8dbd-f11ba6359326', 'Configure domain redirects — all domains point to primary', '2026-03-27'),
  (v_uid, 'aac9a50c-4e12-43b7-8dbd-f11ba6359326', 'Set up uptime monitoring (UptimeRobot or Better Stack) for app and website', '2026-04-01'),
  (v_uid, 'aac9a50c-4e12-43b7-8dbd-f11ba6359326', 'Set up error tracking (Sentry) for the runtime app', '2026-04-05'),
  (v_uid, 'aac9a50c-4e12-43b7-8dbd-f11ba6359326', 'Configure automated database backups in Supabase', '2026-04-05'),
  (v_uid, 'aac9a50c-4e12-43b7-8dbd-f11ba6359326', 'Set up CI/CD pipeline for app deployments (GitHub Actions)', '2026-04-10'),
  (v_uid, 'aac9a50c-4e12-43b7-8dbd-f11ba6359326', 'Document deployment process and runbook for production issues', '2026-04-15'),
  (v_uid, 'aac9a50c-4e12-43b7-8dbd-f11ba6359326', 'Security audit — review Supabase RLS policies, API keys, environment variables', '2026-04-10'),
  (v_uid, 'aac9a50c-4e12-43b7-8dbd-f11ba6359326', 'Set up staging environment for testing before production deploys', '2026-04-20');

END $$;
