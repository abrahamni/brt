INSERT INTO 
    form_item_option_translations (option_id, lang, label) 
VALUES 
    ($1, $2, $3)
ON CONFLICT 
    (option_id, lang) 
DO UPDATE SET 
    label = $3;