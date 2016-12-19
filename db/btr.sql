-------------------------------
-- super user, languages
-------------------------------
BEGIN;
INSERT INTO users VALUES (1, 'admin', 'XYZ', 1, null, null, '{}');
UPDATE languages SET enabled = true WHERE code = 'fa' OR code = 'en';
COMMIT;



-------------------------------
-- ui_translations
-------------------------------
BEGIN;
INSERT INTO ui_translations (lang, t_key, t_value, t_group) VALUES
('en', 'form-success-message', 'Thanks! Your reports has been submitted.', 'messages'),
('en', 'map-caption-all-items', 'All Reports', 'labels'),

('en', 'head-title', 'AAAA', 'labels'), 
('en', 'dashboard', 'Dashboard', 'labels'), 
('en', 'about', 'About', 'labels'), 
('en', 'browse-reports', 'Browse Reports', 'labels'),
('en', 'latest-reports', 'Latest Reports', 'labels'), 
('en', 'back-to-reports-browser', '&larr; Back to reports', 'labels'),
('en', 'apply-range', 'Apply range', 'labels'),
('en', 'load-more', 'Load more', 'labels'), 
('en', 'search-reports', 'Type to search...', 'labels'), 
('en', 'submit', 'Submit', 'labels'), 
('en', 'cancel', 'Cancel', 'labels'), 
('en', 'done', 'Done', 'labels'), 
('en', 'not-done', 'Not Done', 'labels'),
('en', 'good', 'Honest', 'labels'),;
COMMIT;



-------------------------------
-- forms, form_translations, form_sections, form_section_translations
-------------------------------
BEGIN;
INSERT INTO forms VALUES ('1', now(), now(), '{}', '1', '0');
INSERT INTO form_translations VALUES ('1', 'en', 'I ---', null);
INSERT INTO form_sections VALUES ('1', '1', '0', '{}', '1');
INSERT INTO form_section_translations VALUES ('1', 'en', 'Default section', null);
COMMIT;



-------------------------------
--  form_items, form_item_translations
-------------------------------
BEGIN;
INSERT INTO form_items VALUES ('1', '1', '1', '0', '4', '{"required": true, "allow_multiple": false, "show_in_short_story": true}', '0');
INSERT INTO form_items VALUES ('2', '1', '1', '1', '4', '{"show_if": 1, "allow_multiple": false, "show_in_short_story": true}', '0');
INSERT INTO form_items VALUES ('3', '1', '1', '0', '4', '{"required": true, "allow_multiple": false, "show_in_short_story": true}', '3');
INSERT INTO form_items VALUES ('4', '1', '1', '0', '4', '{"depends_on": 3, "required": true, "allow_multiple": false}', '3');
INSERT INTO form_items VALUES ('5', '1', '1', '0', '5', '{"required": true}', '3');
INSERT INTO form_items VALUES ('6', '1', '1', '0', '7', '{"required": true}', '3');
INSERT INTO form_items VALUES ('7', '1', '1', '0', '2', '{"required": true}', '3');
INSERT INTO form_items VALUES ('8', '1', '1', '0', '1', '{"show_in_short_story": true}', '3');
INSERT INTO form_items VALUES ('9', '1', '1', '0', '1', '{"multiline": true}', '3');
INSERT INTO form_items VALUES ('10', '1', '1', '0', '4', '{"hidden_from_map": true, "hidden_from_public": true}', '1');
INSERT INTO form_items VALUES ('11', '1', '1', '10', '1', '{"show_if": 667, "hidden_from_public": true}', '2');
INSERT INTO form_items VALUES ('12', '1', '1', '10', '1', '{"show_if": 667, "hidden_from_public": true}', '2');
INSERT INTO form_items VALUES ('13', '1', '1', '10', '1', '{"show_if": 667, "hidden_from_public": true}', '2');

INSERT INTO form_item_translations VALUES ('1', 'en', 'Where you asked -----?', null, null);
INSERT INTO form_item_translations VALUES ('2', 'en', 'Did you ---?', null, null);
INSERT INTO form_item_translations VALUES ('3', 'en', 'What area ----?', null, null);
INSERT INTO form_item_translations VALUES ('4', 'en', 'Why you were asked ---?', null, null);
INSERT INTO form_item_translations VALUES ('5', 'en', 'City', null, null);
INSERT INTO form_item_translations VALUES ('6', 'en', 'Date', null, null);
INSERT INTO form_item_translations VALUES ('7', 'en', 'How?', null, null);
INSERT INTO form_item_translations VALUES ('8', 'en', 'A title for the report', null, null);
INSERT INTO form_item_translations VALUES ('9', 'en', 'Detailed comment for the report', null, null);
INSERT INTO form_item_translations VALUES ('10', 'en', 'Contact details', null, null);
INSERT INTO form_item_translations VALUES ('11', 'en', 'Your full name', null, null);
INSERT INTO form_item_translations VALUES ('12', 'en', 'Your email address', null, null);
INSERT INTO form_item_translations VALUES ('13', 'en', 'Your contact number', null, null);
COMMIT;



-------------------------------
-- form_item_options, form_item_option_translations
-------------------------------
BEGIN;




INSERT INTO form_item_option_translations VALUES ('1', 'en', 'Yes');
INSERT INTO form_item_option_translations VALUES ('2', 'en', 'No');
INSERT INTO form_item_option_translations VALUES ('3', 'en', 'Yes,--');
INSERT INTO form_item_option_translations VALUES ('4', 'en', 'No, --');
INSERT INTO form_item_option_translations VALUES ('5', 'en', 'AAAA');
INSERT INTO form_item_option_translations VALUES ('6', 'en', 'BBBB');

INSERT INTO form_item_option_translations VALUES ('666', 'en', 'I want to stay anonymous');
INSERT INTO form_item_option_translations VALUES ('667', 'en', 'I want to share my contact information');
COMMIT;
