ALTER TABLE users ADD CONSTRAINT user_permission_fk FOREIGN KEY (permission) REFERENCES permissions(id);

ALTER TABLE user_tokens ADD CONSTRAINT user_token_token_type_fk FOREIGN KEY (token_type) REFERENCES user_token_types(id);
ALTER TABLE user_tokens ADD CONSTRAINT user_token_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE forms ADD CONSTRAINT form_status_fk FOREIGN KEY (status) REFERENCES generic_statuses(id);

ALTER TABLE form_translations ADD CONSTRAINT form_translation_form_id_fk FOREIGN KEY (form_id) REFERENCES forms(id);
ALTER TABLE form_translations ADD CONSTRAINT form_translation_lang_fk FOREIGN KEY (lang) REFERENCES languages(code);

ALTER TABLE form_sections ADD CONSTRAINT form_section_form_id_fk FOREIGN KEY (form_id) REFERENCES forms(id);

ALTER TABLE form_section_translations ADD CONSTRAINT form_section_translation_section_id_fk FOREIGN KEY (section_id) REFERENCES form_sections(id);
ALTER TABLE form_section_translations ADD CONSTRAINT form_section_translation_lang_fk FOREIGN KEY (lang) REFERENCES languages(code);

ALTER TABLE form_items ADD CONSTRAINT form_item_form_id_fk FOREIGN KEY (form_id) REFERENCES forms(id);
ALTER TABLE form_items ADD CONSTRAINT form_item_section_id_fk FOREIGN KEY (section_id) REFERENCES form_sections(id);
ALTER TABLE form_items ADD CONSTRAINT form_item_type_fk FOREIGN KEY (type) REFERENCES form_item_types(id);

ALTER TABLE form_item_translations ADD CONSTRAINT form_item_translation_item_id_fk FOREIGN KEY (item_id) REFERENCES form_items(id);
ALTER TABLE form_item_translations ADD CONSTRAINT form_item_translation_lang_fk FOREIGN KEY (lang) REFERENCES languages(code);

ALTER TABLE form_item_options ADD CONSTRAINT form_item_option_form_id_fk FOREIGN KEY (form_id) REFERENCES forms(id);
ALTER TABLE form_item_options ADD CONSTRAINT form_item_option_section_id_fk FOREIGN KEY (section_id) REFERENCES form_sections(id);
ALTER TABLE form_item_options ADD CONSTRAINT form_item_option_item_id_fk FOREIGN KEY (item_id) REFERENCES form_items(id);

ALTER TABLE form_item_option_translations ADD CONSTRAINT form_item_option_translation_option_id_fk FOREIGN KEY (option_id) REFERENCES form_item_options(id);
ALTER TABLE form_item_option_translations ADD CONSTRAINT form_item_option_translation_lang_fk FOREIGN KEY (lang) REFERENCES languages(code);

ALTER TABLE form_responses ADD CONSTRAINT form_response_form_id_fk FOREIGN KEY (form_id) REFERENCES forms(id);
ALTER TABLE form_responses ADD CONSTRAINT form_response_status_fk FOREIGN KEY (status) REFERENCES generic_statuses(id);

ALTER TABLE form_response_items ADD CONSTRAINT form_response_item_response_id_fk FOREIGN KEY (response_id) REFERENCES form_responses(id);
ALTER TABLE form_response_items ADD CONSTRAINT form_response_item_form_id_fk FOREIGN KEY (form_id) REFERENCES forms(id);
ALTER TABLE form_response_items ADD CONSTRAINT form_response_item_item_id_fk FOREIGN KEY (item_id) REFERENCES form_items(id);
ALTER TABLE form_response_items ADD CONSTRAINT form_response_item_option_id_fk FOREIGN KEY (option_id) REFERENCES form_item_options(id);

ALTER TABLE form_response_item_translations ADD CONSTRAINT form_response_item_translation_response_item_id_fk FOREIGN KEY (response_item_id) REFERENCES form_response_items(id);
ALTER TABLE form_response_item_translations ADD CONSTRAINT form_response_item_translation_lang_fk FOREIGN KEY (lang) REFERENCES languages(code);

ALTER TABLE form_response_intervals ADD CONSTRAINT form_response_interval_form_id_fk FOREIGN KEY (form_id) REFERENCES forms(id);

ALTER TABLE form_response_interval_translations ADD CONSTRAINT form_response_interval_translation_interval_id_fk FOREIGN KEY (interval_id) REFERENCES form_response_intervals(id);
ALTER TABLE form_response_interval_translations ADD CONSTRAINT form_response_interval_translation_lang_fk FOREIGN KEY (lang) REFERENCES languages(code);

ALTER TABLE ui_translations ADD CONSTRAINT ui_translation_lang_fk FOREIGN KEY (lang) REFERENCES languages(code);