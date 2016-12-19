INSERT INTO 
    ui_translations (t_key, t_group, lang, t_value) 
VALUES 
    ($1, (SELECT t_group FROM ui_translations WHERE t_key = $1 LIMIT 1), $2, $3)
ON CONFLICT 
    (t_key, lang) 
DO UPDATE SET
    t_value = $3;