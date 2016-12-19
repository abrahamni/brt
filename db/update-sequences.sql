SELECT setval('forms_id_seq', (SELECT MAX(id) FROM forms));
SELECT setval('form_sections_id_seq', (SELECT MAX(id) FROM form_sections));
SELECT setval('form_items_id_seq', (SELECT MAX(id) FROM form_items));
SELECT setval('form_item_options_id_seq', (SELECT MAX(id) FROM form_item_options));
SELECT setval('form_responses_id_seq', (SELECT MAX(id) FROM form_responses));
SELECT setval('form_response_items_id_seq', (SELECT MAX(id) FROM form_response_items));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));