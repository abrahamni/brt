INSERT INTO 
    form_item_translations (item_id, lang, label) 
VALUES 
    ($1, $2, $3)
ON CONFLICT 
    (item_id, lang) 
DO UPDATE SET 
    label = $3;